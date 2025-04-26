import React, { useState, useEffect } from 'react';
import ChatHistory from './ChatHistory';
import InputField from './InputField';
import SendButton from './SendButton';
import SuggestionsSection from './SuggestionsSection';
import { io } from 'socket.io-client';

const socket = io(`http://localhost:${process.env.REACT_APP_BACKEND_PORT || 5000}`);

const ChatWindow = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const roomId = 'chat-room'; // Shared room ID
    const role = 'customer'; // Role of this user

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

    const handleFileUpload = (event) => {
        const uploadedFile = event.target.files[0];
        if (!uploadedFile) return;
        
        const reader = new FileReader();
        reader.onload = () => {
            const fileData = {
                name: uploadedFile.name,
                type: uploadedFile.type,
                content: reader.result,
                sender: role, // Add sender information
            };
            socket.emit('file-upload', { roomId, fileData });
        };
        reader.readAsDataURL(uploadedFile);
    };

    return (
        <div className="chat-window">
            <header className="chat-header">Live Chat</header>
            <ChatHistory messages={messages} />
            <div className="chat-input-section">
                <InputField value={inputValue} onChange={setInputValue} />
                <SendButton onClick={handleSendMessage} />
                <input type="file" onChange={handleFileUpload} />
            </div>
            <SuggestionsSection />
        </div>
    );
};

export default ChatWindow;
