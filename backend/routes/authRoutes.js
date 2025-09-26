// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const connectDB = require('../db/connect'); // Assuming you have a connect.js that exports a connection function

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    // --- Validation Middleware ---
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    // 1. Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      const db = await connectDB();
      const usersCollection = db.collection('users');

      // 2. Check if user already exists
      let user = await usersCollection.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User with this email already exists' });
      }

      // 3. Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 4. Create the new user object
      const newUser = {
        username,
        email,
        password: hashedPassword,
        createdAt: new Date(),
      };

      // 5. Save the user to the database
      const result = await usersCollection.insertOne(newUser);
      const createdUser = { _id: result.insertedId, ...newUser }; // Get the full user object with its new ID

      // 6. Create and sign a JSON Web Token (JWT)
      const payload = {
        user: {
          id: createdUser._id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5h' }, // Token expires in 5 hours
        (err, token) => {
          if (err) throw err;
          res.status(201).json({ token }); // Send the token to the client
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token (Login)
 * @access  Public
 */
router.post(
  '/login',
  [
    // --- Validation Middleware ---
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    // 1. Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const db = await connectDB();
      const usersCollection = db.collection('users');

      // 2. Check if the user exists
      const user = await usersCollection.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid email Credentials' });
      }

      // 3. Compare the provided password with the stored hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid password Credentials' });
      }

      // 4. If credentials are correct, create and return a JWT
      const payload = {
        user: {
          id: user._id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;