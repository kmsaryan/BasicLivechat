import React from 'react';

const MessageBubble = ({ message, isOwnMessage }) => {
    return (
        <div className={`message-bubble ${isOwnMessage ? 'own' : ''}`}>
            {message.file ? (
                <div>
                    <p>File: {message.file.name}</p>
                    <a href={message.file.content} download={message.file.name}>
                        Download
                    </a>
                </div>
            ) : (
                <p className="message-text">{message.text}</p>
            )}
            <div className="message-meta">
                <span className="message-time">{message.timestamp}</span>
            </div>
        </div>
    );
};

export default MessageBubble;
