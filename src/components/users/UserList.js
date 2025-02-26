import React, { useState, useEffect, useRef } from 'react';
import './UserList.css';
import { useHistory } from 'react-router-dom';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user'
  });
  const [message, setMessage] = useState('');
  const history = useHistory();
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const fetchUsers = React.useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'user-role': localStorage.getItem('userRole'),
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 403) {
        setError('Access denied');
        history.push('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      setError('Error fetching users');
      console.error('Fetch error:', error);
    }
  }, [history]);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (!userRole || userRole.toLowerCase() !== 'admin') {
      history.push('/');
      return;
    }

    fetchUsers();
  }, [history, fetchUsers]);

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

  useEffect(() => {
    if (!users) return;
    
    const filtered = users.filter(user => 
      user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleCopy = async (value, uuid, field) => {
    try {
        // If copying password, fetch the decrypted password first
        if (field === 'password') {
            const response = await fetch(`http://localhost:3001/users/${uuid}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'user-role': localStorage.getItem('userRole'),
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch password');
            }

            const data = await response.json();
            value = data.password; // Use the decrypted password
        }

        await navigator.clipboard.writeText(value);
        setCopiedId(uuid);
        setCopiedField(field);
        
        // Show success message
        const element = document.querySelector(`[data-uuid="${uuid}"]`);
        if (element) {
            element.classList.add('copied');
        }

        // Reset the copied status after 2 seconds
        setTimeout(() => {
            setCopiedId(null);
            setCopiedField(null);
            if (element) {
                element.classList.remove('copied');
            }
        }, 2000);
    } catch (error) {
        console.error('Copy error:', error);
        setError('Failed to copy value');
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`http://localhost:3001/users/${userToDelete.uuid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setUsers(users.filter(user => user.uuid !== userToDelete.uuid));
        setShowDeleteModal(false);
        setUserToDelete(null);
      } else {
        setError('Error deleting user');
      }
    } catch (error) {
      setError('Error deleting user');
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.username || !newUser.password) {
        setError('Username and password are required');
        return;
      }

      const response = await fetch('http://localhost:3001/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'user-role': localStorage.getItem('userRole')
        },
        credentials: 'include',
        body: JSON.stringify(newUser)
      });

      const data = await response.json();
      
      if (response.ok) {
        setUsers(prevUsers => [...prevUsers, data]);
        setFilteredUsers(prevUsers => [...prevUsers, data]);
        setShowCreateModal(false);
        setNewUser({ username: '', password: '', role: 'user' });
        setMessage('User created successfully');
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Create user error:', error);
      setError('Failed to create user');
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setNewUser({
      username: '',
      password: '',
      role: 'user'
    });
    setError('');
    setMessage('');
  };

  const handleSelectAll = (e) => {
    setSelectAll(e.target.checked);
    if (e.target.checked) {
      setSelectedUsers(new Set(filteredUsers.map(user => user.uuid)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (uuid) => {
    setMessage('');
    setSelectedUsers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(uuid)) {
            newSet.delete(uuid);
        } else {
            newSet.add(uuid);
        }
        return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''}? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    try {
        const deletePromises = Array.from(selectedUsers).map(uuid =>
            fetch(`http://localhost:3001/users/${uuid}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'user-role': localStorage.getItem('userRole'),
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to delete user ${uuid}`);
                }
                return response.json();
            })
        );

        await Promise.all(deletePromises);
        setMessage(`Successfully deleted ${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''}`);
        setSelectedUsers(new Set());
        fetchUsers(); // Refresh the user list
    } catch (error) {
        console.error('Delete error:', error);
        setError('Failed to delete users');
    }
  };

  const handleBulkRoleChange = async (newRole) => {
    if (selectedUsers.size === 0) return;

    try {
        const updatePromises = Array.from(selectedUsers).map(uuid =>
            fetch(`http://localhost:3001/users/${uuid}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'user-role': localStorage.getItem('userRole')
                },
                credentials: 'include',
                body: JSON.stringify({ newRole })
            })
        );

        await Promise.all(updatePromises);
        setMessage(`Successfully updated role for ${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''}`);
        setSelectedUsers(new Set());
        fetchUsers(); // Refresh the user list
    } catch (error) {
        setError('Failed to update user roles');
        console.error('Role update error:', error);
    }
  };

  return (
    <>
      <canvas id="backgroundCanvas" ref={canvasRef}></canvas>
      <div className="user-list-container">
        <div className="table-header-group">
          <div className="header-flex-container">
            <div className="terminal-container">
                <h2>user management</h2>
            </div>
            {message && <div className="terminal-success">{message}</div>}
            {error && <div className="error-message">{error}</div>}
          </div>
          <div className="table-header-container">
            <div className="header-actions">
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by username, UUID, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="action-buttons">
                <button 
                  className="btn-create"
                  onClick={() => {
                    setMessage('');
                    setShowCreateModal(true);
                  }}
                >
                  Create User
                </button>
                <div className="bulk-actions">
                  <span className="selected-count">
                    {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                  </span>
                  <div className="role-dropdown">
                    <button className="role-button">Action ▼</button>
                    <div className="role-dropdown-content">
                      <div className="role-option-group">
                        <div className="role-option-header">Change Role To:</div>
                        <div 
                          className="role-option admin"
                          onClick={() => handleBulkRoleChange('admin')}
                        >
                          Admin
                        </div>
                        <div 
                          className="role-option user"
                          onClick={() => handleBulkRoleChange('user')}
                        >
                          User
                        </div>
                      </div>
                      <div className="role-option-divider"></div>
                      <div 
                        className="role-option delete"
                        onClick={handleBulkDelete}
                      >
                        Delete Selected
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="table-columns">
              <div className="column-header checkbox-header">
                <input
                  type="checkbox"
                  className="user-checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </div>
              <div className="column-header">Username</div>
              <div className="column-header">Role</div>
              <div className="column-header">UUID</div>
              <div className="column-header">Password</div>
            </div>
          </div>
        </div>
        
        <table className="user-table">
          <tbody>
            {filteredUsers.map(user => (
              user && (
                <tr key={user.uuid} 
                    className={`
                      ${user.username === localStorage.getItem('currentUsername') ? 'current-user' : ''}
                      ${selectedUsers.has(user.uuid) ? 'row-selected' : ''}
                    `}
                >
                  <td>
                    <input
                      type="checkbox"
                      className="user-checkbox"
                      checked={selectedUsers.has(user.uuid)}
                      onChange={(e) => handleSelectUser(user.uuid)}
                    />
                  </td>
                  <td>{user.username}</td>
                  <td>
                    <div className="role-container">
                      <span className={`role ${(user.role || 'user').toLowerCase() === 'admin' ? 'role-admin' : 'role-user'}`}>
                        {(user.role || 'user').toLowerCase() === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span 
                      className={`uuid ${copiedId === user.uuid && copiedField === 'uuid' ? 'copied' : ''}`}
                      onClick={() => handleCopy(user.uuid, user.uuid, 'uuid')}
                      title="Click to copy UUID"
                    >
                      {user.uuid}
                    </span>
                  </td>
                  <td>
                    <span 
                      className={`password-display ${copiedId === user.uuid && copiedField === 'password' ? 'copied' : ''}`}
                      onClick={() => handleCopy(user.password, user.uuid, 'password')}
                      title="Click to copy password"
                      data-uuid={user.uuid}
                    >
                      <span className="password-tooltip">{user.password}</span>
                      {'•'.repeat(8)}
                    </span>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirm User Deletion</h3>
            <p className="modal-message">
              Are you sure you want to delete user:<br/>
              <strong>{userToDelete?.username}</strong>?<br/>
              This action cannot be undone.
            </p>
            <div className="modal-buttons">
              <button 
                className="modal-confirm"
                onClick={confirmDelete}
              >
                Delete User
              </button>
              <button 
                className="modal-cancel"
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button 
                    className="modal-close-btn" 
                    onClick={handleCloseCreateModal}
                >
                    ×
                </button>
                <h3 className="modal-title">Create New User</h3>
                <div className="modal-form">
                    <div className="form-group">
                        <label>Username:</label>
                        <input
                            type="text"
                            value={newUser.username}
                            onChange={(e) => setNewUser({
                                ...newUser,
                                username: e.target.value
                            })}
                            className="modal-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({
                                ...newUser,
                                password: e.target.value
                            })}
                            className="modal-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>Role:</label>
                        <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({
                                ...newUser,
                                role: e.target.value
                            })}
                            className="modal-input"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
                <div className="modal-buttons">
                    <button 
                        className="modal-confirm"
                        onClick={() => {
                            handleCreateUser();
                            handleCloseCreateModal();
                        }}
                    >
                        Create
                    </button>
                    <button 
                        className="modal-cancel"
                        onClick={handleCloseCreateModal}
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

export default UserList;
