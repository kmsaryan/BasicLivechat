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
  
  // Enhanced chatQueue to store complete user info
  const chatQueue = {
    tech: [],
    billing: [],
    general: []
  };
  
  const activeTechnicians = {};
  const userToTechnicianMap = {};
  
  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log('A user connected to Live Chat:', socket.id);

    // Assign role to the user
    socket.on('set-role', ({ role }) => {
      users[socket.id] = role;
      console.log(`Live Chat: User ${socket.id} assigned role: ${role}`);
      
      // Add technicians to a special room for broadcasts
      if (role === 'technician') {
        socket.join('technicians');
        console.log('Technician connected, sending queue update');
        socket.emit('queue-update', chatQueue); // Send queue to new technician
      }
    });

    // Join a room
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`Live Chat: Socket ${socket.id} joined room ${roomId}`);
    });

    // Add to queue when customer selects support category
    socket.on('join-queue', ({ userId, category, name, email, issue }) => {
      console.log(`User ${userId} (${name}) joining ${category} queue with issue: ${issue}`);
      
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
      
      // Notify technicians about the new queue item
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
        
        // Track assignments
        if (!activeTechnicians[technicianId]) {
          activeTechnicians[technicianId] = [];
        }
        activeTechnicians[technicianId].push(chatRoomId);
        userToTechnicianMap[userId] = technicianId;
        
        // Send chat accepted to both technician and user
        socket.emit('chat-accepted', { 
          chatRoomId, 
          user // Send full user details
        });
        
        io.to(user.socketId).emit('chat-accepted', { 
          chatRoomId, 
          technicianId,
          technicianName: "Support Agent" 
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

    // Handle messages
    socket.on('message', ({ roomId, message }) => {
      // Ensure the sender is correctly set
      const sender = users[socket.id] || message.sender;
      const messageWithSender = {
        ...message,
        sender, // Make sure sender is included
      };
      
      console.log(`Live Chat: Message received in room ${roomId}`);
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
      
      console.log(`Live Chat: File uploaded in room ${roomId}`);
      io.to(roomId).emit('file-received', fileDataWithSender);
    });
    
    // Handle end chat
    socket.on('end-chat', ({ chatId, endedBy }) => {
      io.to(chatId).emit('chat-ended', { chatId, endedBy });
      console.log(`Live Chat: Chat ${chatId} ended by ${endedBy}`);
    });
    
    // Handle video call requests
    socket.on('video-call-request', ({ chatId, caller }) => {
      socket.to(chatId).emit('video-call-request', { chatId, caller });
      console.log(`Live Chat: Video call requested in ${chatId} by ${caller}`);
    });
    
    socket.on('video-call-accepted', ({ caller, roomId }) => {
      io.to(roomId).emit('start-call', { isCaller: socket.id === caller });
      console.log(`Live Chat: Video call accepted in ${roomId}`);
    });
    
    socket.on('video-call-declined', ({ caller, roomId }) => {
      io.to(roomId).emit('call-declined');
      console.log(`Live Chat: Video call declined in ${roomId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Live Chat: A user disconnected:', socket.id);
      delete users[socket.id];
      
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

  // Set up API routes with optional prefix
  app.use(`${apiPrefix}/chat`, chatRoutes);
  app.use(`${apiPrefix}/file`, fileRoutes);
  
  console.log('Live Chat system initialized successfully');
  
  return { io };
};

module.exports = setupLiveChat;
