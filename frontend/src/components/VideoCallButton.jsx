import React, { useState } from 'react';

const VideoCallButton = ({ onClick, isActive = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <button 
            className={`video-call-button ${isActive ? 'active' : ''}`}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title="Start Video Call"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 10L19.5528 7.72361C19.8343 7.58281 20 7.31138 20 7V17C20 16.6886 19.8343 16.4172 19.5528 16.2764L15 14V10Z" fill="currentColor"/>
                <path d="M5 7C4.44772 7 4 7.44772 4 8V16C4 16.5523 4.44772 17 5 17H15C15.5523 17 16 16.5523 16 16V8C16 7.44772 15.5523 7 15 7H5Z" fill="currentColor"/>
            </svg>
            {isHovered && <span className="tooltip">Start Video Call</span>}
        </button>
    );
};

export default VideoCallButton;
