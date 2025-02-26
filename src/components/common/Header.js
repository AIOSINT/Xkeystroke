import React from 'react';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { Link, useLocation, useHistory } from 'react-router-dom';
import './Header.css';
import { useAuth } from '../../AuthContext';

const Header = () => {
    const { isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const history = useHistory();

    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
    const username = localStorage.getItem('currentUsername');
    const uuid = localStorage.getItem('uuid');
    const userRole = localStorage.getItem('userRole');
    const shortUuid = uuid ? uuid.substring(0, 6) : '';

    const handleLogout = () => {
        logout();
        history.push('/login');
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" fixed="top">
            <Navbar.Brand className="mx-auto">Xkeystroke</Navbar.Brand>
            {isAuthenticated && !isAuthPage && (
                <>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="mr-auto">
                            <Link to="/dashboard" className="nav-link">Dashboard</Link>
                            <Link to="/scanner" className="nav-link">File Scanner</Link>
                            {userRole?.toLowerCase() === 'admin' && (
                                <Link to="/users" className="nav-link">Users</Link>
                            )}
                        </Nav>
                        <Nav>
                            <NavDropdown 
                                title={
                                    <span>
                                        {username} ({shortUuid})
                                        <span className={`role-badge ${userRole?.toLowerCase()}`}>
                                            {userRole}
                                        </span>
                                    </span>
                                } 
                                id="basic-nav-dropdown"
                            >
                                <Link to="/profile" className="dropdown-item">Profile</Link>
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                    </Navbar.Collapse>
                </>
            )}
        </Navbar>
    );
};

export default Header;
