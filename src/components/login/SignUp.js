import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { Button, Card, Classes, FormGroup, InputGroup, Intent } from "@blueprintjs/core";
import './Auth.css';

const SignUp = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const history = useHistory();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (response.ok) {
                history.push('/login'); // Redirect to login page
            } else {
                setError(data.message);
            }
        } catch (err) {
            console.error('Signup error:', err);
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className="auth-container">
            <Card className={`auth-card ${Classes.DARK}`}>
                <h2 className="auth-title">Sign Up</h2>
                <form onSubmit={handleSignUp}>
                    <FormGroup label="Username" labelFor="username">
                        <InputGroup
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            leftIcon="user"
                            required
                        />
                    </FormGroup>
                    <FormGroup label="Password" labelFor="password">
                        <InputGroup
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            leftIcon="lock"
                            required
                        />
                    </FormGroup>
                    {error ? <div className="auth-error">{error}</div> : null}
                    <Button type="submit" intent={Intent.PRIMARY} fill>
                        Create account
                    </Button>
                </form>
                <p className="auth-footer">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </Card>
        </div>
    );
};

export default SignUp;
