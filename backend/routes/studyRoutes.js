const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Your JWT authentication middleware
const connectDB = require('../db/connect');   // Your database connection function
const { ObjectId } = require('mongodb');   // Required to query by _id

/**
 * @route   POST /api/study/log
 * @desc    Log study time for a user and update their stats
 * @access  Private
 */
router.post('/log', auth, async (req, res) => {
  try {
    const { duration } = req.body; // duration in seconds
    if (!duration || typeof duration !== 'number' || duration <= 0) {
      return res.status(400).json({ msg: 'Invalid duration provided' });
    }

    const db = await connectDB();
    const usersCollection = db.collection('users'); // Accessing your 'users' collection

    const userId = new ObjectId(req.user.id);
    const user = await usersCollection.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // --- Streak and Time Logic ---
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Get the very start of today

    const updateFields = {
      $inc: { totalStudyTime: duration } // Always increment the total study time
    };

    // Check if the last study session was on the same day
    if (user.lastStudyDay && new Date(user.lastStudyDay).getTime() === today.getTime()) {
      // It's the same day, just add to daily time
      updateFields.$inc.dailyStudyTime = duration;
    } else {
      // This is the first study session of a new day
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let newStreak = 1; // Default streak is 1 for today's session
      // Check if they studied yesterday to continue the streak
      if (user.lastStudyDay && new Date(user.lastStudyDay).getTime() === yesterday.getTime()) {
        newStreak = (user.studyStreak || 0) + 1;
      }

      // Set the new streak and reset daily counters for the new day
      updateFields.$set = {
        studyStreak: newStreak,
        lastStudyDay: today,
        dailyStudyTime: duration,
        streakQualifiedToday: false, // Reset qualification for the new day
      };
    }
    
    // --- Perform the database update ---
    await usersCollection.updateOne({ _id: userId }, updateFields);
    
    // Check if the 30-min qualification is met after the update
    const updatedUser = await usersCollection.findOne({ _id: userId });
    if (updatedUser.dailyStudyTime >= 1800 && !updatedUser.streakQualifiedToday) {
        await usersCollection.updateOne({ _id: userId }, { $set: { streakQualifiedToday: true } });
    }

    res.json({ msg: 'Study time logged successfully.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;