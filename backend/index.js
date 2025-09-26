// --- 1. IMPORTS & SETUP ---
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const connectDB = require("./db/connect"); // Import our hybrid connector

// Load environment variables immediately
dotenv.config();

// --- 2. REQUIRE ALL ROUTE FILES ---
const aiRoutes = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");
const flashcardRoutes = require("./routes/flashcardRoutes");
const wellnessRoutes = require("./routes/wellnessRoutes");

// --- 3. CREATE THE ASYNCHRONOUS STARTUP FUNCTION ---
const startServer = async () => {
  let db; // This will hold the native DB instance for your socket logic

  try {
    // --- 4. CONNECT TO THE DATABASE ---
    // This is the MOST IMPORTANT step. We wait here until the database is ready.
    // This function connects Mongoose AND returns the native `db` object.
    db = await connectDB();

    // --- 5. INITIALIZE EXPRESS APP & HTTP SERVER ---
    const app = express();
    const server = http.createServer(app);

    // --- 6. APPLY MIDDLEWARE ---
    app.use(cors()); // Enable CORS for all routes
    app.use(express.json()); // Enable JSON body parsing for API requests

    // --- 7. MOUNT API ROUTES ---
    // Now that the DB is connected, it's safe to use routes that depend on it.
    app.use("/api/ai", aiRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/flashcards", flashcardRoutes);
    app.use("/api/wellness", wellnessRoutes); // Your wellness routes will now work!

    // --- 8. SEED DATABASE (IF NEEDED) ---
    // This is the logic from your old `initializeRooms` function.
    const roomsCollection = db.collection("rooms");
    const count = await roomsCollection.countDocuments();
    if (count === 0) {
      console.log("No rooms found in DB, seeding initial data...");
      const initialRooms = [
        {
          id: "room-1",
          name: "Math Study Group",
          topic: "Algebra",
          notes: "Welcome to Math Study Group notes!",
          timer: 0,
          targets: ["Review Algebra", "Solve practice problems"],
        },
        {
          id: "room-2",
          name: "Science Lab",
          topic: "Physics",
          notes: "Science Lab notes here.",
          timer: 0,
          targets: ["Experiment setup", "Data analysis"],
        },
        {
          id: "room-3",
          name: "History Buffs",
          topic: "World History",
          notes: "History Buffs notes.",
          timer: 0,
          targets: ["Read Chapter 5", "Discuss historical events"],
        },
      ];
      await roomsCollection.insertMany(initialRooms);
      console.log("Initial rooms seeded.");
    } else {
      console.log(`${count} rooms found in DB.`);
    }

    // --- 9. CONFIGURE SOCKET.IO ---
    const io = socketIo(server, {
      cors: {
        origin: "http://localhost:5173",
        allowedHeaders: ["Content-Type", "x-auth-token"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
      },
    });

    // NOTE: Your original code had many helper functions and variables
    // (e.g., User, activeUsers, getRoomFromDB). Ensure they are defined correctly
    // and can access the `db` instance where needed.
    // This corrected structure ensures that when io.on() is called, `db` is NOT undefined.

    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);

      // All of your existing socket logic for 'join-room', 'signal', 'disconnect',
      // etc., goes here. It will work because `db` is already connected.
      // For example, a function call inside a listener:
      // const room = await db.collection('rooms').findOne({ id: roomId });
    });

    // --- 10. YOUR EXISTING REST API ENDPOINTS ---
    // These also depend on the `db` object being available.
    app.get("/api/rooms", async (req, res) => {
      try {
        const rooms = await db.collection("rooms").find({}).toArray();
        res.json(rooms);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).json({ error: "Failed to fetch rooms" });
      }
    });

    // ... (Your other app.post('/api/rooms'), app.get('/api/rooms/:roomId') endpoints go here)
    app.get("/api/rooms", async (req, res) => {
      try {
        const { type } = req.query; // Filter by room type: 'public', 'private', or all

        let filter = { isActive: true };
        if (type && ["public", "private"].includes(type)) {
          filter.roomType = type;
        }

        const rooms = await db
          .collection("rooms")
          .find(filter)
          .sort({ createdAt: -1 })
          .toArray();

        // Add current participant count from active sessions
        const roomsWithParticipants = rooms.map((room) => ({
          ...room,
          currentParticipants:
            roomSessions.get(room.roomId)?.activeParticipants.size || 0,
        }));

        res.json(roomsWithParticipants);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).json({ error: "Failed to fetch rooms" });
      }
    });

    // Create a new room with enhanced validation
    app.post("/api/rooms", async (req, res) => {
      try {
        const {
          name,
          topic,
          description,
          roomType,
          maxParticipants,
          createdBy,
        } = req.body;

        if (!name || !createdBy) {
          return res
            .status(400)
            .json({ error: "Room name and creator ID are required" });
        }

        if (!["public", "private"].includes(roomType)) {
          return res
            .status(400)
            .json({ error: 'Room type must be either "public" or "private"' });
        }

        const roomData = {
          roomId: uuidv4(),
          name,
          topic: topic || "",
          description: description || "",
          roomType, // 'public' or 'private'
          requiresApproval: roomType === "private", // Auto-set based on room type
          maxParticipants: maxParticipants || 50,
          createdBy,
          adminId: createdBy,
        };

        const room = await createRoomInDB(roomData);

        console.log(
          `Created new ${roomType} room: ${room.roomId} by user: ${createdBy}`
        );

        res.status(201).json(room);
      } catch (error) {
        console.error("Error creating room:", error);
        res.status(500).json({ error: "Failed to create room" });
      }
    });

    // Get room info
    app.get("/api/rooms/:roomId", async (req, res) => {
      try {
        const { roomId } = req.params;
        const room = await getRoomFromDB(roomId);

        if (!room) {
          return res.status(404).json({ error: "Room not found" });
        }

        const session = roomSessions.get(roomId);
        res.json({
          ...room,
          currentParticipants: session?.activeParticipants.size || 0,
          activeParticipants: session?.getActiveParticipants() || [],
        });
      } catch (error) {
        console.error("Error fetching room info:", error);
        res.status(500).json({ error: "Failed to fetch room info" });
      }
    });

    // --- 11. ERROR HANDLING & 404 MIDDLEWARE (PLACE AT THE END) ---
    app.use((error, req, res, next) => {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal server error" });
    });
    app.use("*", (req, res) => {
      res.status(404).json({ error: "Route not found" });
    });

    // --- 12. START THE SERVER ---
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      // ... your other startup logs
    });
  } catch (err) {
    console.error("❌ FAILED TO START SERVER:", err);
    process.exit(1);
  }
};

// --- 13. EXECUTE THE STARTUP FUNCTION ---
startServer();
