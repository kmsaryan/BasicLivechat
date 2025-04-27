import React, { useState, useEffect } from 'react';
import ChatHistory from './ChatHistory';
import InputField from './InputField';
import SendButton from './SendButton';
import SuggestionsSection from './SuggestionsSection';
import { io } from 'socket.io-client';
import { useLiveChat } from '../context/LiveChatContext';

const ChatWindow = ({ 
  serverUrl = null, 
  roomId = 'chat-room',
  onSendMessage = null,
  onFileUpload = null
}) => {
    const { messages, setMessages } = useLiveChat();
    const [inputValue, setInputValue] = useState('');
    const role = 'customer';
    
    const socket = io(serverUrl || `http://localhost:${process.env.REACT_APP_BACKEND_PORT || 5000}`);

    useEffect(() => {
        // Set role and join room on component mount
        socket.emit('set-role', { role });
        socket.emit('join-room', roomId);

        // Listen for incoming messages
        socket.on('message', (msg) => {
            // Only add message if it's not already in the state
            setMessages((prev) => {
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
                    id: `file-${Date.now()}`,
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
    }, [roomId, serverUrl, setMessages]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        
        const newMessage = {
            id: `msg-${Date.now()}`,
            text: inputValue,
            timestamp: new Date().toLocaleTimeString(),
            sender: role,
        };
        
        // Call custom handler if provided
        if (onSendMessage) {
            onSendMessage(newMessage);
        }
        
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
                sender: role,
            };
            
            // Call custom handler if provided
            if (onFileUpload) {
                onFileUpload(fileData);
            }
            
            socket.emit('file-upload', { roomId, fileData });
        };
        reader.readAsDataURL(uploadedFile);
    };

    return (
        <div className="livechat-window">
            <header className="livechat-header">Live Chat</header>
            <ChatHistory messages={messages} />
            <div className="livechat-input-section">
                <InputField value={inputValue} onChange={setInputValue} />
                <SendButton onClick={handleSendMessage} />
                <input type="file" onChange={handleFileUpload} />
            </div>
        </div>
    );
};

export default ChatWindow;
