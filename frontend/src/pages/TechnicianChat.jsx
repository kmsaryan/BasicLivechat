import React, { useState, useEffect } from 'react';
import ChatHistory from '../components/ChatHistory';
import InputField from '../components/InputField';
import SendButton from '../components/SendButton';
import FileUpload from '../components/FileUpload';
import EndChatButton from '../components/EndChatButton';
import TechnicianSidebar from '../components/TechnicianSidebar';
import VideoCallButton from '../components/VideoCallButton';
import '../styles/Technician.css'; // Updated import

import { io } from 'socket.io-client';

const socket = io(`http://localhost:${process.env.REACT_APP_BACKEND_PORT || 5000}`);

const TechnicianChat = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [activeChats, setActiveChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [queue, setQueue] = useState({ tech: [], billing: [], general: [] });
    const [messageStore, setMessageStore] = useState({});
    const roomId = 'chat-room'; // Shared room ID
    const role = 'technician'; // Role of this user
    const technicianId = `tech-${Date.now()}`;

    useEffect(() => {
        // Set role and join room on component mount
        socket.emit('set-role', { role });
        socket.emit('join-room', roomId);

        // Listen for incoming messages
        socket.on('message', (msg) => {
            setMessageStore(prev => {
                const targetRoomId = msg.roomId || currentChatId || roomId;
                const roomMessages = prev[targetRoomId] || [];
                const exists = roomMessages.some(m => 
                    m.id === msg.id && m.timestamp === msg.timestamp
                );
                
                if (!exists) {
                    const updatedRoomMessages = [
                        ...roomMessages,
                        {
                            ...msg,
                            isOwn: msg.sender === role
                        }
                    ];
                    
                    return {
                        ...prev,
                        [targetRoomId]: updatedRoomMessages
                    };
                }
                
                return prev;
            });
            
            if (msg.roomId === currentChatId || !msg.roomId) {
                setMessages(prev => {
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
            }
        });

        // Listen for file uploads
        socket.on('file-received', (fileData) => {
            const targetRoomId = currentChatId || roomId;
            
            setMessageStore(prev => {
                const roomMessages = prev[targetRoomId] || [];
                const newFileMessage = {
                    id: `file-${Date.now()}`,
                    text: `File received: ${fileData.name}`,
                    isOwn: fileData.sender === role,
                    timestamp: new Date().toLocaleTimeString(),
                    file: fileData,
                };
                
                return {
                    ...prev,
                    [targetRoomId]: [...roomMessages, newFileMessage]
                };
            });
            
            setMessages(prev => [
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

        // Listen for queue updates
        socket.on('queue-update', (queueData) => {
            console.log('🔄 Received queue update:', queueData);
            Object.entries(queueData).forEach(([category, users]) => {
                console.log(`Category: ${category}, Users: ${users.length}`);
            });
            setQueue(queueData);
        });

        // Listen for chat accepted events
        socket.on('chat-accepted', ({ chatRoomId, user }) => {
            setCurrentChatId(chatRoomId); // Update to the dedicated room
            socket.emit('join-room', chatRoomId); // Join the dedicated room
            setActiveChats((prev) => [...prev, { chatId: chatRoomId, userName: user.name }]);
        });

        // Listen for chat ended events
        socket.on('chat-ended', ({ chatId, endedBy }) => {
            console.log(`Chat ${chatId} ended by ${endedBy}`);
            setActiveChats((prev) => prev.filter((chat) => chat.chatId !== chatId));
            
            if (currentChatId === chatId) {
                setCurrentChatId(null);
                setMessages([
                    {
                        id: `system-${Date.now()}`,
                        text: `Chat ended by ${endedBy}`,
                        isSystem: true,
                        timestamp: new Date().toLocaleTimeString()
                    }
                ]);
            }
        });

        return () => {
            socket.off('message');
            socket.off('file-received');
            socket.off('queue-update');
            socket.off('chat-accepted');
            socket.off('chat-ended');
        };
    }, []);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        
        const newMessage = {
            id: `msg-${Date.now()}`,
            text: inputValue,
            timestamp: new Date().toLocaleTimeString(),
            sender: role,
        };
        
        socket.emit('message', { roomId: currentChatId || roomId, message: newMessage });
        setInputValue('');
    };

    const handleFileUpload = (file) => {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = () => {
            const fileData = {
                name: file.name,
                type: file.type,
                content: reader.result,
                sender: role,
            };
            socket.emit('file-upload', { roomId: currentChatId || roomId, fileData });
        };
        reader.readAsDataURL(file);
    };

    const handleSelectChat = (chatId, userId, category) => {
        if (chatId) {
            setCurrentChatId(chatId);
            setMessages(messageStore[chatId] || []);
        } else if (userId && category) {
            socket.emit('accept-chat', { technicianId, userId, category });
        }
    };

    const handleEndChat = () => {
        if (currentChatId) {
            socket.emit('end-chat', { 
                chatId: currentChatId,
                endedBy: 'technician'
            });
            
            setActiveChats(prev => prev.filter(chat => chat.chatId !== currentChatId));
            setCurrentChatId(null);
            setMessages([
                {
                    id: `system-${Date.now()}`,
                    text: 'You ended this chat',
                    isSystem: true,
                    timestamp: new Date().toLocaleTimeString()
                }
            ]);
        }
    };

    const handleStartVideoCall = () => {
        if (currentChatId) {
            socket.emit('video-call-request', {
                chatId: currentChatId,
                caller: technicianId
            });
        }
    };

    return (
        <div className="technician-dashboard">
            <TechnicianSidebar 
                activeChats={activeChats}
                currentChatId={currentChatId}
                queue={queue}
                onSelectChat={handleSelectChat}
            />
            
            <div className="chat-window technician-chat">
                <header className="chat-header">
                    <span>Technician Support</span>
                    {currentChatId && (
                        <div className="chat-actions">
                            <VideoCallButton onClick={handleStartVideoCall} />
                            <EndChatButton onEndChat={handleEndChat} />
                        </div>
                    )}
                </header>
                
                {currentChatId ? (
                    <>
                        <ChatHistory messages={messages} />
                        <div className="chat-input-section">
                            <InputField value={inputValue} onChange={setInputValue} />
                            <SendButton onClick={handleSendMessage} />
                            <FileUpload onFileUpload={handleFileUpload} />
                        </div>
                    </>
                ) : (
                    <div className="no-active-chat">
                        <p>Select a chat from the sidebar or accept a customer from the queue.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TechnicianChat;
