const { MongoClient } = require('mongodb');

let db; // To store the connected database instance

const connectDB = async () => {
  if (db) {
    return db; // Return existing connection if already established
  }

  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/studyroom';
    const client = new MongoClient(mongoURI);
    await client.connect();
    db = client.db(); // Get the database instance
    console.log('MongoDB connected successfully!');
    return db;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
