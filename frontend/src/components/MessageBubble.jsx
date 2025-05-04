import React, { useState } from 'react';
import '../styles/MessageBubble.css';

const MessageBubble = ({ message, isOwnMessage }) => {
    const [showFullImage, setShowFullImage] = useState(false);

    const isImage = message.file && (
        message.file.type.startsWith('image/') || 
        (message.file.content && message.file.content.startsWith('data:image/'))
    );

    const isPDF = message.file && (
        message.file.type === 'application/pdf' || 
        (message.file.content && message.file.content.startsWith('data:application/pdf'))
    );

    const isDoc = message.file && (
        message.file.type.includes('word') || 
        message.file.type.includes('doc') ||
        (message.file.name && (
            message.file.name.toLowerCase().endsWith('.doc') || 
            message.file.name.toLowerCase().endsWith('.docx')
        ))
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
                    ) : isPDF ? (
                        <div className="file-message pdf-file">
                            <p>PDF: {message.file.name}</p>
                            <a 
                                href={message.file.content} 
                                download={message.file.name}
                                className="download-link"
                            >
                                Download PDF
                            </a>
                        </div>
                    ) : isDoc ? (
                        <div className="file-message doc-file">
                            <p>Document: {message.file.name}</p>
                            <a 
                                href={message.file.content} 
                                download={message.file.name}
                                className="download-link"
                            >
                                Download Document
                            </a>
                        </div>
                    ) : (
                        <div className="file-message generic-file">
                            <p>File: {message.file.name}</p>
                            <a 
                                href={message.file.content} 
                                download={message.file.name}
                                className="download-link"
                            >
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
