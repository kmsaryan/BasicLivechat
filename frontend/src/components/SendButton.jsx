import React from 'react';
import '../styles/SendButton.css';

const SendButton = ({ onClick }) => {
    return (
        <button className="send-button" onClick={onClick}>
            Send
        </button>
    );
};

export default SendButton;
