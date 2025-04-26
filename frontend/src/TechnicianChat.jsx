import React, { useState, useEffect } from 'react';
import ChatHistory from './components/ChatHistory';
import InputField from './components/InputField';
import SendButton from './components/SendButton';
import { io } from 'socket.io-client';

const socket = io(`http://localhost:${process.env.REACT_APP_BACKEND_PORT || 5000}`);

const TechnicianChat = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const roomId = 'chat-room'; // Shared room ID
    const role = 'technician'; // Role of this user

    useEffect(() => {
        // Set role and join room on component mount
        socket.emit('set-role', { role });
        socket.emit('join-room', roomId);

        // Listen for incoming messages
        socket.on('message', (msg) => {
            // Only add message if it's not already in the state (prevent duplicates)
            setMessages((prev) => {
                // Check if message with this ID already exists
                const exists = prev.some(m => 
                    m.id === msg.id && m.timestamp === msg.timestamp
                );
                
                if (!exists) {
                    return [
                        ...prev, 
                        {
                            ...msg,
                            isOwn: msg.sender === role
                        }
                    ];
                }
                return prev;
            });
        });

        // Listen for file uploads
        socket.on('file-received', (fileData) => {
            setMessages((prev) => [
                ...prev,
                {
                    id: `file-${Date.now()}`, // Ensure unique ID
                    text: `File received: ${fileData.name}`,
                    isOwn: fileData.sender === role,
                    timestamp: new Date().toLocaleTimeString(),
                    file: fileData,
                },
            ]);
        });

        return () => {
            socket.off('message');
            socket.off('file-received');
        };
    }, []);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        
        const newMessage = {
            id: `msg-${Date.now()}`, // Ensure globally unique ID
            text: inputValue,
            timestamp: new Date().toLocaleTimeString(),
            sender: role, // Include sender role directly in message
        };
        
        // Only emit the message, don't update state directly
        // This prevents duplicates as our socket listener will handle all messages
        socket.emit('message', { roomId, message: newMessage });
        setInputValue('');
    };

    return (
        <div className="chat-window">
            <header className="chat-header">Technician Chat</header>
            <ChatHistory messages={messages} />
            <div className="chat-input-section">
                <InputField value={inputValue} onChange={setInputValue} />
                <SendButton onClick={handleSendMessage} />
            </div>
        </div>
    );
};

export default TechnicianChat;
