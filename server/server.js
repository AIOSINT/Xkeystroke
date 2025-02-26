const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const scannerRoutes = require('./routes/scannerRoutes');

const app = express();
const port = 3001;
const usersFile = path.join(__dirname, 'users.json');
const algorithm = 'aes-256-ctr';
let secretKey;

// Load or generate secret key
const configPath = path.join(__dirname, 'config.json');
try {
    const config = JSON.parse(fs.readFileSync(configPath));
    if (config.secretKey) {
        secretKey = Buffer.from(config.secretKey, 'hex');
    } else {
        secretKey = crypto.randomBytes(32);
        fs.writeFileSync(configPath, JSON.stringify({
            ...config,
            secretKey: secretKey.toString('hex')
        }, null, 2));
    }
} catch (error) {
    secretKey = crypto.randomBytes(32);
    fs.writeFileSync(configPath, JSON.stringify({
        secretKey: secretKey.toString('hex')
    }, null, 2));
}

// Initialize users.json if it doesn't exist with proper structure
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify({
        users: [],
        lastUpdated: new Date().toISOString()
    }, null, 2));
}

// Ensure the file has read/write permissions
fs.chmodSync(usersFile, 0o666);

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-role']
}));
app.use(bodyParser.json());

// Encryption functions
const encrypt = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (hash) => {
    try {
        const [ivHex, encryptedHex] = hash.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
};

// Update the validateAdmin middleware
const validateAdmin = async (req, res, next) => {
    try {
        const userRole = req.headers['user-role'];
        console.log('Validating admin access. User role:', userRole);

        if (!userRole) {
            console.log('No user role provided');
            return res.status(403).json({ message: 'No user role provided' });
        }

        if (userRole.toLowerCase() !== 'admin') {
            console.log('User is not admin:', userRole);
            return res.status(403).json({ message: 'Not authorized' });
        }

        console.log('Admin access granted');
        next();
    } catch (error) {
        console.error('Admin validation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Routes
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username });

    try {
        const usersData = JSON.parse(fs.readFileSync(usersFile));
        const users = usersData.users || [];
        const user = users.find(u => u.username === username);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const decryptedPassword = decrypt(user.password);
        if (password === decryptedPassword) {
            res.json({ 
                token: 'dummy-token',
                user: {
                    username: user.username,
                    uuid: user.uuid,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    console.log('Signup attempt:', { username });

    try {
        // Read existing users
        const usersData = JSON.parse(fs.readFileSync(usersFile));
        const users = usersData.users || [];
        
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const uuid = uuidv4();
        const newUser = {
            uuid,
            username,
            password: encrypt(password),
            role: 'user',
            createdAt: new Date().toISOString()
        };

        // Add new user and update file
        users.push(newUser);
        fs.writeFileSync(usersFile, JSON.stringify({
            users: users,
            lastUpdated: new Date().toISOString()
        }, null, 2));

        const userResponse = { ...newUser };
        delete userResponse.password;

        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/users', validateAdmin, (req, res) => {
    try {
        const usersData = JSON.parse(fs.readFileSync(usersFile));
        // Ensure we're accessing the users array from the data structure
        const users = usersData.users || [];
        
        // Map users and remove sensitive data
        const sanitizedUsers = users.map(user => ({
            uuid: user.uuid,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt
        }));
        
        res.json(sanitizedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/users/:uuid', validateAdmin, async (req, res) => {
    try {
        const { uuid } = req.params;
        const usersData = JSON.parse(fs.readFileSync(usersFile));
        
        if (!usersData.users) {
            return res.status(500).json({ message: 'Invalid users data structure' });
        }

        const updatedUsers = usersData.users.filter(user => user.uuid !== uuid);
        
        // Write back the entire structure
        fs.writeFileSync(usersFile, JSON.stringify({
            users: updatedUsers,
            lastUpdated: new Date().toISOString()
        }, null, 2));

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/users/:uuid/role', validateAdmin, async (req, res) => {
    try {
        const { uuid } = req.params;
        const { newRole } = req.body;
        
        const usersData = JSON.parse(fs.readFileSync(usersFile));
        if (!usersData.users) {
            return res.status(500).json({ message: 'Invalid users data structure' });
        }

        const userIndex = usersData.users.findIndex(u => u.uuid === uuid);
        
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        usersData.users[userIndex].role = newRole;
        usersData.lastUpdated = new Date().toISOString();
        
        fs.writeFileSync(usersFile, JSON.stringify(usersData, null, 2));

        res.json({ 
            message: 'Role updated successfully',
            user: usersData.users[userIndex]
        });
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/users', validateAdmin, async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const usersData = JSON.parse(fs.readFileSync(usersFile));
        const users = usersData.users || [];
        
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const uuid = uuidv4();
        const newUser = {
            uuid,
            username,
            password: encrypt(password),
            role: role || 'user',
            createdAt: new Date().toISOString()
        };

        // Update the users array and write back to file
        users.push(newUser);
        fs.writeFileSync(usersFile, JSON.stringify({ 
            users: users,
            lastUpdated: new Date().toISOString() 
        }, null, 2));

        // Return sanitized user object
        const userResponse = { ...newUser };
        delete userResponse.password;

        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/users/:uuid', validateAdmin, async (req, res) => {
    try {
        const { uuid } = req.params;
        const usersData = JSON.parse(fs.readFileSync(usersFile));
        const users = usersData.users || [];  // Access the users array properly
        const user = users.find(u => u.uuid === uuid);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get the admin's credentials from the token
        const userRole = req.headers['user-role'];
        if (userRole !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Return the user with decrypted password
        const decryptedUser = {
            ...user,
            password: decrypt(user.password)
        };

        res.json(decryptedUser);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/update-profile', async (req, res) => {
    try {
        const { currentUsername, newUsername, newPassword } = req.body;
        const usersData = JSON.parse(fs.readFileSync(usersFile));
        const users = usersData.users || [];
        
        const userIndex = users.findIndex(u => u.username === currentUsername);
        
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if new username already exists (if changing username)
        if (newUsername && newUsername !== currentUsername) {
            const usernameExists = users.some(u => u.username === newUsername);
            if (usernameExists) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            users[userIndex].username = newUsername;
        }

        // Update password if provided
        if (newPassword) {
            users[userIndex].password = encrypt(newPassword);
        }

        // Write back to file
        fs.writeFileSync(usersFile, JSON.stringify({
            users: users,
            lastUpdated: new Date().toISOString()
        }, null, 2));

        res.json({ 
            message: 'Profile updated successfully',
            user: {
                username: users[userIndex].username,
                uuid: users[userIndex].uuid,
                role: users[userIndex].role
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.use('/api/scanner', scannerRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
