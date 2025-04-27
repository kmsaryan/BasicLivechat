const path = require('path');
const { Server } = require('socket.io');
const chatRoutes = require('./routes/chat');
const fileRoutes = require('./routes/file');

/**
 * Sets up live chat functionality on an existing Express/HTTP server
 * @param {Object} server - HTTP server instance
 * @param {Object} app - Express app instance
 * @param {Object} options - Configuration options
 */
const setupLiveChat = (server, app, options = {}) => {
  const {
    corsOrigin = 'http://localhost:3000',
    apiPrefix = '',
    uploadDir = 'uploads'
  } = options;
  
  // Configure Socket.IO
  const io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  // Store connected users and their roles
  const users = {};
  
  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log('A user connected to Live Chat:', socket.id);

    // Assign role to the user
    socket.on('set-role', ({ role }) => {
      users[socket.id] = role;
      console.log(`Live Chat: User ${socket.id} assigned role: ${role}`);
    });

    // Join a room
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`Live Chat: Socket ${socket.id} joined room ${roomId}`);
    });

    // Handle messages
    socket.on('message', ({ roomId, message }) => {
      const sender = users[socket.id] || message.sender;
      const messageWithSender = {
        ...message,
        sender,
      };
      
      console.log(`Live Chat: Message received in room ${roomId}`);
      io.to(roomId).emit('message', messageWithSender);
    });

    // Handle file uploads
    socket.on('file-upload', ({ roomId, fileData }) => {
      const sender = users[socket.id] || fileData.sender;
      const fileDataWithSender = {
        ...fileData,
        sender,
      };
      
      console.log(`Live Chat: File uploaded in room ${roomId}`);
      io.to(roomId).emit('file-received', fileDataWithSender);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Live Chat: A user disconnected:', socket.id);
      delete users[socket.id];
    });
  });

  // Set up API routes with optional prefix
  app.use(`${apiPrefix}/chat`, chatRoutes);
  app.use(`${apiPrefix}/file`, fileRoutes);
  
  console.log('Live Chat system initialized successfully');
  
  return { io };
};

module.exports = setupLiveChat;
