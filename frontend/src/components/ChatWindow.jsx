import React, { useState, useEffect } from 'react';
import '../styles/ChatWindow.css';
import ChatHistory from './ChatHistory';
import InputField from './InputField';
import SendButton from './SendButton';
import FileUpload from './FileUpload';
import SuggestionsSection from './SuggestionsSection';
import EndChatButton from './EndChatButton';
import VideoCallButton from './VideoCallButton';
import QueueSelector from './QueueSelector';
import VideoCall from './VideoCall'; // Import the VideoCall component
import { io } from 'socket.io-client';

const socket = io(`http://localhost:${process.env.REACT_APP_BACKEND_PORT || 5000}`);

const ChatWindow = ({ customStyles = {}, customLayout = null }) => {
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
    const [currentChatId, setCurrentChatId] = useState('chat-room'); // Track the current chat room ID
    const [userName, setUserName] = useState(''); // Add state for user name
    const [isVideoCallActive, setIsVideoCallActive] = useState(false); // Track video call state
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
        socket.emit('join-room', currentChatId);

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

        // Ensure files are correctly associated with the chat room
        socket.on('file-received', (fileData) => {
            if (fileData.roomId === currentChatId) {
                setMessages((prev) => {
                    if (!prev.some(m => m.id === fileData.id)) {
                        return [
                            ...prev,
                            {
                                id: fileData.id,
                                text: `File: ${fileData.name}`,
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

        // Listen for queue position updates
        socket.on('queue-position', ({ position, category }) => {
            setQueuePosition(position);
            setQueueCategory(category);
        });

        // Listen for chat accepted events
        socket.on('chat-accepted', ({ chatRoomId, technicianId, technicianName }) => {
            setInQueue(false);
            setChatStarted(true);
            // Update the current chat ID to the dedicated room
            setCurrentChatId(chatRoomId);

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
            console.log(`Chat ended by ${endedBy}`);
            setChatStarted(false);
            setMessages([]); // Clear messages
            setInQueue(false); // Reset queue state
            setQueuePosition(null); // Reset queue position
            setQueueCategory(null); // Reset queue category
            setCurrentChatId('chat-room'); // Reset to default room
        });

        // Listen for video call requests
        socket.on('video-call-request', ({ caller }) => {
            console.log(`Incoming video call from ${caller}`);
            setShowVideoCallPrompt(true);
            setVideoCallerId(caller);
        });

        // Listen for video call start
        socket.on('start-call', ({ isCaller }) => {
            console.log('Video call started');
            setInVideoCall(true);
            setShowVideoCallPrompt(false); // Hide the prompt
            setVideoCallerId(null); // Reset caller ID
        });

        // Listen for video call end
        socket.on('call-ended', () => {
            console.log('Video call ended');
            setInVideoCall(false);
            setShowVideoCallPrompt(false);
            setVideoCallerId(null); // Reset caller ID
        });

        return () => {
            socket.off('message');
            socket.off('file-received');
            socket.off('queue-position');
            socket.off('chat-accepted');
            socket.off('chat-ended');
            socket.off('video-call-request');
            socket.off('start-call');
            socket.off('call-ended');
        };
    }, [currentChatId, messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        
        const newMessage = {
            id: `msg-${Date.now()}`, // Ensure globally unique ID
            text: inputValue,
            timestamp: new Date().toLocaleTimeString(),
            sender: role, // Include sender role directly in message
        };
        
        // Send the message to the user's dedicated room
        socket.emit('message', { roomId: currentChatId, message: newMessage });
        setInputValue('');
    };

    const handleFileUpload = (file) => {
        if (!file) {
            console.error("Invalid file object received");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const fileData = {
                name: file.name,
                type: file.type,
                content: reader.result,
                sender: role,
                id: `file-${Date.now()}`, // Ensure unique ID
            };

            // Emit the file upload event to the server
            socket.emit('file-upload', { roomId: currentChatId, fileData });
        };
        reader.onerror = () => {
            console.error("Error reading file:", file.name);
        };
        reader.readAsDataURL(file);
    };

    const handleJoinQueue = (userInfo) => {
        console.log('Joining queue with info:', userInfo);
        
        // Store user name for display in header
        setUserName(userInfo.name || 'Anonymous');
        
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
            chatId: currentChatId, // Use the current chat ID
            endedBy: 'customer'
        });
        
        setChatStarted(false);
        setMessages([]);
        setCurrentChatId('chat-room'); // Reset to default room
    };

    const handleStartVideoCall = () => {
        setIsVideoCallActive(true); // Activate video call
        socket.emit('video-call-request', {
            chatId: currentChatId,
            caller: userId
        });
    };

    const handleEndVideoCall = () => {
        setIsVideoCallActive(false); // Deactivate video call
        socket.emit('end-call', { roomId: currentChatId });
    };

    const handleAcceptVideoCall = () => {
        console.log('Accepting video call');
        socket.emit('video-call-accepted', { caller: videoCallerId, roomId: currentChatId });
        setInVideoCall(true);
        setShowVideoCallPrompt(false);
    };

    const handleDeclineVideoCall = () => {
        console.log('Declining video call');
        socket.emit('video-call-declined', { caller: videoCallerId, roomId: currentChatId });
        setShowVideoCallPrompt(false);
        setVideoCallerId(null); // Reset caller ID after declining
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
        <div className="chat-window" style={customStyles}>
            {customLayout ? (
                customLayout({ messages, inputValue, handleSendMessage })
            ) : (
                <>
                    <header className="chat-header">
                        {userName ? (
                            <div className="user-header-info">
                                <span className="user-name-display">{userName}</span>
                                {chatStarted && <span className="connection-status">Connected</span>}
                                {inQueue && <span className="queue-status">In Queue</span>}
                            </div>
                        ) : (
                            <span>Live Chat</span>
                        )}
                        {chatStarted && (
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
                        renderContent()
                    )}
                    
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
                </>
            )}
        </div>
    );
};

export default ChatWindow;
