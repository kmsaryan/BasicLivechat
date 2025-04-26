import React from 'react';
import MessageBubble from './MessageBubble';

const ChatHistory = ({ messages, typingIndicator }) => {
    return (
        <div className="chat-history">
            {messages.map((msg, index) => (
                <MessageBubble
                    key={`${msg.id}-${msg.timestamp}-${index}`} // Ensure a globally unique key
                    message={msg}
                    isOwnMessage={msg.isOwn}
                    isRead={true}
                />
            ))}
            {typingIndicator && (
                <div className="typing-indicator">
                    <span>...</span>
                </div>
            )}
        </div>
    );
};

export default ChatHistory;
