import React, { useState, useEffect, useRef } from 'react';
import './Profile.css';

const Profile = () => {
    const [username, setUsername] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const uuid = localStorage.getItem('uuid');
    const [showModal, setShowModal] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const canvasRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const currentUsername = localStorage.getItem('currentUsername');
            setUsername(currentUsername);
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        
        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);
        
        class Point {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.speed = 0.05;
                this.angle = Math.random() * Math.PI * 2;
                this.distance = 100 + Math.random() * 100;
                this.originalX = x;
                this.originalY = y;
            }
            
            update() {
                this.angle += this.speed;
                this.x = this.originalX + Math.cos(this.angle) * 2;
                this.y = this.originalY + Math.sin(this.angle) * 2;
            }
        }
        
        const mountainPoints = [];
        const numPoints = Math.floor(canvas.width / 50);
        const heightOffset = canvas.height * 0.5;
        
        for (let i = 0; i <= numPoints; i++) {
            const x = (canvas.width * i) / numPoints;
            const y = heightOffset + (Math.sin(i) * 100) + (Math.random() * 50);
            mountainPoints.push(new Point(x, y));
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw connecting lines with darker gradient
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            mountainPoints.forEach(point => {
                point.update();
                ctx.lineTo(point.x, point.y);
            });
            ctx.lineTo(canvas.width, canvas.height);
            
            // Create darker gradient for mountains
            const gradient = ctx.createLinearGradient(0, heightOffset - 100, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(20, 20, 20, 0.7)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Connect nearby points with darker lines (no point circles)
            mountainPoints.forEach((point, index) => {
                mountainPoints.slice(index + 1).forEach(otherPoint => {
                    const distance = Math.hypot(point.x - otherPoint.x, point.y - otherPoint.y);
                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(point.x, point.y);
                        ctx.lineTo(otherPoint.x, otherPoint.y);
                        const opacity = 1 - distance / 100;
                        ctx.strokeStyle = `rgba(30, 30, 30, ${opacity * 0.5})`;
                        ctx.stroke();
                    }
                });
            });
            
            animationFrameId = requestAnimationFrame(animate);
        };
        
        animate();
        
        return () => {
            window.removeEventListener('resize', setCanvasSize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const handleUpdateProfile = async () => {
        try {
            const response = await fetch('http://localhost:3001/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'user-role': localStorage.getItem('userRole')
                },
                credentials: 'include',
                body: JSON.stringify({
                    currentUsername: username,
                    newUsername,
                    newPassword,
                }),
            });

            const data = await response.json();
            
            if (response.ok) {
                setMessage('Profile updated successfully');
                setMessageType('success');
                
                if (newUsername) {
                    localStorage.setItem('currentUsername', newUsername);
                    setUsername(newUsername);
                    setNewUsername('');
                }
                if (newPassword) {
                    setNewPassword('');
                }
            } else {
                setMessage(data.message || 'Failed to update profile');
                setMessageType('error');
            }
        } catch (error) {
            console.error('Update error:', error);
            setMessage('Failed to update profile');
            setMessageType('error');
        }
    };

    const handleUpdateClick = () => {
        // Only show modal if there are actual changes
        if (newUsername || newPassword) {
            setShowModal(true);
        }
    };

    const handleConfirmUpdate = () => {
        handleUpdateProfile();
        setShowModal(false);
    };

    // Add password visibility toggle to password fields
    const PasswordInput = ({ value, onChange, id, label, show, setShow }) => (
        <div className="form-group">
            <label htmlFor={id}>{label}</label>
            <div className="password-input-group">
                <input
                    type={show ? "text" : "password"}
                    id={id}
                    value={value}
                    onChange={onChange}
                />
                <button 
                    type="button"
                    onClick={() => setShow(!show)}
                    className="password-toggle"
                >
                    <span role="img" aria-label={show ? "Hide password" : "Show password"}>
                        {show ? "👁️" : "👁️‍🗨️"}
                    </span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            <canvas id="backgroundCanvas" ref={canvasRef}></canvas>
            <div className="profile-container">
                <div className="profile-header">
                    <h2>{username || 'Profile'}</h2>
                </div>
                <div className="profile-info">
                    <div className="current-user">
                        <span className="label-text">UUID</span>
                        <div className="uuid-section">
                            <span className="uuid">{uuid}</span>
                        </div>
                    </div>
                </div>
                <div className="profile-form">
                    <div className="form-group">
                        <label htmlFor="username">Change Username</label>
                        <input
                            type="text"
                            id="username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder={username}
                            className="centered-input"
                        />
                    </div>
                    <PasswordInput
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        id="password"
                        label="Password"
                        show={showPassword}
                        setShow={setShowPassword}
                    />
                    <button onClick={handleUpdateClick} className="btn-update">
                        Update Profile
                    </button>
                    {message && <div className={`message ${messageType}`}>{message}</div>}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">Confirm Profile Update</h3>
                        <div className="changes-list">
                            {newUsername && (
                                <div className="change-item">
                                    Username: {username} → {newUsername}
                                </div>
                            )}
                            {newPassword && (
                                <div 
                                    className="change-item password-change"
                                    onMouseEnter={() => setShowNewPassword(true)}
                                    onMouseLeave={() => setShowNewPassword(false)}
                                >
                                    Password: {showNewPassword ? (
                                        <span className="password-reveal">
                                            <span className="old-password">••••••</span>
                                            {' → '}
                                            <span className="new-password">{newPassword}</span>
                                        </span>
                                    ) : (
                                        '•••••• → ••••••'
                                    )}
                                </div>
                            )}
                        </div>
                        <p>Are you sure you want to update your profile?</p>
                        <div className="modal-buttons">
                            <button 
                                className="modal-confirm" 
                                onClick={handleConfirmUpdate}
                            >
                                Confirm
                            </button>
                            <button 
                                className="modal-cancel" 
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Profile;
