import React, { useState, useEffect } from 'react';
import ChatHistory from './ChatHistory';
import InputField from './InputField';
import SendButton from './SendButton';
import FileUpload from './FileUpload';
import SuggestionsSection from './SuggestionsSection';
import EndChatButton from './EndChatButton';
import VideoCallButton from './VideoCallButton';
import QueueSelector from './QueueSelector';
import { io } from 'socket.io-client';

const socket = io(`http://localhost:${process.env.REACT_APP_BACKEND_PORT || 5000}`);

const ChatWindow = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [chatStarted, setChatStarted] = useState(false);
    const [inQueue, setInQueue] = useState(false);
    const [queuePosition, setQueuePosition] = useState(null);
    const [queueCategory, setQueueCategory] = useState(null);
    const [userId] = useState(`user-${Date.now()}`); // Generate unique user id
    const [showVideoCallPrompt, setShowVideoCallPrompt] = useState(false);
    const [videoCallerId, setVideoCallerId] = useState(null);
    const [inVideoCall, setInVideoCall] = useState(false);
    const roomId = 'chat-room'; // Shared room ID
    const role = 'customer'; // Role of this user

    // Define supportCategories directly in this component
    const supportCategories = [
      { id: "tech", name: "Technical Support" },
      { id: "billing", name: "Billing Questions" },
      { id: "general", name: "General Inquiry" },
    ];

    useEffect(() => {
        // Set role and join room on component mount
        socket.emit('set-role', { role });
        socket.emit('join-room', roomId);

        // Listen for incoming messages
        socket.on('message', (msg) => {
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

        // Listen for queue position updates
        socket.on('queue-position', ({ position, category }) => {
            setQueuePosition(position);
            setQueueCategory(category);
        });

        // Listen for chat accepted events
        socket.on('chat-accepted', ({ chatRoomId, technicianId, technicianName }) => {
            setInQueue(false);
            setChatStarted(true);
            setMessages(prev => [
                ...prev,
                {
                    id: `system-${Date.now()}`,
                    text: `You've been connected with ${technicianName}`,
                    isSystem: true,
                    timestamp: new Date().toLocaleTimeString()
                }
            ]);
            
            // Join the new chat room
            socket.emit('join-room', chatRoomId);
        });

        // Listen for chat ended events
        socket.on('chat-ended', ({ endedBy }) => {
            setChatStarted(false);
            setMessages(prev => [
                ...prev,
                {
                    id: `system-${Date.now()}`,
                    text: `Chat ended by ${endedBy}`,
                    isSystem: true,
                    timestamp: new Date().toLocaleTimeString()
                }
            ]);
        });

        // Listen for video call requests
        socket.on('video-call-request', ({ caller }) => {
            // Show video call UI or notification here
            setShowVideoCallPrompt(true);
            setVideoCallerId(caller);
        });

        return () => {
            socket.off('message');
            socket.off('file-received');
            socket.off('queue-position');
            socket.off('chat-accepted');
            socket.off('chat-ended');
            socket.off('video-call-request');
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

    const handleFileUpload = (file) => {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = () => {
            const fileData = {
                name: file.name,
                type: file.type,
                content: reader.result,
                sender: role, // Add sender information
            };
            socket.emit('file-upload', { roomId, fileData });
        };
        reader.readAsDataURL(file);
    };

    const handleJoinQueue = (userInfo) => {
        console.log('Joining queue with info:', userInfo);
        
        // Make sure we're passing all the information
        socket.emit('join-queue', {
            userId,
            category: userInfo.category,
            name: userInfo.name,
            email: userInfo.email,
            issue: userInfo.issue
        });
        
        setInQueue(true);
        setQueueCategory(userInfo.category);
        
        // Add a system message about joining the queue
        setMessages(prev => [
            ...prev,
            {
                id: `system-${Date.now()}`,
                text: `You've joined the ${userInfo.category} support queue. Please wait for a technician.`,
                isSystem: true,
                timestamp: new Date().toLocaleTimeString()
            }
        ]);
    };

    const handleEndChat = () => {
        socket.emit('end-chat', { 
            chatId: roomId,
            endedBy: 'customer'
        });
        
        setChatStarted(false);
        setMessages(prev => [
            ...prev,
            {
                id: `system-${Date.now()}`,
                text: 'You ended this chat',
                isSystem: true,
                timestamp: new Date().toLocaleTimeString()
            }
        ]);
    };

    const handleStartVideoCall = () => {
        // Logic to start a video call
        socket.emit('video-call-request', {
            chatId: roomId,
            caller: userId
        });
    };

    const handleAcceptVideoCall = () => {
        // Logic to accept and start video call
        setInVideoCall(true);
        socket.emit('video-call-accepted', { 
            caller: videoCallerId,
            roomId
        });
    };

    const handleDeclineVideoCall = () => {
        setShowVideoCallPrompt(false);
        socket.emit('video-call-declined', {
            caller: videoCallerId,
            roomId
        });
    };

    const handleSuggestionClick = (suggestion) => {
        setInputValue(suggestion);
    };

    const renderContent = () => {
        if (!chatStarted && !inQueue) {
            return <QueueSelector 
                onSubmit={handleJoinQueue}
                supportCategories={supportCategories}
            />;
        }
        
        if (inQueue) {
            return (
                <div className="in-queue-message">
                    <h3>You're in Queue</h3>
                    <p>Category: {queueCategory}</p>
                    {queuePosition && <p>Position: {queuePosition}</p>}
                    <p>A support representative will be with you shortly.</p>
                </div>
            );
        }
        
        return (
            <>
                <ChatHistory messages={messages} />
                <div className="chat-input-section">
                    <InputField value={inputValue} onChange={setInputValue} />
                    <SendButton onClick={handleSendMessage} />
                    <FileUpload onFileUpload={handleFileUpload} />
                </div>
                <SuggestionsSection 
                    messageHistory={messages} 
                    onSuggestionClick={handleSuggestionClick}
                />
            </>
        );
    };

    return (
        <div className="chat-window">
            <header className="chat-header">
                <span>Live Chat</span>
                {chatStarted && (
                    <div className="chat-actions">
                        <VideoCallButton onClick={handleStartVideoCall} />
                        <EndChatButton onEndChat={handleEndChat} />
                    </div>
                )}
            </header>
            
            {renderContent()}
            
            {showVideoCallPrompt && (
                <div className="video-call-prompt">
                    <p>Incoming video call from support...</p>
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

export default ChatWindow;
