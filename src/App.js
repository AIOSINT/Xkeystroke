import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Header from './components/common/Header';
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/login/Login';
import SignUp from './components/login/SignUp';
import Profile from './components/profile/Profile';
import UserList from './components/users/UserList';
import FileScanner from './components/fileScanner/FileScanner';
import ProtectedRoute from './ProtectedRoute';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import NotFound from './components/common/NotFound';
import LegalDisclaimerDialog from './components/legal/LegalDisclaimerDialog';
import './App.css';

const App = () => {
    useEffect(() => {
        document.body.classList.add("bp5-dark");
        return () => document.body.classList.remove("bp5-dark");
    }, []);

    return (
        <Router>
            <div>
                <LegalDisclaimerDialog />
                <Header />
                <Switch>
                    <Route path="/login" component={Login} />
                    <Route path="/signup" component={SignUp} />
                    <ProtectedRoute exact path="/" component={Dashboard} />
                    <ProtectedRoute path="/scanner" component={FileScanner} />
                    <ProtectedRoute path="/profile" component={Profile} />
                    <ProtectedRoute path="/dashboard" component={Dashboard} />
                    <ProtectedAdminRoute path="/users">
                        <UserList />
                    </ProtectedAdminRoute>
                    <Route path="*" component={NotFound} />
                </Switch>
            </div>
        </Router>
    );
};

export default App;
