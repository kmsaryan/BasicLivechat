import React from 'react';

const TechnicianSidebar = ({ activeChats = [], currentChatId, queue = {}, onSelectChat }) => {
  // Helper function to count total queue items
  const getTotalQueueCount = () => {
    return Object.values(queue).reduce((total, items) => total + (items?.length || 0), 0);
  };

  return (
    <div className="technician-sidebar">
      <div className="sidebar-section">
        <h3>Active Chats ({activeChats.length})</h3>
        {activeChats.length === 0 ? (
          <p className="no-items-message">No active chats</p>
        ) : (
          <ul className="chat-list">
            {activeChats.map(chat => (
              <li 
                key={chat.chatId} 
                className={`chat-item ${currentChatId === chat.chatId ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.chatId)}
              >
                <div className="chat-item-name">{chat.userName || 'Unknown'}</div>
                <div className="chat-item-category">{chat.category || 'general'}</div>
                <div className="chat-item-time">
                  {chat.startTime ? new Date(chat.startTime).toLocaleTimeString() : 'Just now'}
                </div>
                {chat.unreadCount > 0 && (
                  <span className="unread-badge">{chat.unreadCount}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sidebar-section">
        <h3>Queue</h3>
        {Object.entries(queue).map(([category, users]) => (
          <div key={category} className="queue-category">
            <h4>{category} ({users.length})</h4>
            <ul className="queue-list">
              {users.map(user => (
                <li key={user.userId} className="queue-item">
                  <div className="queue-item-name">{user.name}</div>
                  <div className="queue-item-time">
                    Waiting since: {new Date(user.joinedAt).toLocaleTimeString()}
                  </div>
                  <button
                    onClick={() => onSelectChat(null, user.userId, category)}
                    className="accept-chat-btn"
                  >
                    Accept
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechnicianSidebar;
