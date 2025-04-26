import React from 'react';
import ChatWindow from './components/ChatWindow';
import TechnicianChat from './components/TechnicianChat';
import TechnicianConnect from './components/TechnicianConnect';
import { useLiveChat } from './context/LiveChatContext';
import './styles/livechat.css';

const LiveChat = ({ 
  theme = {}, 
  serverUrl = null, 
  defaultRoom = 'chat-room',
  showTechnicianButton = true,
  technician = false,
  onSendMessage = null,
  onFileUpload = null,
  customRender = null
}) => {
  const { isTechnician, setIsTechnician } = useLiveChat();

  // Apply custom theme
  React.useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--livechat-${key}`, value);
    });
  }, [theme]);

  const handleConnect = () => {
    setIsTechnician(true);
  };

  // Allow complete custom rendering if provided
  if (customRender) {
    return customRender({ 
      isTechnician, 
      handleConnect, 
      ChatWindow, 
      TechnicianChat, 
      TechnicianConnect 
    });
  }

  return (
    <div className="livechat-container" style={theme.containerStyle}>
      {technician || isTechnician ? (
        <TechnicianChat
          serverUrl={serverUrl}
          roomId={defaultRoom}
          onSendMessage={onSendMessage}
          onFileUpload={onFileUpload}
        />
      ) : (
        <>
          <ChatWindow
            serverUrl={serverUrl}
            roomId={defaultRoom}
            onSendMessage={onSendMessage}
            onFileUpload={onFileUpload}
          />
          {showTechnicianButton && (
            <TechnicianConnect onConnect={handleConnect} />
          )}
        </>
      )}
    </div>
  );
};

export default LiveChat;
