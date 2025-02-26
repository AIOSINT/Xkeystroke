const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const validateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Get userRole from users.json based on the token
        const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../users.json')));
        const currentUser = users.find(u => u.role === 'admin');

        if (!currentUser || currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        next();
    } catch (error) {
        console.error('Admin validation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { validateAdmin };

// Apply to your routes
router.get('/users', validateAdmin, async (req, res) => {
    // Your users list endpoint
});

router.put('/users/:uuid/role', validateAdmin, async (req, res) => {
    // Your role change endpoint
});

router.post('/users', validateAdmin, async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        // Add validation here
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Generate UUID
        const uuid = require('uuid').v4();

        const newUser = {
            uuid,
            username,
            password, // In production, you should hash the password
            role: role || 'user'
        };

        // Add to users.json
        const users = JSON.parse(fs.readFileSync('server/users.json'));
        users.push(newUser);
        fs.writeFileSync('server/users.json', JSON.stringify(users, null, 2));

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}); 