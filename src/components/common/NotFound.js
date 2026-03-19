import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Classes, H3 } from "@blueprintjs/core";

const NotFound = () => {
    return (
        <div
            className={Classes.DARK}
            style={{
                minHeight: 'calc(100vh - 56px)',
                marginTop: 56,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 18,
            }}
        >
            <Card style={{ maxWidth: 520, width: "100%" }}>
                <H3 style={{ marginTop: 0 }}>404 - Page Not Found</H3>
                <p>The page you&apos;re looking for doesn&apos;t exist.</p>
                <Link to="/">
                    <Button intent="primary" icon="dashboard">
                        Return to Dashboard
                    </Button>
                </Link>
            </Card>
        </div>
    );
};

export default NotFound; 