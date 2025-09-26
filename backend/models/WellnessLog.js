const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// This schema defines the structure for every mood/vibe log entry.
const WellnessLogSchema = new Schema({
  // This links each log to a specific user from your 'users' collection.
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user', 
    required: true,
  },
  // This distinguishes between the two types of loggers you have.
  type: {
    type: String,
    required: true,
    enum: ['mood', 'vibe'], // Only allows these two values
  },
  // This stores the actual data. It's flexible ('Mixed') to hold either
  // a string (for mood) or an object (for study vibe sliders).
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  notes: {
    type: String,
  },
  // Automatically adds a timestamp when the log is created.
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('wellness_logs', WellnessLogSchema);