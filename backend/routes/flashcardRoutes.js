// backend/routes/flashcardRoutes.js

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const connectDB = require('../db/connect');
const { ObjectId } = require('mongodb');

/**
 * @route   POST /api/flashcards/decks
 * @desc    Save a new flashcard deck
 * @access  Private
 */
router.post(
  '/decks',
  [
    auth,
    [
      check('title', 'A title is required for the deck').not().isEmpty(),
      check('flashcards', 'Flashcards must be an array and not empty').isArray({ min: 1 }),
      check('flashcards.*.question', 'Each flashcard must have a question').not().isEmpty(),
      check('flashcards.*.answer', 'Each flashcard must have an answer').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, flashcards } = req.body;
    const userId = req.user.id;

    try {
      const db = await connectDB();
      const flashcardsCollection = db.collection('flashcards');

      // Aggregate all unique tags from the cards
      const allTagsFromCards = flashcards.flatMap(card => card.tags || []);
      const uniqueDeckTags = [...new Set(allTagsFromCards)];

      const newDeck = {
        userId: new ObjectId(userId),
        title,
        tags: uniqueDeckTags, // Add the aggregated tags to the deck
        flashcards,
        createdAt: new Date(),
      };

      const result = await flashcardsCollection.insertOne(newDeck);
      const createdDeck = { _id: result.insertedId, ...newDeck };

      res.status(201).json(createdDeck);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   GET /api/flashcards/decks
 * @desc    Get all flashcard decks for the logged-in user
 * @access  Private
 */
router.get('/decks', auth, async (req, res) => {
  try {
    const db = await connectDB();
    const flashcardsCollection = db.collection('flashcards');

    const decks = await flashcardsCollection
      .find({ userId: new ObjectId(req.user.id) })
      .sort({ createdAt: -1 })
      .project({ 
        title: 1, 
        createdAt: 1, 
        tags: 1, // Return the deck's top-level tags
        cardCount: { $size: "$flashcards" }
      })
      .toArray();

    res.json(decks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/flashcards/decks/:id
 * @desc    Get a single deck by its ID
 * @access  Private
 */
router.get('/decks/:id', auth, async (req, res) => {
  try {
    const db = await connectDB();
    const flashcardsCollection = db.collection('flashcards');

    const deck = await flashcardsCollection.findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(req.user.id),
    });

    if (!deck) {
      return res.status(404).json({ msg: 'Deck not found or you do not have permission to view it.' });
    }

    res.json(deck);
  } catch (err)
 {
    console.error(err.message);
    if (err.name === 'BSONError') {
      return res.status(400).json({ msg: 'Invalid Deck ID format.' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/flashcards/decks/:deckId/sessions
 * @desc    Log a completed study session for a deck
 * @access  Private
 */
router.post(
  '/decks/:deckId/sessions',
  [
    auth,
    [
      check('masteredCount', 'Mastered count must be a number').isNumeric(),
      check('forgotCount', 'Forgot count must be a number').isNumeric(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { masteredCount, forgotCount } = req.body;
      const { deckId } = req.params;
      const userId = req.user.id;
      
      const db = await connectDB();
      const sessionsCollection = db.collection('studySessions');

      const newSession = {
        userId: new ObjectId(userId),
        deckId: new ObjectId(deckId),
        completedAt: new Date(),
        masteredCount,
        forgotCount,
      };

      const result = await sessionsCollection.insertOne(newSession);
      const createdSession = { _id: result.insertedId, ...newSession };

      res.status(201).json(createdSession);

    } catch (err) {
      console.error(err.message);
      if (err.name === 'BSONError') {
        return res.status(400).json({ msg: 'Invalid Deck ID format.' });
      }
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   GET /api/flashcards/sessions/latest
 * @desc    Get the most recent study session for each of the user's decks
 * @access  Private
 */
router.get('/sessions/latest', auth, async (req, res) => {
  try {
    const db = await connectDB();
    const sessionsCollection = db.collection('studySessions');
    const userId = new ObjectId(req.user.id);

    // This is an aggregation pipeline to get the latest session for each deck
    const latestSessions = await sessionsCollection.aggregate([
      // 1. Find all sessions for the current user
      { $match: { userId: userId } },
      // 2. Sort them by date, so the newest is first for each deck
      { $sort: { completedAt: -1 } },
      // 3. Group by deck and take the *first* document (which is the latest)
      {
        $group: {
          _id: "$deckId",
          lastStudied: { $first: "$completedAt" },
          masteredCount: { $first: "$masteredCount" },
          forgotCount: { $first: "$forgotCount" },
        }
      },
      // 4. Join with the flashcards collection to get the deck's title
      {
        $lookup: {
          from: "flashcards", // The name of your decks collection
          localField: "_id",
          foreignField: "_id",
          as: "deckInfo"
        }
      },
      // 5. Deconstruct the deckInfo array
      { $unwind: "$deckInfo" },
      // 6. Shape the final output to be clean and useful for the frontend
      {
        $project: {
          _id: 0, // Exclude the original _id field
          deckId: "$_id",
          deckTitle: "$deckInfo.title",
          lastStudied: "$lastStudied",
          masteredCount: "$masteredCount",
          forgotCount: "$forgotCount"
        }
      }
    ]).toArray();

    res.json(latestSessions);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;