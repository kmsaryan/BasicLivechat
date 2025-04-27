import React, { useState } from 'react';

const EndChatButton = ({ onEndChat }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const handleClick = () => {
    setShowConfirmation(true);
  };
  
  const confirmEndChat = () => {
    onEndChat();
    setShowConfirmation(false);
  };
  
  const cancelEndChat = () => {
    setShowConfirmation(false);
  };
  
  return (
    <div className="end-chat-container">
      {!showConfirmation ? (
        <button className="end-chat-button" onClick={handleClick}>
          End Chat
        </button>
      ) : (
        <div className="end-chat-confirmation">
          <p>Are you sure you want to end this chat?</p>
          <div className="confirmation-buttons">
            <button className="confirm-end-button" onClick={confirmEndChat}>
              Yes, End Chat
            </button>
            <button className="cancel-button" onClick={cancelEndChat}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EndChatButton;
