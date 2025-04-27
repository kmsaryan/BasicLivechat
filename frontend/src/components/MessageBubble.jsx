import React, { useState } from 'react';
import '../styles/MessageBubble.css';

const MessageBubble = ({ message, isOwnMessage }) => {
    const [showFullImage, setShowFullImage] = useState(false);

    // Improved image detection for both sender and receiver
    const isImage = message.file && (
        (message.file.type && message.file.type.startsWith('image/')) || 
        (message.file.content && message.file.content.startsWith('data:image/'))
    );

    const handleImageClick = () => {
        setShowFullImage(!showFullImage);
    };

    const handleDownload = (e) => {
        e.stopPropagation(); // Prevent triggering the image click
    };

    return (
        <div className={`message-container ${isOwnMessage ? 'own-message-container' : 'other-message-container'}`}>
            <div className={`message-bubble ${isOwnMessage ? 'own' : ''}`}>
                {message.file ? (
                    isImage ? (
                        <div className="message-image-container" onClick={handleImageClick}>
                            <img 
                                src={message.file.content} 
                                alt={message.file.name || "Image"}
                                className="message-image"
                            />
                            <a 
                                href={message.file.content} 
                                download={message.file.name}
                                className="download-overlay"
                                onClick={handleDownload}
                            >
                                <span className="download-icon">↓</span>
                            </a>
                            {showFullImage && (
                                <div className="fullsize-image-modal" onClick={handleImageClick}>
                                    <div className="fullsize-image-container">
                                        <img 
                                            src={message.file.content} 
                                            alt={message.file.name || "Image"}
                                            className="fullsize-image" 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="file-message">
                            <p>File: {message.file.name}</p>
                            <a href={message.file.content} download={message.file.name} className="download-link">
                                Download
                            </a>
                        </div>
                    )
                ) : (
                    <p className="message-text">{message.text}</p>
                )}
                <div className="message-meta">
                    <span className="message-time">{message.timestamp}</span>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
