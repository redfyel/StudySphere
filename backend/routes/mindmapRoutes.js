const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const connectDB = require('../db/connect');
const { ObjectId } = require('mongodb');

/**
 * @route   POST /api/mindmaps
 * @desc    Save a new mind map
 * @access  Private
 */
router.post('/', [
    auth,
    [
      check('title', 'A title is required for the mind map').not().isEmpty(),
      check('mindMapData', 'Mind map data is required').isObject(),
      check('mindMapData.root', 'Mind map data must have a root node').exists(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, mindMapData } = req.body;
    const userId = req.user.id;

    try {
      const db = await connectDB();
      const mindmapsCollection = db.collection('mindmaps');

      const newMindMap = {
        userId: new ObjectId(userId),
        title,
        mindMapData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await mindmapsCollection.insertOne(newMindMap);
      res.status(201).json({ _id: result.insertedId, ...newMindMap });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   GET /api/mindmaps
 * @desc    Get all mind maps for the logged-in user (summary view)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const db = await connectDB();
    const mindmapsCollection = db.collection('mindmaps');

    const maps = await mindmapsCollection
      .find({ userId: new ObjectId(req.user.id) })
      .sort({ createdAt: -1 })
      .project({ title: 1, createdAt: 1, updatedAt: 1 })
      .toArray();

    res.json(maps);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/mindmaps/:id
 * @desc    Get a single, full mind map by its ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const db = await connectDB();
    const mindmapsCollection = db.collection('mindmaps');

    const map = await mindmapsCollection.findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(req.user.id),
    });

    if (!map) {
      return res.status(404).json({ msg: 'Mind map not found or you do not have permission.' });
    }
    res.json(map);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/mindmaps/:id/sessions
 * @desc    Log a review session for a specific mind map
 * @access  Private
 */
router.post('/:id/sessions', auth, async (req, res) => {
    try {
      const db = await connectDB();
      // We will create a new collection dedicated to these sessions
      const sessionsCollection = db.collection('mindMapSessions');
      
      const newSession = {
        userId: new ObjectId(req.user.id),
        mapId: new ObjectId(req.params.id),
        reviewedAt: new Date(), // This is our timestamp
      };
      
      await sessionsCollection.insertOne(newSession);
      res.status(201).json({ msg: 'Review session logged successfully.' });

    } catch (err) {
      console.error(err.message);
      if (err.name === 'BSONError') {
        return res.status(400).json({ msg: 'Invalid Mind Map ID format.' });
      }
      res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/mindmaps/sessions/latest
 * @desc    Get the most recent review session for each of the user's mind maps
 * @access  Private
 */
router.get('/sessions/latest', auth, async (req, res) => {
  try {
    const db = await connectDB();
    const sessionsCollection = db.collection('mindMapSessions');
    
    // This aggregation pipeline is the magic for the "Review Maps" page
    const latestSessions = await sessionsCollection.aggregate([
      // 1. Get all sessions for this user
      { $match: { userId: new ObjectId(req.user.id) } },
      // 2. Sort by most recent first
      { $sort: { reviewedAt: -1 } },
      // 3. Group by mapId and take only the FIRST (most recent) entry
      { 
        $group: { 
          _id: "$mapId", 
          lastReviewed: { $first: "$reviewedAt" } 
        } 
      },
      // 4. Join with the main 'mindmaps' collection to get the title
      {
        $lookup: {
          from: "mindmaps",
          localField: "_id",
          foreignField: "_id",
          as: "mapInfo"
        }
      },
      // 5. Unpack the resulting array from the lookup
      { $unwind: "$mapInfo" },
      // 6. Shape the final data for the frontend
      {
        $project: {
          _id: 0,
          mapId: "$_id",
          title: "$mapInfo.title",
          lastReviewed: "$lastReviewed",
        }
      },
      // 7. Sort the final list by the most recently reviewed
      { $sort: { lastReviewed: -1 } }
    ]).toArray();
    
    res.json(latestSessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;