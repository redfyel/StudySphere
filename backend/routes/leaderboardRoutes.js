const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const connectDB = require('../db/connect');

/**
 * @route   GET /api/leaderboard/time
 * @desc    Get top 10 users ranked by total study time
 * @access  Private
 */
router.get('/time', auth, async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const topUsers = await usersCollection
      .find({})
      // 1. Sort by totalStudyTime in descending order (highest first)
      .sort({ totalStudyTime: -1 })
      // 2. Limit the results to the top 10
      .limit(10)
      // 3. Project only the fields we need for the frontend
      .project({ name: 1, totalStudyTime: 1 })
      .toArray();

    res.json(topUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/leaderboard/streak
 * @desc    Get top 10 users ranked by study streak
 * @access  Private
 */
router.get('/streak', auth, async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    const topUsers = await usersCollection
      .find({})
      // 1. Sort by studyStreak in descending order (highest first)
      .sort({ studyStreak: -1 })
      // 2. Limit the results to the top 10
      .limit(10)
      // 3. Project only the fields we need
      .project({ name: 1, studyStreak: 1 })
      .toArray();

    res.json(topUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;