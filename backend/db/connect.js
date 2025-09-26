const mongoose = require('mongoose');
require('dotenv').config();

let db; // This variable will hold our database connection instance

const connectDB = async () => {
  // If we're already connected, don't connect again. Return the existing connection.
  if (db) {
    return db;
  }

  try {
    // 1. Use Mongoose to connect to the database. This is what your WellnessLog model needs.
    // Mongoose will parse the DB name from your MONGO_URI.
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected via Mongoose to host: ${conn.connection.host}`);

    // 2. Extract the native MongoDB driver's 'db' object from the Mongoose connection.
    // This is the object that your existing socket code needs to use db.collection(...).
    db = conn.connection.db;

    return db;
    
  } catch (err) {
    console.error('❌ Hybrid DB Connection Error:', err.message);
    // Exit the entire process with a failure code if we can't connect to the DB.
    process.exit(1);
  }
};

module.exports = connectDB;