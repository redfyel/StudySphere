const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();
require('dotenv').config(); // Load environment variables
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

app.use(cors()); // Enable CORS for Express routes if you add any REST endpoints


// --- Server State (In-memory, for transient participant data) ---
const roomsParticipants = new Map(); // roomId -> { participants: Map<userId, { socketId, username }>, joinRequests }
const sockets = new Map(); // socketId -> { userId, roomId, username }

let db; // MongoDB database instance

// Initialize rooms from DB and populate if empty
const initializeRooms = async () => {
  db = await connectDB(); // Connect to MongoDB and get the db instance
  const roomsCollection = db.collection('rooms');

  const count = await roomsCollection.countDocuments();
  if (count === 0) {
    console.log('No rooms found in DB, seeding initial data...');
    const initialRooms = [
      { id: 'room-1', name: 'Math Study Group', topic: 'Algebra', notes: 'Welcome to Math Study Group notes!', timer: 0, targets: ['Review Algebra', 'Solve practice problems'] },
      { id: 'room-2', name: 'Science Lab', topic: 'Physics', notes: 'Science Lab notes here.', timer: 0, targets: ['Experiment setup', 'Data analysis'] },
      { id: 'room-3', name: 'History Buffs', topic: 'World History', notes: 'History Buffs notes.', timer: 0, targets: ['Read Chapter 5', 'Discuss historical events'] },
    ];
    await roomsCollection.insertMany(initialRooms);
    console.log('Initial rooms seeded.');
  } else {
    console.log(`${count} rooms found in DB.`);
  }

  // Load all rooms from DB into our in-memory map for quick access to participant data
  const allRooms = await roomsCollection.find({}).toArray();
  allRooms.forEach(room => {
    roomsParticipants.set(room.id, {
      participants: new Map(),
      joinRequests: [],
    });
  });
  console.log("Server initialized with rooms from DB:", allRooms.map(r => ({id: r.id, name: r.name})));
};

// Save room state to MongoDB
const saveRoomState = async (roomId, updates) => {
  try {
    const result = await db.collection('rooms').updateOne(
      { roomId },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating room in DB:', error);
    return false;
  }
}

async function addParticipantToDB(roomId, participantData) {
  try {
    const result = await db.collection('rooms').updateOne(
      { roomId },
      { 
        $push: { participants: participantData },
        $set: { updatedAt: new Date() },
        $inc: { currentParticipants: 1 }
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error adding participant to DB:', error);
    return false;
  }
}

async function removeParticipantFromDB(roomId, userId) {
  try {
    const result = await db.collection('rooms').updateOne(
      { roomId },
      { 
        $pull: { participants: { userId } },
        $set: { updatedAt: new Date() },
        $inc: { currentParticipants: -1 }
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error removing participant from DB:', error);
    return false;
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Generate unique user ID and store user
  const userId = uuidv4();
  const user = new User(userId, socket.id);
  activeUsers.set(userId, user);
  
  // Send user ID to client
  socket.emit('user-id-assigned', userId);

  // Handle joining a room
  socket.on('join-room', async ({ roomId, username }) => {
    try {
      console.log(`Join room request: ${roomId} from user: ${username} (${userId})`);
      
      // Get room from database
      const roomFromDB = await getRoomFromDB(roomId);
      if (!roomFromDB) {
        console.log(`Room not found: ${roomId}`);
        socket.emit('room-not-found');
        return;
      }

      const session = getRoomSession(roomId, roomFromDB.roomType);
      user.username = username;
      user.roomId = roomId;

      // Check if user is admin (room creator)
      const isAdmin = roomFromDB.createdBy === userId || roomFromDB.adminId === userId;
      const isCreator = roomFromDB.createdBy === userId;

      console.log(`Room type: ${roomFromDB.roomType}, Requires approval: ${roomFromDB.requiresApproval}, Is admin: ${isAdmin}`);

      // Handle room joining logic based on room type
      if (roomFromDB.roomType === 'public' || isAdmin) {
        // Public room or admin - join immediately
        console.log(`Allowing immediate join - Public room or admin`);
        await joinRoomImmediately();
      } else if (roomFromDB.roomType === 'private' && !isAdmin) {
        // Private room and not admin - check if approval is needed
        if (session.activeParticipants.size > 0) {
          // Room has active participants, need approval
          console.log(`Private room with active participants - requesting approval`);
          session.addJoinRequest(userId, username);
          
          // Notify existing participants about join request (admins only)
          session.activeParticipants.forEach((participant, participantId) => {
            if (participant.isAdmin) {
              const adminUser = activeUsers.get(participantId);
              if (adminUser) {
                io.to(adminUser.socketId).emit('new-join-request', {
                  userId,
                  username,
                  requestedAt: new Date()
                });
              }
            }
          });
          
          socket.emit('join-request-sent', roomId);
          return;
        } else {
          // Private room but no active participants - join as first participant
          console.log(`Private room with no active participants - allowing join`);
          await joinRoomImmediately();
        }
      }

      async function joinRoomImmediately() {
        // Add user to active session
        session.addParticipant(userId, {
          userId,
          id: userId,
          name: username,
          socketId: socket.id,
          isMuted: user.isMuted,
          isCameraOff: user.isCameraOff,
          isScreenSharing: user.isScreenSharing,
          isAdmin,
          isCreator
        });

        // Add participant to database
        await addParticipantToDB(roomId, {
          userId,
          username,
          joinedAt: new Date(),
          isActive: true
        });

        // Join socket room for easy broadcasting
        socket.join(roomId);

        // Send current room state to the new user
        socket.emit('room-state', {
          roomId,
          roomInfo: roomFromDB,
          notes: session.notes,
          timer: session.timer,
          targets: session.targets,
          participants: session.getActiveParticipants(),
          joinRequests: isAdmin ? session.joinRequests : [], // Only send join requests to admins
          localUserId: userId,
          isLocked: roomFromDB.requiresApproval,
          roomType: roomFromDB.roomType,
          creatorId: roomFromDB.createdBy,
          isAdmin,
          isCreator
        });

        // Notify other participants about the new user
        broadcastToRoom(roomId, 'user-connected', {
          userId,
          username,
          isMuted: user.isMuted,
          isCameraOff: user.isCameraOff,
          isScreenSharing: user.isScreenSharing,
          isAdmin,
          isCreator
        }, socket.id);

        console.log(`User ${username} (${userId}) joined room ${roomId} successfully`);
      }

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle join request responses (admin only)
  socket.on('join-request-response', async ({ roomId, userId: requesterId, action }) => {
    try {
      console.log(`Join request response: ${action} for user ${requesterId} in room ${roomId}`);
      
      const roomFromDB = await getRoomFromDB(roomId);
      const isAdmin = roomFromDB && (roomFromDB.createdBy === user.id || roomFromDB.adminId === user.id);
      
      if (!isAdmin) {
        socket.emit('error', { message: 'Only admins can approve/reject join requests' });
        return;
      }

      const session = roomSessions.get(roomId);
      if (!session || user.roomId !== roomId) {
        console.log(`Session not found or user not in room`);
        return;
      }

      const requesterUser = activeUsers.get(requesterId);
      if (!requesterUser) {
        console.log(`Requester user not found: ${requesterId}`);
        return;
      }

      // Remove the join request
      session.removeJoinRequest(requesterId);

      if (action === 'approve') {
        console.log(`Approving join request for ${requesterId}`);
        
        // Add user to session
        session.addParticipant(requesterId, {
          userId: requesterId,
          id: requesterId,
          name: requesterUser.username,
          socketId: requesterUser.socketId,
          isMuted: requesterUser.isMuted,
          isCameraOff: requesterUser.isCameraOff,
          isScreenSharing: requesterUser.isScreenSharing,
          isAdmin: false,
          isCreator: false
        });

        // Add to database
        await addParticipantToDB(roomId, {
          userId: requesterId,
          username: requesterUser.username,
          joinedAt: new Date(),
          isActive: true
        });

        // Update requester's room ID
        requesterUser.roomId = roomId;

        // Join socket room
        const requesterSocket = io.sockets.sockets.get(requesterUser.socketId);
        if (requesterSocket) {
          requesterSocket.join(roomId);
        }

        // Notify approved user
        io.to(requesterUser.socketId).emit('join-approved', roomId);
        
        // Send room state to approved user
        io.to(requesterUser.socketId).emit('room-state', {
          roomId,
          roomInfo: roomFromDB,
          notes: session.notes,
          timer: session.timer,
          targets: session.targets,
          participants: session.getActiveParticipants(),
          joinRequests: [], // Regular users don't see join requests
          localUserId: requesterId,
          isLocked: roomFromDB.requiresApproval,
          roomType: roomFromDB.roomType,
          creatorId: roomFromDB.createdBy,
          isAdmin: false,
          isCreator: false
        });

        // Notify all participants about new user
        broadcastToRoom(roomId, 'user-connected', {
          userId: requesterId,
          username: requesterUser.username,
          isMuted: requesterUser.isMuted,
          isCameraOff: requesterUser.isCameraOff,
          isScreenSharing: requesterUser.isScreenSharing,
          isAdmin: false,
          isCreator: false
        });
        
        console.log(`User ${requesterId} approved and joined room ${roomId}`);
      } else {
        console.log(`Rejecting join request for ${requesterId}`);
        // Notify rejected user
        io.to(requesterUser.socketId).emit('join-rejected', roomId);
      }

      // Update join requests for all admin participants
      session.activeParticipants.forEach((participant, participantId) => {
        if (participant.isAdmin) {
          const adminUser = activeUsers.get(participantId);
          if (adminUser) {
            io.to(adminUser.socketId).emit('update-join-requests', session.joinRequests);
          }
        }
      });
      
    } catch (error) {
      console.error('Error handling join request response:', error);
    }
  });

  // Handle WebRTC signaling
  socket.on('signal', ({ targetUserId, signal }) => {
    try {
      const targetUser = activeUsers.get(targetUserId);
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
      const targetUser = activeUsers.get(targetUserId);
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

        const session = roomSessions.get(user.roomId);
        if (session && session.activeParticipants.has(user.id)) {
          // Update participant info in session
          const participant = session.activeParticipants.get(user.id);
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

  // Handle notes updates (admin only)
  socket.on('notes-update', async ({ roomId, notes }) => {
    try {
      const roomFromDB = await getRoomFromDB(roomId);
      const isAdmin = roomFromDB && (roomFromDB.createdBy === user.id || roomFromDB.adminId === user.id);
      
      if (!isAdmin) {
        socket.emit('error', { message: 'Only admins can update notes' });
        return;
      }

      const session = roomSessions.get(roomId);
      if (session && user.roomId === roomId) {
        session.notes = notes;
        broadcastToRoom(roomId, 'notes-update', notes, socket.id);
      }
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  });

  // Handle timer updates (admin only)
  socket.on('timer-update', async ({ roomId, timer }) => {
    try {
      const roomFromDB = await getRoomFromDB(roomId);
      const isAdmin = roomFromDB && (roomFromDB.createdBy === user.id || roomFromDB.adminId === user.id);
      
      if (!isAdmin) {
        socket.emit('error', { message: 'Only admins can update timer' });
        return;
      }

      const session = roomSessions.get(roomId);
      if (session && user.roomId === roomId) {
        session.timer = timer;
        broadcastToRoom(roomId, 'timer-update', timer, socket.id);
      }
    } catch (error) {
      console.error('Error updating timer:', error);
    }
  });

  // Handle targets updates (admin only)
  socket.on('targets-update', async ({ roomId, targets }) => {
    try {
      const roomFromDB = await getRoomFromDB(roomId);
      const isAdmin = roomFromDB && (roomFromDB.createdBy === user.id || roomFromDB.adminId === user.id);
      
      if (!isAdmin) {
        socket.emit('error', { message: 'Only admins can update targets' });
        return;
      }

      const session = roomSessions.get(roomId);
      if (session && user.roomId === roomId) {
        session.targets = targets;
        broadcastToRoom(roomId, 'targets-update', targets, socket.id);
      }
    } catch (error) {
      console.error('Error updating targets:', error);
    }
  });

  // Handle kick participant (admin only)
  socket.on('kick-participant', async ({ roomId, participantId }) => {
    try {
      const roomFromDB = await getRoomFromDB(roomId);
      const isAdmin = roomFromDB && (roomFromDB.createdBy === user.id || roomFromDB.adminId === user.id);
      
      if (!isAdmin) {
        socket.emit('error', { message: 'Only admins can kick participants' });
        return;
      }

      const session = roomSessions.get(roomId);
      if (session) {
        session.removeParticipant(participantId);
        await removeParticipantFromDB(roomId, participantId);

        const kickedUser = activeUsers.get(participantId);
        if (kickedUser) {
          io.to(kickedUser.socketId).emit('kicked-from-room', roomId);
          kickedUser.roomId = null;
        }

        broadcastToRoom(roomId, 'user-disconnected', participantId);
      }
    } catch (error) {
      console.error('Error kicking participant:', error);
    }
  });

  // Handle audio toggle (for VideoCall compatibility)
  socket.on('toggle-audio', ({ roomId, isMuted }) => {
    try {
      if (user.roomId === roomId) {
        user.isMuted = isMuted;
        
        const session = roomSessions.get(roomId);
        if (session && session.activeParticipants.has(user.id)) {
          const participant = session.activeParticipants.get(user.id);
          participant.isMuted = isMuted;
          
          broadcastToRoom(roomId, 'user-audio-toggle', {
            userId: user.id,
            isMuted
          }, socket.id);
        }
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  });

  // Handle video toggle (for VideoCall compatibility)
  socket.on('toggle-video', ({ roomId, isCameraOff }) => {
    try {
      if (user.roomId === roomId) {
        user.isCameraOff = isCameraOff;
        
        const session = roomSessions.get(roomId);
        if (session && session.activeParticipants.has(user.id)) {
          const participant = session.activeParticipants.get(user.id);
          participant.isCameraOff = isCameraOff;
          
          broadcastToRoom(roomId, 'user-video-toggle', {
            userId: user.id,
            isCameraOff
          }, socket.id);
        }
      }
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  });

  // Handle screen share start (for VideoCall compatibility)
  socket.on('screen-share-start', ({ roomId }) => {
    try {
      if (user.roomId === roomId) {
        user.isScreenSharing = true;
        
        const session = roomSessions.get(roomId);
        if (session && session.activeParticipants.has(user.id)) {
          const participant = session.activeParticipants.get(user.id);
          participant.isScreenSharing = true;
          
          broadcastToRoom(roomId, 'user-screen-share-start', {
            userId: user.id,
            username: user.username
          }, socket.id);
        }
      }
    } catch (error) {
      console.error('Error handling screen share start:', error);
    }
  });

  // Handle screen share stop (for VideoCall compatibility)
  socket.on('screen-share-stop', ({ roomId }) => {
    try {
      if (user.roomId === roomId) {
        user.isScreenSharing = false;
        
        const session = roomSessions.get(roomId);
        if (session && session.activeParticipants.has(user.id)) {
          const participant = session.activeParticipants.get(user.id);
          participant.isScreenSharing = false;
          
          broadcastToRoom(roomId, 'user-screen-share-stop', {
            userId: user.id,
            username: user.username
          }, socket.id);
        }
      }
    } catch (error) {
      console.error('Error handling screen share stop:', error);
    }
  });

  // Handle room lock toggle (for VideoCall compatibility - only for private rooms)
  socket.on('toggle-room-lock', async ({ roomId }) => {
    try {
      const roomFromDB = await getRoomFromDB(roomId);
      const isCreator = roomFromDB && roomFromDB.createdBy === user.id;
      
      if (!isCreator) {
        socket.emit('error', { message: 'Only room creators can toggle room lock' });
        return;
      }

      // Only allow toggling lock for private rooms
      if (roomFromDB.roomType !== 'private') {
        socket.emit('error', { message: 'Room lock can only be toggled for private rooms' });
        return;
      }

      const newLockStatus = !roomFromDB.requiresApproval;
      await updateRoomInDB(roomId, { requiresApproval: newLockStatus });
      
      broadcastToRoom(roomId, 'room-lock-status', newLockStatus);
      socket.emit('room-lock-status', newLockStatus);
    } catch (error) {
      console.error('Error toggling room lock:', error);
    }
  });

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
        socket.emit('chat-message', chatMessage);
      }
    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      console.log(`User disconnected: ${socket.id}`);
      
      if (user.roomId) {
        const session = roomSessions.get(user.roomId);
        if (session) {
          session.removeParticipant(user.id);
          await removeParticipantFromDB(user.roomId, user.id);
          
          // Notify other participants
          broadcastToRoom(user.roomId, 'user-disconnected', user.id);
          
          // Clean up empty sessions
          if (session.activeParticipants.size === 0) {
            roomSessions.delete(user.roomId);
            console.log(`Room session ${user.roomId} cleaned up (empty)`);
          }
        }
      }
      
      // Remove user from active users
      activeUsers.delete(user.id);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// REST API endpoints

// Get all active rooms with filtering options
app.get('/api/rooms', async (req, res) => {
  try {
    const { type } = req.query; // Filter by room type: 'public', 'private', or all
    
    let filter = { isActive: true };
    if (type && ['public', 'private'].includes(type)) {
      filter.roomType = type;
    }
    
    const rooms = await db.collection('rooms')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Add current participant count from active sessions
    const roomsWithParticipants = rooms.map(room => ({
      ...room,
      currentParticipants: roomSessions.get(room.roomId)?.activeParticipants.size || 0
    }));
    
    res.json(roomsWithParticipants);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Create a new room with enhanced validation
app.post('/api/rooms', async (req, res) => {
  try {
    const { name, topic, description, roomType, maxParticipants, createdBy } = req.body;
    
    if (!name || !createdBy) {
      return res.status(400).json({ error: 'Room name and creator ID are required' });
    }

    if (!['public', 'private'].includes(roomType)) {
      return res.status(400).json({ error: 'Room type must be either "public" or "private"' });
    }

    const roomData = {
      roomId: uuidv4(),
      name,
      topic: topic || '',
      description: description || '',
      roomType, // 'public' or 'private'
      requiresApproval: roomType === 'private', // Auto-set based on room type
      maxParticipants: maxParticipants || 50,
      createdBy,
      adminId: createdBy
    };

    const room = await createRoomInDB(roomData);
    
    console.log(`Created new ${roomType} room: ${room.roomId} by user: ${createdBy}`);
    
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room info
app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await getRoomFromDB(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const session = roomSessions.get(roomId);
    res.json({
      ...room,
      currentParticipants: session?.activeParticipants.size || 0,
      activeParticipants: session?.getActiveParticipants() || []
    });
  } catch (error) {
    console.error('Error fetching room info:', error);
    res.status(500).json({ error: 'Failed to fetch room info' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`Backend URL: http://localhost:${PORT}`);
  
  // Check for required environment variables
  const requiredEnvVars = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Missing Spotify environment variables:', missingVars.join(', '));
    console.warn('Spotify features will not work. Please check your .env file');
  } else {
    console.log('✅ All Spotify environment variables are set');
  }
});