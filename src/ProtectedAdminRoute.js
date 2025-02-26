import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedAdminRoute = ({ children, ...rest }) => {
    const { isAuthenticated, userRole } = useAuth();
    console.log('Current user role:', userRole); // Debug log

    return (
        <Route
            {...rest}
            render={({ location }) =>
                isAuthenticated && userRole?.toLowerCase() === 'admin' ? (
                    children
                ) : (
                    <Redirect
                        to={{
                            pathname: "/",
                            state: { 
                                from: location,
                                error: "Unauthorized: Admin access required"
                            }
                        }}
                    />
                )
            }
        />
    );
};

export default ProtectedAdminRoute; 