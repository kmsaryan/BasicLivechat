require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Import live chat setup from the "submodule"
// Note: In a real submodule scenario, this path would be different
const setupLiveChat = require('../backend/setup');

// Your other middleware and routes
app.use(express.json());
app.use(express.static('client/build'));

// Add your regular routes
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Setup live chat with your server instance
setupLiveChat(server, app, {
  corsOrigin: 'http://localhost:3001', // Client runs on port 3001
  apiPrefix: '/api/livechat'
});

// Catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
