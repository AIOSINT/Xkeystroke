import React, { useState, useEffect, useRef } from 'react';
import './UserList.css';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('');
    const [message, setMessage] = useState('');
    const canvasRef = useRef(null);

    useEffect(() => {
        const currentUsername = localStorage.getItem('currentUsername');
        fetch(`http://localhost:3001/users?username=${currentUsername}`)
            .then((response) => response.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setUsers(data);
                } else {
                    setMessage(data.message);
                }
            })
            .catch((error) => {
                console.error('Error fetching users:', error);
                setMessage('Error fetching users');
            });
    }, []);

    const handleDelete = (username) => {
        const currentUsername = localStorage.getItem('currentUsername');
        fetch(`http://localhost:3001/users/${username}?requester=${currentUsername}`, {
            method: 'DELETE'
        })
            .then((response) => response.json())
            .then((data) => {
                setMessage(data.message);
                setUsers((prevUsers) => prevUsers.filter(user => user.username !== username));
            })
            .catch((error) => console.error('Error deleting user:', error));
    };

    const handleChangePassword = (username) => {
        const currentUsername = localStorage.getItem('currentUsername');
        fetch(`http://localhost:3001/users/${username}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newPassword, requester: currentUsername })
        })
            .then((response) => response.json())
            .then((data) => {
                setMessage(data.message);
                setNewPassword('');
            })
            .catch((error) => console.error('Error changing password:', error));
    };

    const handleChangeRole = (username) => {
        const currentUsername = localStorage.getItem('currentUsername');
        fetch(`http://localhost:3001/users/${username}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newRole, requester: currentUsername })
        })
            .then((response) => response.json())
            .then((data) => {
                setMessage(data.message);
                setNewRole('');
                setUsers((prevUsers) =>
                    prevUsers.map((user) =>
                        user.username === username ? { ...user, role: newRole } : user
                    )
                );
            })
            .catch((error) => console.error('Error changing role:', error));
    };

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
            
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            mountainPoints.forEach(point => {
                point.update();
                ctx.lineTo(point.x, point.y);
            });
            ctx.lineTo(canvas.width, canvas.height);
            
            const gradient = ctx.createLinearGradient(0, heightOffset - 100, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(20, 20, 20, 0.7)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
            ctx.fillStyle = gradient;
            ctx.fill();
            
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

    return (
        <>
            <canvas id="backgroundCanvas" ref={canvasRef}></canvas>
            <div className="user-list-container">
                <h2>All Users</h2>
                {message && <p className="message">{message}</p>}
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>UUID</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.username}>
                                <td>{user.username}</td>
                                <td>{user.uuid}</td>
                                <td>{user.role}</td>
                                <td className="action-buttons">
                                    <div className="button-group">
                                        <button onClick={() => handleDelete(user.username)} className="btn-delete">
                                            Delete
                                        </button>
                                        <div className="input-group">
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="New Password"
                                                className="centered-input"
                                            />
                                            <button onClick={() => handleChangePassword(user.username)} className="btn-change">
                                                Change Password
                                            </button>
                                        </div>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                value={newRole}
                                                onChange={(e) => setNewRole(e.target.value)}
                                                placeholder="New Role"
                                                className="centered-input"
                                            />
                                            <button onClick={() => handleChangeRole(user.username)} className="btn-change">
                                                Change Role
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default UserList;
