// backend/db/connect.js
const { MongoClient } = require('mongodb');

let db;

const connectDB = async () => {
  if (db) {
    return db;
  }

  try {
    // --- FIX: Point to your 'studysphere' database ---
    const dbName = 'studysphere';
    const mongoURI = process.env.MONGO_URI || `mongodb://localhost:27017/${dbName}`;
    
    const client = new MongoClient(mongoURI);
    await client.connect();
    
    // Explicitly connect to the 'studysphere' database
    db = client.db(dbName); 
    
    console.log(`MongoDB connected successfully to database: ${dbName}`);
    return db;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;