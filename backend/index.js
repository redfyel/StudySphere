// --- 1. IMPORTS & SETUP ---
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

// Load environment variables immediately
dotenv.config();

// --- 2. DATABASE CONNECTION FUNCTION ---
let db; // Holds our native MongoDB driver database connection instance

const connectDB = async () => {
    // If already connected, return the existing connection.
    if (db) {
        return db;
    }

    try {
        // 1. Use Mongoose to connect
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected via Mongoose to host: ${conn.connection.host}`);

        // 2. Extract the native 'db' object for direct use in the socket logic
        db = conn.connection.db;
        return db;

    } catch (err) {
        console.error('❌ Hybrid DB Connection Error:', err.message);
        process.exit(1);
    }
};

// --- 3. REQUIRE ALL ROUTE FILES ---
const spotifyRoutes = require('./routes/spotify');
const aiRoutes = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");
const flashcardRoutes = require("./routes/flashcardRoutes");
const wellnessRoutes = require("./routes/wellnessRoutes");
const mindmapRoutes = require("./routes/mindmapRoutes");
const resourceRoutes = require("./routes/resourceRoutes");

// --- 4. CREATE THE ASYNCHRONOUS STARTUP FUNCTION ---
const startServer = async () => {
    try {
        // Connect to the database first.
        await connectDB();

        // Initialize Express app and HTTP server
        const app = express();
        const server = http.createServer(app);

        // Configure CORS for Socket.IO
        const io = socketIo(server, {
            cors: {
                origin: ["http://localhost:5173", "http://localhost:3000","https://study-sphere-git-final-redfyels-projects.vercel.app"],
                methods: ["GET", "POST", "PUT", "DELETE"],
                credentials: true
            }
        });

        // --- MIDDLEWARE SETUP ---
        app.use(cors({
            origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:5173', 'https://the-study-sphere.vercel.app',"https://study-sphere-git-final-redfyels-projects.vercel.app"],
            credentials: true
        }));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        // Session middleware
        app.use(session({
            secret: process.env.SESSION_SECRET || 'your-session-secret-here',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        }));

        // --- MOUNT API ROUTES ---
        app.use('/api/spotify', spotifyRoutes);
        app.use('/api/ai', aiRoutes);
        app.use('/api/auth', authRoutes);
        app.use('/api/flashcards', flashcardRoutes);
        app.use('/api/wellness', wellnessRoutes);
        app.use('/api/mindmaps', mindmapRoutes)
        app.use('/api/resources', resourceRoutes);

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({ status: 'OK', timestamp: new Date().toISOString() });
        });

        // --- SEED DATABASE ---
        const roomsCollection = db.collection("rooms");
        const count = await roomsCollection.countDocuments();
        if (count === 0) {
            console.log("No rooms found in DB, seeding initial data...");
            const initialRooms = [
                {
                    roomId: "room-1",
                    name: "Math Study Group",
                    topic: "Algebra",
                    notes: "Welcome to Math Study Group notes!",
                    timer: 0,
                    targets: ["Review Algebra", "Solve practice problems"],
                    roomType: 'public',
                    isActive: true,
                    createdAt: new Date(),
                    createdBy: 'system'
                },
                {
                    roomId: "room-2",
                    name: "Science Lab",
                    topic: "Physics",
                    notes: "Science Lab notes here.",
                    timer: 0,
                    targets: ["Experiment setup", "Data analysis"],
                    roomType: 'public',
                    isActive: true,
                    createdAt: new Date(),
                    createdBy: 'system'
                },
                {
                    roomId: "room-3",
                    name: "History Buffs",
                    topic: "World History",
                    notes: "History Buffs notes.",
                    timer: 0,
                    targets: ["Read Chapter 5", "Discuss historical events"],
                    roomType: 'public',
                    isActive: true,
                    createdAt: new Date(),
                    createdBy: 'system'
                },
            ];
            await roomsCollection.insertMany(initialRooms);
            console.log("Initial rooms seeded.");
        } else {
            console.log(`${count} rooms found in DB.`);
        }

        // --- IN-MEMORY STORAGE ---
        const activeUsers = new Map();
        const roomSessions = new Map();
        const userSessions = new Map();

        // --- DATA STRUCTURES ---
        
        class RoomSession {
            constructor(roomId, roomType = 'private') {
                this.roomId = roomId;
                this.roomType = roomType;
                this.activeParticipants = new Map();
                this.notes = '';
                this.timer = 0;
                this.targets = [];
                this.joinRequests = [];
                this.createdAt = new Date();
            }

            addParticipant(userId, userInfo) {
                this.activeParticipants.set(userId, {
                    ...userInfo,
                    joinedAt: new Date()
                });
            }

            removeParticipant(userId) {
                this.activeParticipants.delete(userId);
            }

            getActiveParticipants() {
                return Array.from(this.activeParticipants.entries()).map(([id, info]) => ({
                    id,
                    ...info
                }));
            }

            addJoinRequest(userId, username, email) {
                if (this.roomType === 'private') {
                    const existingRequest = this.joinRequests.find(req => req.userId === userId);
                    if (!existingRequest) {
                        this.joinRequests.push({
                            userId,
                            username,
                            email,
                            requestedAt: new Date()
                        });
                    }
                }
            }

            removeJoinRequest(userId) {
                this.joinRequests = this.joinRequests.filter(req => req.userId !== userId);
            }
        }

        class User {
            constructor(id, socketId, username = '', email = '', sessionToken = '') {
                this.id = id;
                this.socketId = socketId;
                this.username = username;
                this.email = email;
                this.sessionToken = sessionToken;
                this.roomId = null;
                this.isConnected = true;
                this.isMuted = false;
                this.isCameraOff = false;
                this.isScreenSharing = false;
                this.lastActive = new Date();
            }
        }

        // --- HELPER FUNCTIONS ---
        
        function getUserFromSocket(socket) {
            for (const [userId, user] of activeUsers.entries()) {
                if (user.socketId === socket.id) {
                    return user;
                }
            }
            return null;
        }

        function getRoomSession(roomId, roomType = 'private') {
            if (!roomSessions.has(roomId)) {
                roomSessions.set(roomId, new RoomSession(roomId, roomType));
            }
            return roomSessions.get(roomId);
        }

        function broadcastToRoom(roomId, event, data, excludeSocketId = null) {
            const session = roomSessions.get(roomId);
            if (session) {
                session.activeParticipants.forEach((participant, userId) => {
                    const user = activeUsers.get(userId);
                    if (user && user.socketId && user.socketId !== excludeSocketId) {
                        io.to(user.socketId).emit(event, data);
                    }
                });
            }
        }

        // --- DATABASE HELPER FUNCTIONS ---
        
        async function createRoomInDB(roomData) {
            try {
                const room = {
                    ...roomData,
                    roomId: roomData.roomId || uuidv4(),
                    participants: [],
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    roomType: roomData.roomType || 'private',
                    requiresApproval: roomData.roomType === 'private',
                    currentParticipants: 0,
                    maxParticipants: roomData.maxParticipants || 50
                };
                
                const result = await db.collection('rooms').insertOne(room);
                return { ...room, _id: result.insertedId };
            } catch (error) {
                console.error('Error creating room in DB:', error);
                throw error;
            }
        }

        async function getRoomFromDB(roomId) {
            try {
                return await db.collection('rooms').findOne({ roomId });
            } catch (error) {
                console.error('Error getting room from DB:', error);
                return null;
            }
        }

        async function updateRoomInDB(roomId, updateData) {
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

        async function createOrUpdateUserInDB(userData) {
            try {
                const { name, email, sessionToken } = userData;
                
                let user = await db.collection('users').findOne({ email });
                
                if (user) {
                    const updateResult = await db.collection('users').updateOne(
                        { email },
                        { 
                            $set: { 
                                name,
                                sessionToken,
                                lastActive: new Date(),
                                isActive: true
                            } 
                        }
                    );
                    
                    if (updateResult.modifiedCount > 0) {
                        user = await db.collection('users').findOne({ email });
                    }
                    
                    console.log(`[DB] Existing user updated: ${name} (${user._id})`);
                    return user;
                } else {
                    const newUser = {
                        name,
                        email,
                        sessionToken,
                        createdAt: new Date(),
                        lastActive: new Date(),
                        isActive: true,
                        totalRoomsCreated: 0,
                        totalRoomsJoined: 0
                    };
                    
                    const result = await db.collection('users').insertOne(newUser);
                    const createdUser = { ...newUser, _id: result.insertedId };
                    
                    console.log(`[DB] New user created: ${name} (${result.insertedId})`);
                    return createdUser;
                }
            } catch (error) {
                console.error('Error creating/updating user in DB:', error);
                throw error;
            }
        }

        async function getUserBySessionToken(sessionToken) {
            try {
                return await db.collection('users').findOne({ sessionToken });
            } catch (error) {
                console.error('Error getting user by session token:', error);
                return null;
            }
        }

        async function updateUserActivity(userId) {
            try {
                await db.collection('users').updateOne(
                    { _id: new ObjectId(userId) },
                    { 
                        $set: { 
                            lastActive: new Date(),
                            isActive: true
                        } 
                    }
                );
            } catch (error) {
                console.error('Error updating user activity:', error);
            }
        }

        // --- SOCKET.IO CONNECTION HANDLING ---
        
        io.on('connection', (socket) => {
            console.log(`User connected: ${socket.id}`);

            // ------------------------------------------------------------------
            // ✅ SOCKET HANDLERS
            // ------------------------------------------------------------------
            
            socket.on('chat-message', async ({ roomId, message }) => {
                try {
                    const user = getUserFromSocket(socket);
                    if (!user || user.roomId !== roomId) {
                        socket.emit('error', { message: 'You must be in the room to send messages' });
                        return;
                    }

                    const chatMessage = {
                        messageId: uuidv4(),
                        participantId: user.id,
                        username: user.username,
                        email: user.email,
                        message: message.trim(),
                        timestamp: new Date(),
                        type: 'text'
                    };

                    // Save to database
                    await db.collection('rooms').updateOne(
                        { roomId },
                        { 
                            $push: { chatHistory: chatMessage },
                            $set: { lastActivity: new Date(), updatedAt: new Date() }
                        }
                    );

                    // Broadcast to all participants
                    broadcastToRoom(roomId, 'chat-message', chatMessage);
                    
                    console.log(`Real-time chat message in room ${roomId} by ${user.username}`);

                } catch (error) {
                    console.error('Error handling real-time chat message:', error);
                    socket.emit('error', { message: 'Failed to send message' });
                }
            });

            // Handle chat message deletion via socket
            socket.on('delete-chat-message', async ({ roomId, messageId }) => {
                try {
                    const user = getUserFromSocket(socket);
                    if (!user) {
                        socket.emit('error', { message: 'User session not found' });
                        return;
                    }

                    const room = await getRoomFromDB(roomId);
                    if (!room) {
                        socket.emit('error', { message: 'Room not found' });
                        return;
                    }

                    const messageToDelete = room.chatHistory && room.chatHistory.find(
                        msg => msg.messageId === messageId
                    );

                    if (!messageToDelete) {
                        socket.emit('error', { message: 'Message not found' });
                        return;
                    }

                    const isMessageSender = messageToDelete.participantId === user.id;
                    const isRoomCreator = room.createdBy === user.id;

                    if (!isMessageSender && !isRoomCreator) {
                        socket.emit('error', { message: 'Permission denied' });
                        return;
                    }

                    // Delete from database
                    await db.collection('rooms').updateOne(
                        { roomId },
                        { 
                            $pull: { chatHistory: { messageId } },
                            $set: { updatedAt: new Date() }
                        }
                    );

                    // Broadcast deletion
                    broadcastToRoom(roomId, 'chat-message-deleted', {
                        messageId,
                        deletedBy: user.id,
                        deletedByUsername: user.username
                    });

                } catch (error) {
                    console.error('Error deleting chat message via socket:', error);
                    socket.emit('error', { message: 'Failed to delete message' });
                }
            });


            // Enhanced joining a room with session validation
            socket.on('join-room', async ({ roomId, sessionToken }) => {
                try {
                    if (!sessionToken) {
                        console.error(`[BACKEND] Join room request missing sessionToken from socket ${socket.id}`);
                        socket.emit('error', { message: 'Session token is required to join a room.' });
                        return;
                    }

                    const userFromDB = await getUserBySessionToken(sessionToken);
                    if (!userFromDB) {
                        console.error(`[BACKEND] Invalid session token provided: ${sessionToken}`);
                        socket.emit('authentication-required', { message: 'Please authenticate first.' });
                        return;
                    }

                    const { _id: userId, name: username, email } = userFromDB;
                    console.log(`[BACKEND] Join room request: ${roomId} from user: ${username} (userId: ${userId})`);
                    
                    const roomFromDB = await getRoomFromDB(roomId);
                    if (!roomFromDB) {
                        console.log(`[BACKEND] Room not found: ${roomId}`);
                        socket.emit('room-not-found');
                        return;
                    }

                    await updateUserActivity(userId);

                    let user = activeUsers.get(userId.toString());
                    if (!user) {
                        user = new User(userId.toString(), socket.id, username, email, sessionToken);
                        activeUsers.set(userId.toString(), user);
                    } else {
                        user.socketId = socket.id;
                        user.username = username;
                        user.email = email;
                        user.sessionToken = sessionToken;
                        user.isConnected = true;
                        user.lastActive = new Date();
                    }

                    const session = getRoomSession(roomId, roomFromDB.roomType);
                    const isCreator = roomFromDB.createdBy === userId.toString();
                    const isAdmin = isCreator;

                    console.log(`[BACKEND] Room type: ${roomFromDB.roomType}, Is creator/admin: ${isAdmin} for user ${username} (${userId})`);

                    if (roomFromDB.roomType === 'private') {
                        if (isCreator) {
                            console.log(`[BACKEND] Room creator (${username}) joining immediately`);
                            user.roomId = roomId;
                            await joinRoomImmediately();
                        } else {
                            const creatorInRoom = Array.from(session.activeParticipants.values()).some(p => p.isCreator);
                            
                            if (creatorInRoom) {
                                console.log(`[BACKEND] Private room with creator present - requesting approval for ${username}`);
                                session.addJoinRequest(userId.toString(), username, email);
                                
                                let creatorNotified = false;
                                session.activeParticipants.forEach((participant, participantId) => {
                                    if (participant.isCreator) {
                                        const creatorUser = activeUsers.get(participantId);
                                        if (creatorUser) {
                                            console.log(`[BACKEND] Notifying creator ${creatorUser.username} about join request from ${username}`);
                                            io.to(creatorUser.socketId).emit('new-join-request', {
                                                userId: userId.toString(),
                                                username,
                                                email,
                                                requestedAt: new Date()
                                            });
                                            creatorNotified = true;
                                        }
                                    }
                                });

                                if (!creatorNotified) {
                                    console.warn(`[BACKEND] No active creator found to send join request notification for room ${roomId}`);
                                }
                                
                                socket.emit('join-request-sent', {
                                    roomId,
                                    message: 'Your join request has been sent to the room creator. Please wait for approval.',
                                    shouldWait: true
                                });
                                return;
                            } else {
                                console.log(`[BACKEND] Private room creator not present. User ${username} cannot join.`);
                                socket.emit('private-room-empty', {
                                    roomId,
                                    message: 'This is a private room and the creator is not currently present. Please try again later.'
                                });
                                return;
                            }
                        }
                    } else if (roomFromDB.roomType === 'public') {
                        console.log(`[BACKEND] Public room - allowing immediate join for ${username}`);
                        user.roomId = roomId;
                        await joinRoomImmediately();
                    }

                    async function joinRoomImmediately() {
                        session.addParticipant(userId.toString(), {
                            userId: userId.toString(),
                            id: userId.toString(),
                            name: username,
                            email,
                            socketId: socket.id,
                            isMuted: user.isMuted,
                            isCameraOff: user.isCameraOff,
                            isScreenSharing: user.isScreenSharing,
                            isAdmin: isCreator,
                            isCreator,
                            canBeControlledByAdmin: !isCreator
                        });

                        await addParticipantToDB(roomId, {
                            userId: userId.toString(),
                            username,
                            email,
                            joinedAt: new Date(),
                            isActive: true,
                            isAdmin: isCreator
                        });

                        if (!isCreator) {
                            await db.collection('users').updateOne(
                                { _id: userId },
                                { $inc: { totalRoomsJoined: 1 } }
                            );
                        }

                        socket.join(roomId);

                        socket.emit('room-joined-successfully', {
                            roomId,
                            roomInfo: roomFromDB,
                            notes: session.notes,
                            timer: session.timer,
                            targets: session.targets,
                            participants: session.getActiveParticipants(),
                            joinRequests: isCreator ? session.joinRequests : [],
                            localUserId: userId.toString(),
                            isLocked: roomFromDB.requiresApproval,
                            roomType: roomFromDB.roomType,
                            creatorId: roomFromDB.createdBy,
                            isAdmin: isCreator,
                            isCreator,
                            canUseAdminControls: isCreator,
                            adminControlsAvailable: roomFromDB.roomType === 'private' && isCreator
                        });

                        broadcastToRoom(roomId, 'user-connected', {
                            userId: userId.toString(),
                            username,
                            email,
                            isMuted: user.isMuted,
                            isCameraOff: user.isCameraOff,
                            isScreenSharing: user.isScreenSharing,
                            isAdmin: isCreator,
                            isCreator,
                            canBeControlledByAdmin: !isCreator
                        }, socket.id);

                        console.log(`[BACKEND] User ${username} (${userId}) joined room ${roomId} successfully`);
                    }

                } catch (error) {
                    console.error('[BACKEND] Error joining room:', error);
                    socket.emit('error', { message: 'Failed to join room' });
                }
            });

            // Join request response handler
            socket.on('join-request-response', async ({ roomId, userId: requesterId, action }) => {
                try {
                    const user = getUserFromSocket(socket);
                    if (!user) {
                        socket.emit('error', { message: 'User not found in active session.' });
                        return;
                    }

                    const roomFromDB = await getRoomFromDB(roomId);
                    const isCreator = roomFromDB && roomFromDB.createdBy === user.id;
                    
                    if (!isCreator) {
                        socket.emit('error', { message: 'Only room creators can approve/reject join requests' });
                        return;
                    }

                    const session = roomSessions.get(roomId);
                    if (!session || user.roomId !== roomId) {
                        console.log(`[BACKEND] Session not found or user not in room for join-request-response`);
                        return;
                    }

                    const requesterUser = activeUsers.get(requesterId);
                    if (!requesterUser) {
                        console.log(`[BACKEND] Requester user not found: ${requesterId}`);
                        return;
                    }

                    session.removeJoinRequest(requesterId);

                    if (action === 'approve') {
                        console.log(`[BACKEND] Approving join request for ${requesterId}`);
                        
                        requesterUser.roomId = roomId;
                        
                        session.addParticipant(requesterId, {
                            userId: requesterId,
                            id: requesterId,
                            name: requesterUser.username,
                            email: requesterUser.email,
                            socketId: requesterUser.socketId,
                            isMuted: requesterUser.isMuted,
                            isCameraOff: requesterUser.isCameraOff,
                            isScreenSharing: requesterUser.isScreenSharing,
                            isAdmin: false,
                            isCreator: false,
                            canBeControlledByAdmin: true
                        });

                        await addParticipantToDB(roomId, {
                            userId: requesterId,
                            username: requesterUser.username,
                            email: requesterUser.email,
                            joinedAt: new Date(),
                            isActive: true,
                            isAdmin: false
                        });

                        await db.collection('users').updateOne(
                            { _id: new ObjectId(requesterId) },
                            { $inc: { totalRoomsJoined: 1 } }
                        );

                        const requesterSocket = io.sockets.sockets.get(requesterUser.socketId);
                        if (requesterSocket) {
                            requesterSocket.join(roomId);
                            console.log(`[BACKEND] Socket ${requesterUser.socketId} joined room ${roomId}`);
                        } else {
                            console.error(`[BACKEND] Could not find socket for user ${requesterId}`);
                        }

                        io.to(requesterUser.socketId).emit('join-approved', {
                            roomId,
                            roomInfo: roomFromDB,
                            notes: session.notes,
                            timer: session.timer,
                            targets: session.targets,
                            participants: session.getActiveParticipants(),
                            joinRequests: [],
                            localUserId: requesterId,
                            isLocked: roomFromDB.requiresApproval,
                            roomType: roomFromDB.roomType,
                            creatorId: roomFromDB.createdBy,
                            isAdmin: false,
                            isCreator: false,
                            canUseAdminControls: false,
                            adminControlsAvailable: false
                        });

                        broadcastToRoom(roomId, 'user-connected', {
                            userId: requesterId,
                            username: requesterUser.username,
                            email: requesterUser.email,
                            isMuted: requesterUser.isMuted,
                            isCameraOff: requesterUser.isCameraOff,
                            isScreenSharing: requesterUser.isScreenSharing,
                            isAdmin: false,
                            isCreator: false,
                            canBeControlledByAdmin: true
                        }, requesterUser.socketId);
                        
                        console.log(`[BACKEND] User ${requesterId} approved and joined room ${roomId}`);
                    } else {
                        console.log(`[BACKEND] Rejecting join request for ${requesterId}`);
                        io.to(requesterUser.socketId).emit('join-rejected', {
                            roomId,
                            message: 'Your request to join the room was rejected by the creator.'
                        });
                    }

                    session.activeParticipants.forEach((participant, participantId) => {
                        if (participant.isCreator) {
                            const creatorUser = activeUsers.get(participantId);
                            if (creatorUser) {
                                io.to(creatorUser.socketId).emit('update-join-requests', session.joinRequests);
                            }
                        }
                    });
                    
                } catch (error) {
                    console.error('[BACKEND] Error handling join request response:', error);
                    socket.emit('error', { message: 'Failed to process join request response' });
                }
            });

            // ... (All other socket event handlers like signal, ice-candidate, etc., should be here) ...
            
            socket.on('disconnect', async () => {
                try {
                    console.log(`User disconnected: ${socket.id}`);
                    
                    let disconnectedUserId = null;
                    for (const [id, u] of activeUsers.entries()) {
                        if (u.socketId === socket.id) {
                            disconnectedUserId = id;
                            break;
                        }
                    }

                    if (disconnectedUserId) {
                        const user = activeUsers.get(disconnectedUserId);
                        if (user && user.roomId) {
                            const session = roomSessions.get(user.roomId);
                            if (session) {
                                session.removeParticipant(user.id);
                                await removeParticipantFromDB(user.roomId, user.id);
                                
                                broadcastToRoom(user.roomId, 'user-disconnected', user.id);
                                
                                if (session.activeParticipants.size === 0) {
                                    roomSessions.delete(user.roomId);
                                    console.log(`Room session ${user.roomId} cleaned up (empty)`);
                                }
                            }
                        }
                        
                        if (user) {
                            user.isConnected = false;
                            user.socketId = null;
                            await updateUserActivity(user.id);
                        }
                        console.log(`User ${disconnectedUserId} marked as disconnected.`);
                    }
                } catch (error) {
                    console.error('Error handling disconnect:', error);
                }
            });
        });

        // --- REST API ENDPOINTS (CORRECTED PLACEMENT) ---

        // Session-based user authentication endpoint
        app.post('/api/users/authenticate', async (req, res) => {
            try {
                const { name, email } = req.body;
                if (!name || !email) {
                    return res.status(400).json({ error: 'Name and email are required.' });
                }

                const sessionToken = uuidv4();
                const userData = { name, email, sessionToken };
                const user = await createOrUpdateUserInDB(userData);

                userSessions.set(sessionToken, user._id.toString());

                console.log(`User authenticated: ${user.name} (${user._id}) with session: ${sessionToken}`);
                
                res.json({ 
                    userId: user._id.toString(), 
                    username: user.name, 
                    email: user.email,
                    sessionToken,
                    isNewUser: !user.totalRoomsCreated && !user.totalRoomsJoined
                });
            } catch (error) {
                console.error('Error authenticating user:', error);
                res.status(500).json({ error: 'Failed to authenticate user.' });
            }
        });

        // Validate session endpoint
        app.post('/api/users/validate-session', async (req, res) => {
            try {
                const { sessionToken } = req.body;
                if (!sessionToken) {
                    return res.status(400).json({ error: 'Session token is required.' });
                }

                const user = await getUserBySessionToken(sessionToken);
                if (!user) {
                    return res.status(401).json({ error: 'Invalid or expired session.' });
                }

                await updateUserActivity(user._id);

                res.json({ 
                    userId: user._id.toString(), 
                    username: user.name, 
                    email: user.email,
                    sessionToken,
                    lastActive: user.lastActive
                });
            } catch (error) {
                console.error('Error validating session:', error);
                res.status(500).json({ error: 'Failed to validate session.' });
            }
        });

        // Get user profile
        app.get('/api/users/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
                
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                const { sessionToken, ...userProfile } = user;
                res.json(userProfile);
            } catch (error) {
                console.error('Error fetching user profile:', error);
                res.status(500).json({ error: 'Failed to fetch user profile.' });
            }
        });

        // Get user's created rooms
        app.get('/api/users/:userId/rooms', async (req, res) => {
            try {
                const { userId } = req.params;
                const { type } = req.query; // 'created' or 'joined'
                
                let filter = { isActive: true };
                
                if (type === 'created') {
                    filter.createdBy = userId;
                } else {
                    filter['participants.userId'] = userId;
                }
                
                const rooms = await db.collection('rooms')
                    .find(filter)
                    .sort({ createdAt: -1 })
                    .toArray();
                
                const roomsWithStatus = rooms.map(room => {
                    const session = roomSessions.get(room.roomId);
                    return {
                        ...room,
                        currentParticipants: session?.activeParticipants.size || 0,
                        hasActiveSession: !!session && session.activeParticipants.size > 0
                    };
                });
                
                res.json(roomsWithStatus);
            } catch (error) {
                console.error('Error fetching user rooms:', error);
                res.status(500).json({ error: 'Failed to fetch user rooms' });
            }
        });
        
        // ---------------------------------------------------------------------
        // ROOM CRUD AND CHAT ROUTES (Must be placed before any generic /api/rooms)
        // ---------------------------------------------------------------------

        // Create a new room with session validation
        app.post('/api/rooms', async (req, res) => {
            try {
                const { name, topic, description, roomType, maxParticipants, sessionToken } = req.body;
                
                if (!name || !sessionToken) {
                    return res.status(400).json({ error: 'Room name and session token are required' });
                }

                const user = await getUserBySessionToken(sessionToken);
                if (!user) {
                    return res.status(401).json({ error: 'Invalid session token' });
                }

                if (!['public', 'private'].includes(roomType)) {
                    return res.status(400).json({ error: 'Room type must be either "public" or "private"' });
                }

                const roomData = {
                    roomId: uuidv4(),
                    name,
                    topic: topic || '',
                    description: description || '',
                    roomType,
                    requiresApproval: roomType === 'private',
                    maxParticipants: maxParticipants || 50,
                    createdBy: user._id.toString(),
                    adminId: user._id.toString(),
                    creatorName: user.name,
                    creatorEmail: user.email
                };

                const room = await createRoomInDB(roomData);
                
                await db.collection('users').updateOne(
                    { _id: user._id },
                    { $inc: { totalRoomsCreated: 1 } }
                );
                
                console.log(`Created new ${roomType} room: ${room.roomId} by user: ${user.name} (${user._id})`);
                
                res.status(201).json({
                    ...room,
                    currentParticipants: 0,
                    isUserCreator: true,
                    canJoin: true,
                    hasActiveSession: false
                });
            } catch (error) {
                console.error('Error creating room:', error);
                res.status(500).json({ error: 'Failed to create room' });
            }
        });

        // Get room info with enhanced details
        app.get('/api/rooms/:roomId', async (req, res) => {
            try {
                const { roomId } = req.params;
                const { userId } = req.query;
                
                const room = await getRoomFromDB(roomId);
                if (!room) {
                    return res.status(404).json({ error: 'Room not found' });
                }

                const session = roomSessions.get(roomId);
                const activeParticipants = session?.getActiveParticipants() || [];
                
                res.json({
                    ...room,
                    currentParticipants: session?.activeParticipants.size || 0,
                    activeParticipants,
                    isUserCreator: userId ? room.createdBy === userId : false,
                    canJoin: room.roomType === 'public' || (userId && room.createdBy === userId),
                    hasActiveSession: !!session && session.activeParticipants.size > 0,
                    joinRequests: session?.joinRequests || []
                });
            } catch (error) {
                console.error('Error fetching room info:', error);
                res.status(500).json({ error: 'Failed to fetch room info' });
            }
        });

        // 2. GET /api/rooms/:roomId/chat - Get chat history for a room
        app.get('/api/rooms/:roomId/chat', async (req, res) => {
            try {
                const { roomId } = req.params;
                const { sessionToken, limit = 50, offset = 0 } = req.query;

                if (!sessionToken) {
                    return res.status(400).json({ error: 'Session token is required' });
                }

                const user = await getUserBySessionToken(sessionToken);
                if (!user) {
                    return res.status(401).json({ error: 'Invalid session token' });
                }

                const room = await db.collection('rooms').findOne(
                    { roomId },
                    {
                        projection: {
                            chatHistory: 1,
                            roomType: 1,
                            createdBy: 1,
                            participants: 1
                        }
                    }
                );

                if (!room) {
                    return res.status(404).json({ error: 'Room not found' });
                }

                const isCreator = room.createdBy === user._id.toString();
                const isParticipant = room.participants && room.participants.some(
                    p => p.userId === user._id.toString()
                );
                const session = roomSessions.get(roomId);
                const isCurrentlyInRoom = session && session.activeParticipants.has(user._id.toString());

                if (!isCreator && !isParticipant && !isCurrentlyInRoom) {
                    return res.status(403).json({ 
                        error: 'You do not have access to this room\'s chat history' 
                    });
                }

                const chatHistory = room.chatHistory || [];
                const totalMessages = chatHistory.length;
                const startIndex = Math.max(0, totalMessages - parseInt(limit) - parseInt(offset));
                const endIndex = totalMessages - parseInt(offset);
                
                const messages = chatHistory
                    .slice(startIndex, endIndex)
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                res.json({
                    roomId,
                    messages,
                    pagination: {
                        total: totalMessages,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: startIndex > 0
                    }
                });

            } catch (error) {
                console.error('Error fetching chat history:', error);
                res.status(500).json({ error: 'Failed to fetch chat history' });
            }
        });

        // 1. POST /api/rooms/chat - Send a chat message (REST fallback)
        app.post('/api/rooms/chat', async (req, res) => {
            try {
                const { roomId, message, sessionToken } = req.body;
                
                if (!roomId || !message || !sessionToken) {
                    return res.status(400).json({ 
                        error: 'Room ID, message, and session token are required' 
                    });
                }

                const user = await getUserBySessionToken(sessionToken);
                if (!user) {
                    return res.status(401).json({ error: 'Invalid session token' });
                }

                const room = await getRoomFromDB(roomId);
                if (!room) {
                    return res.status(404).json({ error: 'Room not found' });
                }

                const session = roomSessions.get(roomId);
                const isInRoom = session && (
                    session.activeParticipants.has(user._id.toString()) ||
                    room.createdBy === user._id.toString()
                );

                if (!isInRoom) {
                    return res.status(403).json({ 
                        error: 'You must be in the room to send messages' 
                    });
                }

                const chatMessage = {
                    messageId: uuidv4(),
                    participantId: user._id.toString(),
                    username: user.name,
                    email: user.email,
                    message: message.trim(),
                    timestamp: new Date(),
                    type: 'text'
                };

                const updateResult = await db.collection('rooms').updateOne(
                    { roomId },
                    { 
                        $push: { chatHistory: chatMessage },
                        $set: { lastActivity: new Date(), updatedAt: new Date() }
                    }
                );

                if (updateResult.modifiedCount === 0) {
                    return res.status(500).json({ error: 'Failed to save chat message' });
                }

                if (session) {
                    broadcastToRoom(roomId, 'chat-message', chatMessage);
                }

                console.log(`Chat message sent in room ${roomId} by ${user.name}: ${message.substring(0, 50)}...`);

                res.status(201).json({
                    success: true,
                    message: 'Message sent successfully',
                    chatMessage
                });

            } catch (error) {
                console.error('Error sending chat message:', error);
                res.status(500).json({ error: 'Failed to send message' });
            }
        });

        // 3. DELETE /api/rooms/:roomId/chat/:messageId - Delete a specific chat message
        app.delete('/api/rooms/:roomId/chat/:messageId', async (req, res) => {
            try {
                const { roomId, messageId } = req.params;
                const { sessionToken } = req.body;

                if (!sessionToken) {
                    return res.status(400).json({ error: 'Session token is required' });
                }

                const user = await getUserBySessionToken(sessionToken);
                if (!user) {
                    return res.status(401).json({ error: 'Invalid session token' });
                }

                const room = await db.collection('rooms').findOne({ roomId });
                if (!room) {
                    return res.status(404).json({ error: 'Room not found' });
                }

                const messageToDelete = room.chatHistory && room.chatHistory.find(
                    msg => msg.messageId === messageId
                );

                if (!messageToDelete) {
                    return res.status(404).json({ error: 'Message not found' });
                }

                const isMessageSender = messageToDelete.participantId === user._id.toString();
                const isRoomCreator = room.createdBy === user._id.toString();

                if (!isMessageSender && !isRoomCreator) {
                    return res.status(403).json({ 
                        error: 'You can only delete your own messages or messages in rooms you created' 
                    });
                }

                const updateResult = await db.collection('rooms').updateOne(
                    { roomId },
                    { 
                        $pull: { chatHistory: { messageId } },
                        $set: { updatedAt: new Date() }
                    }
                );

                if (updateResult.modifiedCount === 0) {
                    return res.status(500).json({ error: 'Failed to delete message' });
                }

                const session = roomSessions.get(roomId);
                if (session) {
                    broadcastToRoom(roomId, 'chat-message-deleted', {
                        messageId,
                        deletedBy: user._id.toString(),
                        deletedByUsername: user.name
                    });
                }

                console.log(`Chat message ${messageId} deleted from room ${roomId} by ${user.name}`);

                res.json({
                    success: true,
                    message: 'Message deleted successfully'
                });

            } catch (error) {
                console.error('Error deleting chat message:', error);
                res.status(500).json({ error: 'Failed to delete message' });
            }
        });

        // 4. DELETE /api/rooms/:roomId/chat - Clear all chat history (creator only)
        app.delete('/api/rooms/:roomId/chat', async (req, res) => {
            try {
                const { roomId } = req.params;
                const { sessionToken } = req.body;

                if (!sessionToken) {
                    return res.status(400).json({ error: 'Session token is required' });
                }

                const user = await getUserBySessionToken(sessionToken);
                if (!user) {
                    return res.status(401).json({ error: 'Invalid session token' });
                }

                const room = await getRoomFromDB(roomId);
                if (!room) {
                    return res.status(404).json({ error: 'Room not found' });
                }

                if (room.createdBy !== user._id.toString()) {
                    return res.status(403).json({ 
                        error: 'Only room creators can clear chat history' 
                    });
                }

                const updateResult = await db.collection('rooms').updateOne(
                    { roomId },
                    { 
                        $set: { 
                            chatHistory: [],
                            updatedAt: new Date()
                        }
                    }
                );

                if (updateResult.modifiedCount === 0) {
                    return res.status(500).json({ error: 'Failed to clear chat history' });
                }

                const session = roomSessions.get(roomId);
                if (session) {
                    broadcastToRoom(roomId, 'chat-history-cleared', {
                        clearedBy: user._id.toString(),
                        clearedByUsername: user.name
                    });
                }

                console.log(`Chat history cleared for room ${roomId} by ${user.name}`);

                res.json({
                    success: true,
                    message: 'Chat history cleared successfully'
                });

            } catch (error) {
                console.error('Error clearing chat history:', error);
                res.status(500).json({ error: 'Failed to clear chat history' });
            }
        });
        
        // Final definition for the generic /api/rooms endpoint (all rooms)
        app.get('/api/rooms', async (req, res) => {
            try {
                const { type, userId } = req.query;
                
                let filter = { isActive: true };
                if (type && ['public', 'private'].includes(type)) {
                    filter.roomType = type;
                }
                
                const rooms = await db.collection('rooms')
                    .find(filter)
                    .sort({ createdAt: -1 })
                    .toArray();
                
                const roomsWithParticipants = rooms.map(room => {
                    const session = roomSessions.get(room.roomId);
                    return {
                        ...room,
                        currentParticipants: session?.activeParticipants.size || 0,
                        isUserCreator: userId ? room.createdBy === userId : false,
                        canJoin: room.roomType === 'public' || (userId && room.createdBy === userId),
                        hasActiveSession: !!session && session.activeParticipants.size > 0
                    };
                });
                
                res.json(roomsWithParticipants);
            } catch (error) {
                console.error('Error fetching rooms:', error);
                res.status(500).json({ error: 'Failed to fetch rooms' });
            }
        });


        // --- ERROR HANDLING & 404 MIDDLEWARE (PLACE AT THE END) ---
        app.use((error, req, res, next) => {
            console.error('Error:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });

        // This must be the absolute last middleware
        app.use('*', (req, res) => {
            res.status(404).json({ error: 'Route not found' });
        });

        // --- START THE SERVER ---
        const PORT = process.env.PORT || 5000;

        server.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`); 
            console.log(`Backend URL: http://localhost:${PORT}`);
            
            const requiredEnvVars = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'];
            const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
            
            if (missingVars.length > 0) {
                console.warn('⚠️  Missing Spotify environment variables:', missingVars.join(', '));
                console.warn('Spotify features will not work. Please check your .env file');
            } else {
                console.log('✅ All Spotify environment variables are set');
            }
            
            console.log('✅ Enhanced user authentication and room management system ready');
        });

    } catch (err) {
        console.error("❌ FAILED TO START SERVER:", err);
        process.exit(1);
    }
};

// --- EXECUTE THE STARTUP FUNCTION ---
startServer();