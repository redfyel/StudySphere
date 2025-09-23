const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./db/connect'); // Import MongoDB connection
require('dotenv').config(); // Load environment variables
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io and Express
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development. In production, specify your frontend URL.
    methods: ["GET", "POST"]
  }
});

app.use(cors()); // Enable CORS for Express routes if you add any REST endpoints

// Middleware for parsing request bodies
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// API Routes
app.use('/api/ai', aiRoutes); // All AI-related routes will be under /api/ai

// Basic route for testing
app.get('/', (req, res) => {
    res.send('StudySphere Backend is running!');
});
const PORT = process.env.PORT || 5000;

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
    const roomsCollection = db.collection('rooms');
    await roomsCollection.updateOne({ id: roomId }, { $set: updates });
    // console.log(`Room ${roomId} state saved to DB.`);
  } catch (error) {
    console.error(`Error saving room ${roomId} state to DB:`, error);
  }
};

// --- Socket.io Connection Handling ---
io.on('connection', (socket) => {
  const userId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  sockets.set(socket.id, { userId, emit: socket.emit.bind(socket) });
  console.log(`User ${userId} connected with socket ${socket.id}`);

  socket.emit('user-id-assigned', userId);

  // Handle request to get all rooms for the RoomList component
  socket.on('get-rooms', async () => {
    try {
      const roomsCollection = db.collection('rooms');
      const allRooms = await roomsCollection.find({}).toArray();
      // For the frontend, we also need to include a mock 'participants' count
      // In a real app, this would be derived from active participants or a stored count.
      const roomsWithParticipantCount = allRooms.map(room => ({
        id: room.id,
        name: room.name,
        topic: room.topic,
        participants: roomsParticipants.get(room.id)?.participants.size || 0 // Mock count
      }));
      socket.emit('rooms-list', roomsWithParticipantCount);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      socket.emit('error', 'Failed to fetch rooms.');
    }
  });

  // Handle request to create a new room
  socket.on('create-new-room', async ({ name, topic }) => {
    try {
      const roomsCollection = db.collection('rooms');
      const newRoomId = `room-${Date.now()}`;
      const newRoomData = {
        id: newRoomId,
        name,
        topic,
        notes: `Welcome to ${name} notes!`,
        timer: 0,
        targets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await roomsCollection.insertOne(newRoomData);

      // Also initialize in-memory participant tracking for the new room
      roomsParticipants.set(newRoomId, {
        participants: new Map(),
        joinRequests: [],
      });

      const roomDataForClient = {
        id: newRoomData.id,
        name: newRoomData.name,
        topic: newRoomData.topic,
        participants: 0, // New room starts with 0 participants
      };
      io.emit('room-created', roomDataForClient); // Emit to all clients to update room list
      console.log(`New room created: ${name} (${newRoomId})`);
    } catch (error) {
      console.error('Error creating new room:', error);
      socket.emit('error', 'Failed to create room.');
    }
  });


  socket.on('join-room', async ({ roomId, username }) => {
    const roomsCollection = db.collection('rooms');
    const roomData = await roomsCollection.findOne({ id: roomId });
    if (!roomData) {
      console.warn(`Room ${roomId} not found.`);
      socket.emit('room-not-found');
      return;
    }

    let roomState = roomsParticipants.get(roomId);
    if (!roomState) {
      // If room exists in DB but not in memory (e.g., server restart), initialize it
      roomState = { participants: new Map(), joinRequests: [] };
      roomsParticipants.set(roomId, roomState);
    }

    // Update socket info with username and roomId
    const currentSocketInfo = sockets.get(socket.id);
    if (currentSocketInfo) {
      currentSocketInfo.roomId = roomId;
      currentSocketInfo.username = username;
      currentSocketInfo.userId = userId;
    }

    // If room has participants, send a join request to the first participant (moderator)
    if (roomState.participants.size > 0) {
      const moderatorUserId = roomState.participants.keys().next().value;
      const moderatorSocketId = roomState.participants.get(moderatorUserId).socketId;
      const moderatorSocketInfo = sockets.get(moderatorSocketId);

      if (moderatorSocketInfo) {
        const request = { userId, username };
        roomState.joinRequests.push(request);
        moderatorSocketInfo.emit('new-join-request', request);
        console.log(`Join request from ${username} (${userId}) sent to moderator in room ${roomId}`);
        return; // Requester waits for approval
      }
    }

    // If no moderator or auto-approved (e.g., first user in room)
    addParticipantToRoom(socket.id, userId, username, roomId); // Removed roomData argument
  });

  socket.on('join-request-response', async ({ roomId, userId: requesterId, action }) => {
    const roomState = roomsParticipants.get(roomId);
    if (!roomState) return;

    roomState.joinRequests = roomState.joinRequests.filter(req => req.userId !== requesterId);
    const requesterSocketInfo = Array.from(sockets.values()).find(s => s.userId === requesterId);

    if (action === 'approve' && requesterSocketInfo) {
      // addParticipantToRoom will now fetch roomData itself
      addParticipantToRoom(requesterSocketInfo.id, requesterId, requesterSocketInfo.username, roomId); // Removed roomData argument
      requesterSocketInfo.emit('join-approved', roomId);
    } else if (requesterSocketInfo) {
      requesterSocketInfo.emit('join-rejected', roomId);
    }
    // Notify moderator about updated requests
    socket.emit('update-join-requests', roomState.joinRequests);
  });

  socket.on('signal', ({ targetUserId, signal }) => {
    const targetParticipantSocketInfo = Array.from(sockets.values()).find(s => s.userId === targetUserId);
    if (targetParticipantSocketInfo) {
      targetParticipantSocketInfo.emit('signal', { userId: userId, signal });
    }
  });

  socket.on('notes-update', async ({ roomId, notes }) => {
    const roomState = roomsParticipants.get(roomId);
    if (roomState) {
      await saveRoomState(roomId, { notes, updatedAt: new Date() });
      roomState.participants.forEach((p, pUserId) => {
        if (pUserId !== userId) {
          sockets.get(p.socketId)?.emit('notes-update', notes); // Added optional chaining
        }
      });
    }
  });

  socket.on('timer-update', async ({ roomId, timer }) => {
    const roomState = roomsParticipants.get(roomId);
    if (roomState) {
      await saveRoomState(roomId, { timer, updatedAt: new Date() });
      roomState.participants.forEach((p, pUserId) => {
        if (pUserId !== userId) {
          sockets.get(p.socketId)?.emit('timer-update', timer); // Added optional chaining
        }
      });
    }
  });

  socket.on('targets-update', async ({ roomId, targets }) => {
    const roomState = roomsParticipants.get(roomId);
    if (roomState) {
      await saveRoomState(roomId, { targets, updatedAt: new Date() });
      roomState.participants.forEach((p, pUserId) => {
        if (pUserId !== userId) {
          sockets.get(p.socketId)?.emit('targets-update', targets); // Added optional chaining
        }
      });
    }
  });

  socket.on('disconnect', () => {
    const { roomId: disconnectedRoomId, userId: disconnectedUserId } = sockets.get(socket.id) || {};
    if (disconnectedRoomId && disconnectedUserId) {
      removeParticipantFromRoom(socket.id, disconnectedUserId, disconnectedRoomId);
    }
    sockets.delete(socket.id);
    console.log(`Socket ${socket.id} disconnected.`);
  });
});

// --- Helper Functions for Room/Participant Management ---
async function addParticipantToRoom(socketId, userId, username, roomId) { // Removed roomDataFromDB parameter
  const roomsCollection = db.collection('rooms');
  const roomData = await roomsCollection.findOne({ id: roomId }); // Fetch roomData here

  if (!roomData) {
    console.error(`Error: Room ${roomId} not found in DB when attempting to add participant ${username} (${userId}).`);
    // Optionally, emit an error back to the client or handle this case more gracefully
    sockets.get(socketId)?.emit('room-not-found'); // Notify the joining user
    return;
  }

  let roomState = roomsParticipants.get(roomId);
  if (!roomState) {
    roomState = { participants: new Map(), joinRequests: [] };
    roomsParticipants.set(roomId, roomState);
  }

  // Notify existing participants about the new user
  roomState.participants.forEach((p, pUserId) => {
    if (pUserId !== userId) {
      sockets.get(p.socketId)?.emit('user-connected', { userId, username }); // Added optional chaining
      // Also send existing participant's ID and username to the new user
      sockets.get(socketId)?.emit('user-connected', { userId: pUserId, username: p.username }); // Added optional chaining
    }
  });

  roomState.participants.set(userId, { socketId, username });
  const currentSocketInfo = sockets.get(socketId);
  if (currentSocketInfo) {
    currentSocketInfo.roomId = roomId;
    currentSocketInfo.userId = userId;
    currentSocketInfo.username = username;
  }

  // Send initial room state to the new participant (fetched from DB)
  sockets.get(socketId)?.emit('room-state', { // Added optional chaining
    notes: roomData.notes,
    timer: roomData.timer,
    targets: roomData.targets,
    participants: Array.from(roomState.participants.values()).map(p => ({ id: p.userId, name: p.username })),
    joinRequests: roomState.joinRequests,
    localUserId: userId, // Send local user ID for client to identify itself
  });

  console.log(`User ${username} (${userId}) joined room ${roomId}. Total participants: ${roomState.participants.size}`);
  // Update participant count for all clients on the room list
  io.emit('room-updated-participant-count', { roomId, count: roomState.participants.size });
}

function removeParticipantFromRoom(socketId, userId, roomId) {
  const roomState = roomsParticipants.get(roomId);
  if (!roomState) return;

  roomState.participants.delete(userId);

  // Notify remaining participants about the disconnection
  roomState.participants.forEach((p) => {
    sockets.get(p.socketId)?.emit('user-disconnected', userId); // Added optional chaining
  });
  console.log(`User ${userId} left room ${roomId}. Total participants: ${roomState.participants.size}`);
  // Update participant count for all clients on the room list
  io.emit('room-updated-participant-count', { roomId, count: roomState.participants.size });
}

// --- Start Server ---
initializeRooms().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}...`);
    console.log('--- IMPORTANT ---');
    console.log('This server uses MongoDB for persistent room data.');
    console.log('Ensure your MongoDB instance is running and accessible at the configured MONGO_URI.');
    console.log('You would also need publicly accessible STUN/TURN servers for reliable WebRTC connections across different networks.');
    console.log('-----------------');
  });
}).catch(err => {
  console.error('Failed to initialize server due to DB error:', err);
  process.exit(1);
});
