import React from 'react';

const PendingCaptchas = ({ count }) => {
    return (
        <div className="widget">
            <h3>Pending Captchas</h3>
            <p>{count}</p>
        </div>
    );
};

export default PendingCaptchas;
