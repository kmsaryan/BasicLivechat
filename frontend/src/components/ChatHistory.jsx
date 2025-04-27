import React from 'react';
import MessageBubble from './MessageBubble';

const ChatHistory = ({ messages, typingIndicator }) => {
    return (
        <div className="chat-history">
            <div className="messages-container">
                {messages.map((msg, index) => (
                    <MessageBubble
                        key={`${msg.id}-${msg.timestamp}-${index}`}
                        message={msg}
                        isOwnMessage={msg.isOwn}
                        isRead={true}
                    />
                ))}
            </div>
            
            {typingIndicator && (
                <div className="typing-indicator">
                    <span>...</span>
                </div>
            )}
        </div>
    );
};

export default ChatHistory;
