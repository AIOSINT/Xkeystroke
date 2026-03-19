import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Classes, Dialog, FormGroup, H3, InputGroup, Intent } from "@blueprintjs/core";
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
            const response = await fetch('/update-profile', {
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
        <FormGroup label={label} labelFor={id}>
            <InputGroup
                id={id}
                type={show ? "text" : "password"}
                value={value}
                onChange={onChange}
                leftIcon="lock"
                rightElement={
                    <Button
                        minimal
                        icon={show ? "eye-off" : "eye-open"}
                        onClick={() => setShow(!show)}
                        aria-label={show ? "Hide password" : "Show password"}
                    />
                }
            />
        </FormGroup>
    );

    return (
        <>
            <canvas id="backgroundCanvas" ref={canvasRef}></canvas>
            <div className="profile-container">
                <Card className={`${Classes.DARK} profile-card`}>
                    <div className="profile-header">
                        <H3 style={{ margin: 0 }}>{username || 'Profile'}</H3>
                    </div>

                    <div className="profile-info">
                        <FormGroup label="UUID">
                            <InputGroup value={uuid || ""} readOnly leftIcon="id-number" />
                        </FormGroup>
                    </div>

                    <div className="profile-form">
                        <FormGroup label="Change username" labelFor="username">
                            <InputGroup
                                id="username"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder={username}
                                leftIcon="user"
                            />
                        </FormGroup>

                        <PasswordInput
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            id="password"
                            label="New password"
                            show={showPassword}
                            setShow={setShowPassword}
                        />

                        <Button intent={Intent.PRIMARY} onClick={handleUpdateClick} fill>
                            Update profile
                        </Button>

                        {message ? (
                            <div className={`message ${messageType}`}>
                                {message}
                            </div>
                        ) : null}
                    </div>
                </Card>
            </div>

            <Dialog
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Confirm profile update"
                className={Classes.DARK}
            >
                <div className={Classes.DIALOG_BODY}>
                    <div className="changes-list">
                        {newUsername ? (
                            <div className="change-item">
                                Username: {username} → {newUsername}
                            </div>
                        ) : null}
                        {newPassword ? (
                            <div
                                className="change-item password-change"
                                onMouseEnter={() => setShowNewPassword(true)}
                                onMouseLeave={() => setShowNewPassword(false)}
                            >
                                Password:{" "}
                                {showNewPassword ? (
                                    <span className="password-reveal">
                                        <span className="old-password">••••••</span>
                                        {" → "}
                                        <span className="new-password">{newPassword}</span>
                                    </span>
                                ) : (
                                    "•••••• → ••••••"
                                )}
                            </div>
                        ) : null}
                    </div>
                    <p style={{ marginTop: 12 }}>Are you sure you want to update your profile?</p>
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button intent={Intent.PRIMARY} onClick={handleConfirmUpdate}>
                            Confirm
                        </Button>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default Profile;
