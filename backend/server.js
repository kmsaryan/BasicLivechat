require('dotenv').config(); // Load environment variables
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors'); // Import cors middleware
const chatRoutes = require('./routes/chat');
const fileRoutes = require('./routes/file');

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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch-all route to serve React's index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Socket.IO connection
const users = {}; // Store connected users and their roles

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Assign role to the user
    socket.on('set-role', ({ role }) => {
        users[socket.id] = role; // Store the role for this socket
        console.log(`User ${socket.id} assigned role: ${role}`);
    });

    // Join a room
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
        
        // Broadcast the file to everyone in the room
        io.to(roomId).emit('file-received', fileDataWithSender);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        delete users[socket.id]; // Remove the user from the list
    });
});

// Start server
const PORT = process.env.BACKEND_PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
