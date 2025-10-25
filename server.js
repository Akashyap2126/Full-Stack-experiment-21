const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// CORS: allow the client origin (adjust for production)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001", // React dev server default (change if different)
    methods: ["GET", "POST"]
  }
});

// Simple health route
app.get('/', (req, res) => res.send('Socket.io chat server running'));

// In-memory message history (optional). Limit to last 200 messages
const messageHistory = [];

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // When a new client connects, send recent message history
  socket.emit('messageHistory', messageHistory);

  // Notify others a user connected (optional)
  socket.broadcast.emit('userConnected', { socketId: socket.id });

  // Handle incoming chat messages from clients
  socket.on('chatMessage', (payload) => {
    // payload: { name: string, text: string, timestamp?: number }
    const message = {
      name: payload.name || 'Anonymous',
      text: payload.text || '',
      timestamp: payload.timestamp || Date.now()
    };

    // Save to history (bounded)
    messageHistory.push(message);
    if (messageHistory.length > 200) messageHistory.shift();

    // Broadcast message to all clients (including sender)
    io.emit('chatMessage', message);
  });

  // Handle disconnects
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id} (${reason})`);
    socket.broadcast.emit('userDisconnected', { socketId: socket.id });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
