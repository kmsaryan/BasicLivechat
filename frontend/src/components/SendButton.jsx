import React from 'react';

const SendButton = ({ onClick }) => {
    return (
        <button className="send-button" onClick={onClick}>
            Send
        </button>
    );
};

export default SendButton;
