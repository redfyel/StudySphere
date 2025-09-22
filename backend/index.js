const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Store room data and user information
const rooms = new Map();
const users = new Map();

// Room data structure
class Room {
  constructor(id) {
    this.id = id;
    this.participants = new Map();
    this.notes = '';
    this.timer = 0;
    this.targets = [];
    this.joinRequests = [];
    this.createdAt = new Date();
    this.isLocked = false;
  }

  addParticipant(userId, userInfo) {
    this.participants.set(userId, {
      ...userInfo,
      joinedAt: new Date()
    });
  }

  removeParticipant(userId) {
    this.participants.delete(userId);
  }

  getParticipants() {
    return Array.from(this.participants.entries()).map(([id, info]) => ({
      id,
      ...info
    }));
  }

  addJoinRequest(userId, username) {
    this.joinRequests.push({
      userId,
      username,
      requestedAt: new Date()
    });
  }

  removeJoinRequest(userId) {
    this.joinRequests = this.joinRequests.filter(req => req.userId !== userId);
  }
}

// User data structure
class User {
  constructor(id, socketId) {
    this.id = id;
    this.socketId = socketId;
    this.username = '';
    this.roomId = null;
    this.isConnected = true;
    this.isMuted = false;
    this.isCameraOff = false;
    this.isScreenSharing = false;
  }
}

// Helper function to get room safely
function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Room(roomId));
  }
  return rooms.get(roomId);
}

// Helper function to broadcast to room
function broadcastToRoom(roomId, event, data, excludeSocketId = null) {
  const room = rooms.get(roomId);
  if (room) {
    room.participants.forEach((participant, userId) => {
      const user = users.get(userId);
      if (user && user.socketId !== excludeSocketId) {
        io.to(user.socketId).emit(event, data);
      }
    });
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Generate unique user ID and store user
  const userId = uuidv4();
  const user = new User(userId, socket.id);
  users.set(userId, user);
  
  // Send user ID to client
  socket.emit('user-id-assigned', userId);

  // Handle joining a room
  socket.on('join-room', ({ roomId, username }) => {
    try {
      const room = getRoom(roomId);
      user.username = username;
      user.roomId = roomId;

      // Check if room is locked (has existing participants)
      if (room.participants.size > 0 && room.isLocked) {
        // Add to join requests
        room.addJoinRequest(userId, username);
        
        // Notify existing participants about join request
        broadcastToRoom(roomId, 'new-join-request', {
          userId,
          username,
          requestedAt: new Date()
        });
        
        socket.emit('join-request-pending', { roomId });
        return;
      }

      // Add user to room
      room.addParticipant(userId, {
        name: username,
        socketId: socket.id,
        isMuted: user.isMuted,
        isCameraOff: user.isCameraOff,
        isScreenSharing: user.isScreenSharing
      });

      // Join socket room for easy broadcasting
      socket.join(roomId);

      // Send current room state to the new user
      socket.emit('room-state', {
        roomId,
        notes: room.notes,
        timer: room.timer,
        targets: room.targets,
        participants: room.getParticipants(),
        joinRequests: room.joinRequests,
        localUserId: userId
      });

      // Notify other participants about the new user
      broadcastToRoom(roomId, 'user-connected', {
        userId,
        username,
        isMuted: user.isMuted,
        isCameraOff: user.isCameraOff,
        isScreenSharing: user.isScreenSharing
      }, socket.id);

      console.log(`User ${username} (${userId}) joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle WebRTC signaling
  socket.on('signal', ({ targetUserId, signal }) => {
    try {
      const targetUser = users.get(targetUserId);
      if (targetUser && targetUser.socketId) {
        io.to(targetUser.socketId).emit('signal', {
          userId: user.id,
          signal
        });
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  });

  // Handle ICE candidates
  socket.on('ice-candidate', ({ targetUserId, candidate }) => {
    try {
      const targetUser = users.get(targetUserId);
      if (targetUser && targetUser.socketId) {
        io.to(targetUser.socketId).emit('ice-candidate', {
          userId: user.id,
          candidate
        });
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  });

  // Handle media state updates
  socket.on('media-state-update', ({ isMuted, isCameraOff, isScreenSharing }) => {
    try {
      if (user.roomId) {
        user.isMuted = isMuted;
        user.isCameraOff = isCameraOff;
        user.isScreenSharing = isScreenSharing;

        const room = rooms.get(user.roomId);
        if (room && room.participants.has(user.id)) {
          // Update participant info in room
          const participant = room.participants.get(user.id);
          participant.isMuted = isMuted;
          participant.isCameraOff = isCameraOff;
          participant.isScreenSharing = isScreenSharing;

          // Broadcast to other participants
          broadcastToRoom(user.roomId, 'media-state-changed', {
            userId: user.id,
            isMuted,
            isCameraOff,
            isScreenSharing
          }, socket.id);
        }
      }
    } catch (error) {
      console.error('Error updating media state:', error);
    }
  });

  // Handle notes updates
  socket.on('notes-update', ({ roomId, notes }) => {
    try {
      const room = rooms.get(roomId);
      if (room && user.roomId === roomId) {
        room.notes = notes;
        broadcastToRoom(roomId, 'notes-update', notes, socket.id);
      }
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  });

  // Handle timer updates
  socket.on('timer-update', ({ roomId, timer }) => {
    try {
      const room = rooms.get(roomId);
      if (room && user.roomId === roomId) {
        room.timer = timer;
        broadcastToRoom(roomId, 'timer-update', timer, socket.id);
      }
    } catch (error) {
      console.error('Error updating timer:', error);
    }
  });

  // Handle targets updates
  socket.on('targets-update', ({ roomId, targets }) => {
    try {
      const room = rooms.get(roomId);
      if (room && user.roomId === roomId) {
        room.targets = targets;
        broadcastToRoom(roomId, 'targets-update', targets, socket.id);
      }
    } catch (error) {
      console.error('Error updating targets:', error);
    }
  });

  // Handle join request responses
  socket.on('join-request-response', ({ roomId, userId: requesterId, action }) => {
    try {
      const room = rooms.get(roomId);
      if (!room || user.roomId !== roomId) return;

      const requesterUser = users.get(requesterId);
      if (!requesterUser) return;

      room.removeJoinRequest(requesterId);

      if (action === 'approve') {
        // Add user to room
        room.addParticipant(requesterId, {
          name: requesterUser.username,
          socketId: requesterUser.socketId,
          isMuted: requesterUser.isMuted,
          isCameraOff: requesterUser.isCameraOff,
          isScreenSharing: requesterUser.isScreenSharing
        });

        // Join socket room
        io.sockets.sockets.get(requesterUser.socketId)?.join(roomId);

        // Notify approved user
        io.to(requesterUser.socketId).emit('join-approved', roomId);
        
        // Send room state to approved user
        io.to(requesterUser.socketId).emit('room-state', {
          roomId,
          notes: room.notes,
          timer: room.timer,
          targets: room.targets,
          participants: room.getParticipants(),
          joinRequests: room.joinRequests,
          localUserId: requesterId
        });

        // Notify all participants about new user
        broadcastToRoom(roomId, 'user-connected', {
          userId: requesterId,
          username: requesterUser.username,
          isMuted: requesterUser.isMuted,
          isCameraOff: requesterUser.isCameraOff,
          isScreenSharing: requesterUser.isScreenSharing
        });
      } else {
        // Notify rejected user
        io.to(requesterUser.socketId).emit('join-rejected', roomId);
      }

      // Update join requests for all participants
      broadcastToRoom(roomId, 'update-join-requests', room.joinRequests);
    } catch (error) {
      console.error('Error handling join request response:', error);
    }
  });

  // Handle chat messages
  socket.on('chat-message', ({ roomId, message }) => {
    try {
      if (user.roomId === roomId) {
        const chatMessage = {
          id: uuidv4(),
          userId: user.id,
          username: user.username,
          message,
          timestamp: new Date(),
          type: 'text'
        };

        broadcastToRoom(roomId, 'chat-message', chatMessage);
        socket.emit('chat-message', chatMessage); // Send to sender as well
      }
    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  });

  // Handle file sharing
  socket.on('file-share', ({ roomId, fileData, fileName, fileType }) => {
    try {
      if (user.roomId === roomId) {
        const fileMessage = {
          id: uuidv4(),
          userId: user.id,
          username: user.username,
          fileName,
          fileType,
          fileData,
          timestamp: new Date(),
          type: 'file'
        };

        broadcastToRoom(roomId, 'file-share', fileMessage);
        socket.emit('file-share', fileMessage); // Send to sender as well
      }
    } catch (error) {
      console.error('Error handling file share:', error);
    }
  });

  // Handle screen sharing
  socket.on('screen-share-start', ({ roomId }) => {
    try {
      if (user.roomId === roomId) {
        user.isScreenSharing = true;
        broadcastToRoom(roomId, 'screen-share-started', {
          userId: user.id,
          username: user.username
        }, socket.id);
      }
    } catch (error) {
      console.error('Error handling screen share start:', error);
    }
  });

  socket.on('screen-share-stop', ({ roomId }) => {
    try {
      if (user.roomId === roomId) {
        user.isScreenSharing = false;
        broadcastToRoom(roomId, 'screen-share-stopped', {
          userId: user.id,
          username: user.username
        }, socket.id);
      }
    } catch (error) {
      console.error('Error handling screen share stop:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    try {
      console.log(`User disconnected: ${socket.id}`);
      
      if (user.roomId) {
        const room = rooms.get(user.roomId);
        if (room) {
          room.removeParticipant(user.id);
          
          // Notify other participants
          broadcastToRoom(user.roomId, 'user-disconnected', user.id);
          
          // Clean up empty rooms
          if (room.participants.size === 0) {
            rooms.delete(user.roomId);
            console.log(`Room ${user.roomId} deleted (empty)`);
          }
        }
      }
      
      // Remove user from users map
      users.delete(user.id);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  // Handle explicit leave room
  socket.on('leave-room', () => {
    try {
      if (user.roomId) {
        const room = rooms.get(user.roomId);
        if (room) {
          room.removeParticipant(user.id);
          broadcastToRoom(user.roomId, 'user-disconnected', user.id);
          
          if (room.participants.size === 0) {
            rooms.delete(user.roomId);
          }
        }
        user.roomId = null;
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });
});

// REST API endpoints
app.get('/api/rooms/:roomId/exists', (req, res) => {
  const { roomId } = req.params;
  const exists = rooms.has(roomId);
  res.json({ exists, participantCount: exists ? rooms.get(roomId).participants.size : 0 });
});

app.post('/api/rooms/:roomId/create', (req, res) => {
  const { roomId } = req.params;
  const { username } = req.body;
  
  if (!rooms.has(roomId)) {
    const room = new Room(roomId);
    rooms.set(roomId, room);
    res.json({ success: true, message: 'Room created successfully' });
  } else {
    res.json({ success: false, message: 'Room already exists' });
  }
});

app.get('/api/rooms/:roomId/info', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (room) {
    res.json({
      id: room.id,
      participantCount: room.participants.size,
      createdAt: room.createdAt,
      isLocked: room.isLocked,
      participants: room.getParticipants().map(p => ({
        id: p.id,
        name: p.name,
        joinedAt: p.joinedAt
      }))
    });
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    activeRooms: rooms.size,
    activeUsers: users.size
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Google Meet Clone Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };