import React, { useState, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import './Auth.css';

const Login = () => {
    const history = useHistory();
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const video = document.querySelector('.video-background');
        if (video) {
            video.addEventListener('loadeddata', () => {
                console.log('Video loaded successfully');
            });
            video.addEventListener('error', (e) => {
                console.error('Error loading video:', e);
            });
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            console.log('Attempting login for:', username);

            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok) {
                // Store user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('uuid', data.user.uuid);
                localStorage.setItem('currentUsername', data.user.username);
                localStorage.setItem('userRole', data.user.role);

                console.log('Stored user data:', {
                    username: data.user.username,
                    role: data.user.role,
                    uuid: data.user.uuid
                });

                login();
                history.push('/');
            } else {
                setError(data.message || 'Login failed');
                console.error('Login failed:', data.message);
            }
        } catch (error) {
            setError('An error occurred during login');
            console.error('Login error:', error);
        }
    };

    return (
        <>
            <video 
                autoPlay 
                muted 
                loop 
                playsInline
                className="video-background"
                style={{ opacity: 1 }}
            >
                <source src="/videos/video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="auth-container">
                <h2>Login</h2>
                {error && <p className="error">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn">Login</button>
                </form>
                <p>
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </div>
        </>
    );
};

export default Login;
