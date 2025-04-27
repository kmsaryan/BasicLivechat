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

    // Handle messages
    socket.on('message', ({ roomId, message }) => {
        // Ensure the sender is correctly set
        const sender = users[socket.id] || message.sender;
        const messageWithSender = {
            ...message,
            sender, // Make sure sender is included
        };
        
        console.log(`Message received in room ${roomId}:`, messageWithSender);
        
        // Broadcast the message to everyone in the room, including the sender
        io.to(roomId).emit('message', messageWithSender);
    });

    // Handle file uploads
    socket.on('file-upload', ({ roomId, fileData }) => {
        // Ensure the sender is correctly set
        const sender = users[socket.id] || fileData.sender;
        const fileDataWithSender = {
            ...fileData,
            sender, // Make sure sender is included
        };
        
        console.log(`File uploaded in room ${roomId}:`, fileDataWithSender);
        
        // Broadcast the file to everyone in the room except the sender
        socket.to(roomId).emit('file-received', fileDataWithSender);
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
        
        // CHANGE: Use io.to instead of socket.broadcast.to to ensure all technicians get the update
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
            
            // Remove from queue
            chatQueue[category].splice(userIndex, 1);
            
            console.log(`Removed user ${userId} from ${category} queue`);
            
            // Create a unique room for this chat
            const chatRoomId = `chat-${userId}-${technicianId}`;
            
            // Send chat accepted to both technician and user
            socket.emit('chat-accepted', { 
                chatRoomId, 
                user // Send full user details
            });
            
            io.to(user.socketId).emit('chat-accepted', { 
                chatRoomId, 
                technicianId,
                technicianName: users[socket.id] || "Support Agent"
            });
            
            // Join both to the new room
            socket.join(chatRoomId);
            io.to(user.socketId).emit('join-room', chatRoomId);
            
            // Update queue for all technicians
            io.to('technicians').emit('queue-update', chatQueue);
        } else {
            console.log(`User ${userId} not found in ${category} queue`);
            socket.emit('error', { message: `User not found in queue` });
        }
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
