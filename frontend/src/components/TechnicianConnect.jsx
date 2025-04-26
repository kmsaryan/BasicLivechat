import React, { useState } from 'react';

const TechnicianConnect = ({ onConnect }) => {
    const [isConnected, setIsConnected] = useState(false);

    const handleConnect = () => {
        setIsConnected(true);
        onConnect();
    };

    return (
        <div className="technician-connect">
            {isConnected ? (
                <p>Connected to a technician</p>
            ) : (
                <button onClick={handleConnect}>Connect to Technician</button>
            )}
        </div>
    );
};

export default TechnicianConnect;
