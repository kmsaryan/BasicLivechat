import React from 'react';

const VideoCallButton = ({ onClick }) => {
    return (
        <button className="video-call-button" onClick={onClick}>
            Start Video Call
        </button>
    );
};

export default VideoCallButton;
