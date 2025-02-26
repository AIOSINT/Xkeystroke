import React from 'react';

const OpenReports = ({ count }) => {
    return (
        <div className="widget">
            <h3>Open Reports</h3>
            <p>{count}</p>
        </div>
    );
};

export default OpenReports;
