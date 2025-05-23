import React, { useState, useEffect } from 'react';
import ChatHistory from './components/ChatHistory';
import InputField from './components/InputField';
import SendButton from './components/SendButton';
import FileUpload from './components/FileUpload';
import EndChatButton from './components/EndChatButton';
import TechnicianSidebar from './components/TechnicianSidebar';
import VideoCallButton from './components/VideoCallButton';
import VideoCall from './components/VideoCall'; // Import the VideoCall component
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
    const [isVideoCallActive, setIsVideoCallActive] = useState(false);
    const [videoCallerId, setVideoCallerId] = useState(null);
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
            const targetRoomId = fileData.roomId || currentChatId || roomId;

            setMessageStore((prev) => {
                const roomMessages = prev[targetRoomId] || [];
                if (!roomMessages.some((m) => m.id === fileData.id)) {
                    const newFileMessage = {
                        id: fileData.id || `file-${Date.now()}`,
                        text: `File received: ${fileData.name}`,
                        isOwn: fileData.sender === role,
                        timestamp: new Date().toLocaleTimeString(),
                        file: fileData,
                    };

                    return {
                        ...prev,
                        [targetRoomId]: [...roomMessages, newFileMessage],
                    };
                }
                return prev;
            });

            // Only add to the current view if it's for the current chat
            if (fileData.roomId === currentChatId) {
                setMessages((prev) => {
                    if (!prev.some((m) => m.id === fileData.id)) {
                        return [
                            ...prev,
                            {
                                id: fileData.id || `file-${Date.now()}`,
                                text: `File received: ${fileData.name}`,
                                isOwn: fileData.sender === role,
                                timestamp: new Date().toLocaleTimeString(),
                                file: fileData,
                            },
                        ];
                    }
                    return prev;
                });
            }
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

        // Listen for video call requests
        socket.on('video-call-request', ({ caller, chatId }) => {
            console.log(`Incoming video call from ${caller} in chat ${chatId}`);
            setVideoCallerId(caller);
            setIsVideoCallActive(true);
        });

        // Listen for video call start
        socket.on('start-call', () => {
            console.log('Video call started');
            setIsVideoCallActive(true);
        });

        // Listen for video call end
        socket.on('call-ended', () => {
            console.log('Video call ended');
            setIsVideoCallActive(false);
        });

        return () => {
            socket.off('message');
            socket.off('file-received');
            socket.off('queue-update');
            socket.off('chat-accepted');
            socket.off('chat-ended');
            socket.off('video-call-request');
            socket.off('start-call');
            socket.off('call-ended');
        };
    }, []);

    useEffect(() => {
        if (currentChatId) {
            setMessages(messageStore[currentChatId] || []);
        }
    }, [currentChatId, messageStore]);

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
            // Fetch chat history (messages and files) from the backend
            fetch(`/chat/history/${chatId}`)
                .then((response) => response.json())
                .then(({ messages, files }) => {
                    // Combine messages and files into a single array
                    const combinedHistory = [
                        ...messages.map((msg) => ({
                            ...msg,
                            isOwn: msg.sender === role,
                        })),
                        ...files.map((file) => ({
                            id: file.id,
                            text: `File: ${file.filename}`,
                            isOwn: file.sender === role,
                            timestamp: file.timestamp,
                            file,
                        })),
                    ];

                    // Sort by timestamp
                    combinedHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                    setMessages(combinedHistory);
                    setCurrentChatId(chatId);
                })
                .catch((err) => console.error('Error fetching chat history:', err));
        } else if (userId && category) {
            // Accept a new chat and create a room
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

    const handleAcceptVideoCall = () => {
        console.log('Accepting video call');
        socket.emit('video-call-accepted', { caller: videoCallerId, roomId: currentChatId });
        setIsVideoCallActive(true);
    };

    const handleDeclineVideoCall = () => {
        console.log('Declining video call');
        socket.emit('video-call-declined', { caller: videoCallerId, roomId: currentChatId });
        setIsVideoCallActive(false);
    };

    const handleEndVideoCall = () => {
        console.log('Ending video call');
        socket.emit('end-call', { roomId: currentChatId });
        setIsVideoCallActive(false);
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
                
                {isVideoCallActive ? (
                    <VideoCall 
                        roomId={currentChatId} 
                        socket={socket} 
                        onEndCall={handleEndVideoCall} 
                    />
                ) : (
                    <>
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
                    </>
                )}
                
                {!isVideoCallActive && videoCallerId && (
                    <div className="video-call-prompt">
                        <p>Incoming video call from {videoCallerId}...</p>
                        <div className="video-call-actions">
                            <button onClick={handleAcceptVideoCall} className="accept-call-btn">
                                Accept
                            </button>
                            <button onClick={handleDeclineVideoCall} className="decline-call-btn">
                                Decline
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TechnicianChat;