import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        if (token) {
            setIsAuthenticated(true);
            setUserRole(role);
        }
    }, []);

    const login = () => {
        setIsAuthenticated(true);
        setUserRole(localStorage.getItem('userRole'));
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('uuid');
        localStorage.removeItem('currentUsername');
        localStorage.removeItem('userRole');
        setIsAuthenticated(false);
        setUserRole(null);
    };

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            login, 
            logout,
            userRole 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
