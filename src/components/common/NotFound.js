import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontFamily: 'Courier New, monospace',
            background: 'rgba(0, 0, 0, 0.8)'
        }}>
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <Link 
                to="/"
                style={{
                    color: '#00ff00',
                    textDecoration: 'none',
                    marginTop: '20px'
                }}
            >
                Return to Dashboard
            </Link>
        </div>
    );
};

export default NotFound; 