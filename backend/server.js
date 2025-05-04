require('dotenv').config(); // Load environment variables
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors'); // Import cors middleware
const chatRoutes = require('./routes/chat');
const fileRoutes = require('./routes/file');
const { router: adminRouter, setQueueReference } = require('./routes/admin');
const db = require('./database'); // Ensure database is imported

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: `http://localhost:${process.env.REACT_APP_FRONTEND_PORT || 3000}`, // Allow frontend origin
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'", `ws://localhost:${process.env.BACKEND_PORT || 5000}`],
        },
    },
}));
app.use('/chat', chatRoutes);
app.use('/file', fileRoutes);
app.use('/admin', adminRouter); // Use the admin router

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch-all route to serve React's index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Socket.IO connection
const users = {}; // Store connected users and their roles

// Chat queue for tracking support requests
const chatQueue = {
  tech: [],
  billing: [],
  general: []
};

// Pass queue reference to admin routes
setQueueReference(chatQueue);

let chatRooms = {}; // Store chat room associations

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('set-role', ({ role }) => {
        users[socket.id] = role;
        console.log(`User ${socket.id} assigned role: ${role}`);
        
        if (role === 'technician') {
            socket.join('technicians');
            console.log('👨‍💻 Technician connected and added to technicians room');
            socket.emit('queue-update', chatQueue);
        }
    });

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Add this new event handler for leaving a room
    socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    // Add to queue when customer selects support category
    socket.on('join-queue', ({ userId, category, name, email, issue }) => {
        console.log(`User ${userId} (${name}) joining ${category} queue with issue: ${issue}`);
        
        if (!chatQueue[category]) {
            // Create category if it doesn't exist
            chatQueue[category] = [];
        }
        
        const queueItem = {
            userId,
            socketId: socket.id,
            joinedAt: new Date(),
            category,
            name: name || 'Anonymous',
            email,
            issue
        };
        
        chatQueue[category].push(queueItem);
        
        console.log(`Queue updated: ${category} now has ${chatQueue[category].length} users`);
        
        // Assign a dedicated room for the user
        const userRoomId = `room-${userId}`;
        socket.join(userRoomId); // User joins their dedicated room
        console.log(`User ${userId} joined their dedicated room: ${userRoomId}`);
        
        // Use io.to instead of socket.broadcast.to to ensure all technicians get the update
        io.to('technicians').emit('queue-update', chatQueue);
        
        // Notify user about their position in queue
        const position = chatQueue[category].findIndex(item => item.socketId === socket.id) + 1;
        socket.emit('queue-position', { position, category });
    });

    // Technician accepting a chat from queue
    socket.on('accept-chat', ({ technicianId, userId, category }) => {
        console.log(`Technician ${technicianId} accepting chat from user ${userId} in category ${category}`);
        
        // Find user in queue
        const userIndex = chatQueue[category].findIndex(item => item.userId === userId);
        
        if (userIndex >= 0) {
            const user = chatQueue[category][userIndex];
            const userRoomId = `room-${user.userId}`; // Dedicated room for the user

            // Remove from queue
            chatQueue[category].splice(userIndex, 1);
            
            console.log(`Removed user ${userId} from ${category} queue`);
            
            // Technician joins the user's dedicated room
            socket.join(userRoomId);
            console.log(`Technician ${technicianId} joined room: ${userRoomId}`);
            
            // Notify both parties about the chat room
            socket.emit('chat-accepted', { 
                chatRoomId: userRoomId, 
                user // Send full user details
            });
            
            io.to(user.socketId).emit('chat-accepted', { 
                chatRoomId: userRoomId, 
                technicianId,
                technicianName: users[socket.id] || "Support Agent"
            });
            
            // Store the room association for this chat
            chatRooms = chatRooms || {};
            chatRooms[userRoomId] = {
                technicianId,
                userId,
                createdAt: new Date()
            };
            
            // Update queue for all technicians
            io.to('technicians').emit('queue-update', chatQueue);
        } else {
            console.log(`User ${userId} not found in ${category} queue`);
            socket.emit('error', { message: `User not found in queue` });
        }
    });

    // Handle messages
    socket.on('message', ({ roomId, message }) => {
        // Ensure the sender is correctly set
        const sender = users[socket.id] || message.sender;
        const messageWithSender = {
            ...message,
            sender, // Make sure sender is included
            roomId  // Include the room ID with the message
        };
        
        console.log(`Message received in room ${roomId}:`, messageWithSender);
        
        // Broadcast the message to the specific room
        io.to(roomId).emit('message', messageWithSender);
    });

    // Handle file uploads
    socket.on('file-upload', ({ roomId, fileData }) => {
        const sender = users[socket.id] || fileData.sender;
        const fileDataWithSender = {
            ...fileData,
            sender,
            roomId,
            id: fileData.id || `file-${Date.now()}`, // Ensure unique ID
        };

        console.log(`File uploaded in room ${roomId}:`, {
            name: fileDataWithSender.name,
            type: fileDataWithSender.type,
            sender: fileDataWithSender.sender,
        });

        // Store file in the database
        db.run(
            'INSERT INTO files (filename, filepath, roomId, sender) VALUES (?, ?, ?, ?)',
            [fileDataWithSender.name, fileDataWithSender.content, roomId, sender],
            function (err) {
                if (err) {
                    console.error("Error storing file in database:", err.message);
                    return;
                }
                console.log(`File stored in database with ID: ${this.lastID}`);
            }
        );

        // Broadcast the file to everyone in the room
        io.to(roomId).emit('file-received', fileDataWithSender);
    });

    // Handle end chat
    socket.on('end-chat', ({ chatId, endedBy }) => {
        console.log(`Ending chat session in room ${chatId} by ${endedBy}`);
        
        // Broadcast the end-chat event to all participants in the room
        io.to(chatId).emit('chat-ended', { chatId, endedBy });
        
        // Leave the room for all participants
        const socketsInRoom = io.sockets.adapter.rooms.get(chatId);
        if (socketsInRoom) {
            socketsInRoom.forEach((socketId) => {
                const socketInstance = io.sockets.sockets.get(socketId);
                if (socketInstance) {
                    socketInstance.leave(chatId);
                }
            });
        }

        // Clear the room association
        if (chatRooms && chatRooms[chatId]) {
            delete chatRooms[chatId];
        }

        // Reset the user's session
        Object.keys(users).forEach((socketId) => {
            if (users[socketId] === chatId) {
                delete users[socketId];
            }
        });
    });

    // Handle video call requests
    socket.on('video-call-request', ({ chatId, caller }) => {
        console.log(`Video call requested by ${caller} in chat ${chatId}`);
        io.to(chatId).emit('video-call-request', { caller, chatId });
    });

    // Handle video call acceptance
    socket.on('video-call-accepted', ({ caller, roomId }) => {
        console.log(`Video call accepted in room ${roomId}`);
        io.to(roomId).emit('start-call', { isCaller: socket.id === caller });
    });

    // Handle video call decline
    socket.on('video-call-declined', ({ caller, roomId }) => {
        console.log(`Video call declined in room ${roomId}`);
        io.to(roomId).emit('call-declined');
    });

    // Handle end call
    socket.on('end-call', ({ roomId }) => {
        console.log(`Call ended in room ${roomId}`);
        io.to(roomId).emit('call-ended');
    });

    socket.on('ice-candidate', ({ candidate, roomId }) => {
        console.log(`ICE candidate received for room ${roomId}`);
        socket.to(roomId).emit('ice-candidate', { candidate });
    });

    socket.on('offer', ({ offer, roomId }) => {
        console.log(`Offer received for room ${roomId}`);
        socket.to(roomId).emit('offer', { offer });
    });

    socket.on('answer', ({ answer, roomId }) => {
        console.log(`Answer received for room ${roomId}`);
        socket.to(roomId).emit('answer', { answer });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        delete users[socket.id]; // Remove the user from the list
        
        // Remove from queues if they were waiting
        Object.keys(chatQueue).forEach(category => {
            const index = chatQueue[category].findIndex(item => item.socketId === socket.id);
            if (index >= 0) {
                console.log(`Removing disconnected user from ${category} queue`);
                chatQueue[category].splice(index, 1);
                // Update technicians about queue change
                io.to('technicians').emit('queue-update', chatQueue);
            }
        });
    });
});

// Add a debugging endpoint to check current queue state
app.get('/admin/queue-status', (req, res) => {
    const status = {
        queueState: chatQueue,
        counts: {
            tech: chatQueue.tech?.length || 0,
            billing: chatQueue.billing?.length || 0,
            general: chatQueue.general?.length || 0
        },
        technicians: {
            count: io.sockets.adapter.rooms.get('technicians')?.size || 0
        }
    };
    res.json(status);
});

// Start server
const PORT = process.env.BACKEND_PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
