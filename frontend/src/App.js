import React, { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import TechnicianChat from './TechnicianChat';
import TechnicianConnect from './components/TechnicianConnect';

const App = () => {
    const [isTechnician, setIsTechnician] = useState(false);

    const handleConnect = () => {
        setIsTechnician(true);
    };

    return (
        <div className="app">
            {isTechnician ? (
                <TechnicianChat />
            ) : (
                <>
                    <ChatWindow />
                    <TechnicianConnect onConnect={handleConnect} />
                </>
            )}
        </div>
    );
};

export default App;
