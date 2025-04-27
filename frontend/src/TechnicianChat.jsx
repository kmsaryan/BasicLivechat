import React, { useState, useEffect } from 'react';
import ChatHistory from './components/ChatHistory';
import InputField from './components/InputField';
import SendButton from './components/SendButton';
import FileUpload from './components/FileUpload';
import EndChatButton from './components/EndChatButton';
import TechnicianSidebar from './components/TechnicianSidebar';
import VideoCallButton from './components/VideoCallButton';
import VideoCall from './components/VideoCall'; // Added import
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

        // Listen for video call requests
        socket.on('video-call-request', ({ caller, chatId }) => {
            console.log(`Incoming video call from ${caller} in chat ${chatId}`);
            setVideoCallerId(caller);
            setIsVideoCallActive(false); // Show the incoming call prompt
        });

        // Listen for video call start
        socket.on('start-call', ({ isCaller }) => {
            console.log('Video call started');
            setIsVideoCallActive(true);
            setVideoCallerId(null); // Reset caller ID
        });

        // Listen for video call end
        socket.on('call-ended', () => {
            console.log('Video call ended');
            setIsVideoCallActive(false);
            setVideoCallerId(null); // Reset caller ID
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
    }, [currentChatId]);

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
            console.log('Requesting video call');
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
        setVideoCallerId(null); // Reset caller ID after accepting
    };

    const handleDeclineVideoCall = () => {
        console.log('Declining video call');
        socket.emit('video-call-declined', { caller: videoCallerId, roomId: currentChatId });
        setVideoCallerId(null); // Reset caller ID after declining
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
            {isVideoCallActive && (
                <VideoCall
                    roomId={currentChatId}
                    socket={socket}
                    onEndCall={handleEndVideoCall}
                />
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
    );
};

export default TechnicianChat;
