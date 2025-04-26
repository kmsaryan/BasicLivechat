import React, { createContext, useContext, useState } from 'react';

const LiveChatContext = createContext();

export const LiveChatProvider = ({ children, initialTechnician = false }) => {
  const [isTechnician, setIsTechnician] = useState(initialTechnician);
  const [messages, setMessages] = useState([]);
  
  const value = {
    isTechnician,
    setIsTechnician,
    messages,
    setMessages
  };

  return (
    <LiveChatContext.Provider value={value}>
      {children}
    </LiveChatContext.Provider>
  );
};

export const useLiveChat = () => {
  const context = useContext(LiveChatContext);
  if (!context) {
    throw new Error('useLiveChat must be used within a LiveChatProvider');
  }
  return context;
};
