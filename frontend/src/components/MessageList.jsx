import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MessageList = () => {
    const [messages, setMessages] = useState([]);
    const backendBaseUrl = `http://localhost:${process.env.REACT_APP_BACKEND_PORT || 5000}`;

    useEffect(() => {
        // Fetch messages from the server
        axios.get(`${backendBaseUrl}/chat/messages`).then((response) => {
            setMessages(response.data);
        });
    }, [backendBaseUrl]);

    return (
        <div className="message-list">
            {messages.map((msg) => (
                <div key={msg.id} className="message">
                    <strong>{msg.user}:</strong> {msg.message}
                </div>
            ))}
        </div>
    );
};

export default MessageList;
