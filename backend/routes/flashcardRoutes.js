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

module.exports = router;