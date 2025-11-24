require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Simple MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realtime-chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log('❌ MongoDB connection error:', err);
});

// Simple Message Schema
const messageSchema = new mongoose.Schema({
  room: String,
  text: String,
  username: String,
  userId: String,
  type: { type: String, default: 'user' },
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Store connected users in memory (for real-time features)
const connectedUsers = new Map();
const rooms = ['general', 'random', 'tech', 'gaming'];

// Simple user authentication (still in memory for now)
app.post('/api/auth', (req, res) => {
  const { username } = req.body;
  
  if (!username || username.trim().length < 2) {
    return res.status(400).json({ error: 'Username must be at least 2 characters long' });
  }
  
  const isUsernameTaken = Array.from(connectedUsers.values())
    .some(user => user.username.toLowerCase() === username.toLowerCase());
  
  if (isUsernameTaken) {
    return res.status(400).json({ error: 'Username is already taken' });
  }
  
  res.json({ success: true, username });
});

app.get('/api/rooms', (req, res) => {
  res.json({ rooms });
});

app.get('/', (req, res) => {
  res.send('Socket.io server running with MongoDB');
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  // User joins with username
  socket.on('user-join', async (userData) => {
    const user = {
      id: socket.id,
      username: userData.username,
      isOnline: true,
      joinedAt: new Date(),
      currentRoom: 'general'
    };
    
    connectedUsers.set(socket.id, user);
    
    // Join general room by default
    socket.join('general');
    
    // Load last 50 messages from MongoDB
    try {
      const recentMessages = await Message.find({ room: 'general' })
        .sort({ timestamp: -1 })
        .limit(50)
        .lean();
      
      // Send welcome message with message history
      socket.emit('welcome', { 
        message: `Welcome to the chat, ${userData.username}!`, 
        user,
        onlineUsers: Array.from(connectedUsers.values()),
        availableRooms: rooms,
        recentMessages: recentMessages.reverse() // Show oldest first
      });
    } catch (error) {
      console.log('Error loading messages:', error);
      // Send welcome without history if DB fails
      socket.emit('welcome', { 
        message: `Welcome to the chat, ${userData.username}!`, 
        user,
        onlineUsers: Array.from(connectedUsers.values()),
        availableRooms: rooms,
        recentMessages: []
      });
    }

    // Notify all other users about new user
    socket.broadcast.emit('user-joined', {
      user,
      message: `${userData.username} joined the chat`,
      onlineUsers: Array.from(connectedUsers.values())
    });

    console.log(`User ${userData.username} joined with ID: ${socket.id}`);
  });

  // Handle room messages with MongoDB storage
  socket.on('send-message', async (payload) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    try {
      // Save message to MongoDB
      const messageData = new Message({
        room: user.currentRoom,
        text: payload.text,
        username: user.username,
        userId: socket.id,
        type: 'user',
        timestamp: new Date()
      });

      await messageData.save();

      const messageForClients = {
        id: messageData._id.toString(),
        text: messageData.text,
        username: messageData.username,
        userId: messageData.userId,
        timestamp: messageData.timestamp,
        type: messageData.type,
        room: messageData.room,
        reactions: {}
      };

      console.log(`Message saved to DB from ${user.username}: ${payload.text}`);
      
      // Send to room members
      io.to(user.currentRoom).emit('new-message', messageForClients);

    } catch (error) {
      console.log('Error saving message to DB:', error);
      // Fallback: send message without saving to DB
      const fallbackMessage = {
        id: Date.now().toString(),
        text: payload.text,
        username: user.username,
        userId: socket.id,
        timestamp: new Date().toISOString(),
        type: 'user',
        room: user.currentRoom,
        reactions: {}
      };
      
      io.to(user.currentRoom).emit('new-message', fallbackMessage);
    }
  });

  // Load more messages from MongoDB
  socket.on('load-more-messages', async (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    try {
      const messages = await Message.find({ room: data.room })
        .sort({ timestamp: -1 })
        .skip(data.offset)
        .limit(data.limit)
        .lean();

      const hasMore = messages.length === data.limit;

      socket.emit('more-messages-loaded', {
        room: data.room,
        messages: messages.reverse(),
        hasMore: hasMore
      });
    } catch (error) {
      console.log('Error loading more messages:', error);
      socket.emit('error', { message: 'Failed to load messages' });
    }
  });

  // Search messages in MongoDB
  socket.on('search-messages', async (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    try {
      const searchResults = await Message.find({
        room: data.room,
        text: { $regex: data.query, $options: 'i' },
        type: 'user'
      })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

      socket.emit('search-results', {
        query: data.query,
        results: searchResults,
        room: data.room
      });
    } catch (error) {
      console.log('Error searching messages:', error);
      socket.emit('search-results', {
        query: data.query,
        results: [],
        room: data.room
      });
    }
  });

  // ... rest of your existing socket handlers (typing, reactions, private messages, etc.)
  // Keep all your existing code for these features

  // Handle room changes
  socket.on('join-room', (roomData) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    socket.leave(user.currentRoom);
    socket.join(roomData.room);
    user.currentRoom = roomData.room;

    socket.to(roomData.room).emit('user-joined-room', {
      user,
      message: `${user.username} joined ${roomData.room}`,
      room: roomData.room
    });

    socket.emit('room-joined', {
      room: roomData.room,
      message: `You joined ${roomData.room}`
    });
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const targetRoom = data.room || user.currentRoom;
    socket.to(targetRoom).emit('user-typing', { 
      username: user.username,
      isTyping: true,
      room: targetRoom
    });
  });

  socket.on('typing-stop', (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const targetRoom = data.room || user.currentRoom;
    socket.to(targetRoom).emit('user-typing', { 
      username: user.username,
      isTyping: false,
      room: targetRoom
    });
  });

  // Handle message reactions
  socket.on('react-to-message', (reactionData) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    io.to(user.currentRoom).emit('message-reaction', {
      messageId: reactionData.messageId,
      reaction: reactionData.reaction,
      username: user.username,
      room: user.currentRoom
    });
  });

  // Handle private messages (keep existing)
  socket.on('send-private-message', (payload) => {
    const fromUser = connectedUsers.get(socket.id);
    const toUser = Array.from(connectedUsers.values()).find(u => u.username === payload.toUsername);
    
    if (!fromUser || !toUser) return;

    const messageData = {
      id: Date.now().toString(),
      text: payload.text,
      fromUsername: fromUser.username,
      toUsername: toUser.username,
      timestamp: new Date().toISOString(),
      type: 'private',
      read: false,
      isOwnMessage: false
    };

    // Send to recipient
    io.to(toUser.id).emit('new-private-message', {
      ...messageData,
      isOwnMessage: false
    });

    // Send back to sender
    socket.emit('new-private-message', {
      ...messageData,
      isOwnMessage: true
    });

    console.log(`Private message from ${fromUser.username} to ${toUser.username}: ${payload.text}`);
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    const user = connectedUsers.get(socket.id);
    
    if (user) {
      connectedUsers.delete(socket.id);
      
      socket.broadcast.emit('user-left', {
        user,
        message: `${user.username} left the chat`,
        onlineUsers: Array.from(connectedUsers.values())
      });

      console.log(`User ${user.username} disconnected:`, socket.id, 'reason:', reason);
    }
  });

  // Get online users
  socket.on('get-online-users', () => {
    socket.emit('online-users-list', Array.from(connectedUsers.values()));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT} with MongoDB`));