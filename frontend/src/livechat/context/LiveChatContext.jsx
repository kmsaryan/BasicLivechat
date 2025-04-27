import React, { createContext, useContext, useState } from 'react';

const LiveChatContext = createContext();

export const LiveChatProvider = ({ children, initialTechnician = false }) => {
  const [isTechnician, setIsTechnician] = useState(initialTechnician);
  const [messages, setMessages] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [queue, setQueue] = useState([]);
  const [supportCategories, setSupportCategories] = useState([
    { id: "tech", name: "Technical Support" },
    { id: "billing", name: "Billing Questions" },
    { id: "general", name: "General Inquiry" },
  ]);
  
  const value = {
    isTechnician,
    setIsTechnician,
    messages,
    setMessages,
    activeChats,
    setActiveChats,
    currentChatId, 
    setCurrentChatId,
    queue,
    setQueue,
    supportCategories,
    setSupportCategories
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
