import React, { useState, useEffect } from 'react';

const DebugPanel = ({ socket, visible = false }) => {
  const [socketId, setSocketId] = useState('Not connected');
  const [queueStatus, setQueueStatus] = useState({});
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (!socket) return;
    
    // Get socket ID when connected
    setSocketId(socket.id || 'Connecting...');
    
    socket.on('connect', () => {
      setSocketId(socket.id);
    });
    
    // Fetch queue status periodically
    const fetchStatus = async () => {
      try {
        const response = await fetch('/admin/queue-status');
        const data = await response.json();
        setQueueStatus(data);
      } catch (err) {
        console.error('Failed to fetch queue status:', err);
      }
    };
    
    fetchStatus();
    const intervalId = setInterval(fetchStatus, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [socket]);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        style={{position: 'fixed', bottom: '10px', right: '10px', zIndex: 9999}}
      >
        Debug
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '4px',
      zIndex: 9999,
      maxWidth: '300px',
      maxHeight: '300px',
      overflow: 'auto'
    }}>
      <h3>Debug Info</h3>
      <button onClick={() => setIsVisible(false)}>Close</button>
      
      <div>
        <p><strong>Socket ID:</strong> {socketId}</p>
        <p><strong>Queue Status:</strong></p>
        <pre>{JSON.stringify(queueStatus, null, 2)}</pre>
      </div>
    </div>
  );
};

export default DebugPanel;
