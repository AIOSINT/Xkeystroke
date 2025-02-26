import React from 'react';

const ActiveProxies = ({ count }) => {
    return (
        <div className="widget">
            <h3>Active Proxies</h3>
            <p>{count}</p>
        </div>
    );
};

export default ActiveProxies;
