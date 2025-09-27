// routes/spotify.js
const express = require('express');
const SpotifyAuth = require('../spotify-auth');
const router = express.Router();

// Initialize Spotify Auth with your credentials
const spotifyAuth = new SpotifyAuth(
  process.env.SPOTIFY_CLIENT_ID,
  process.env.SPOTIFY_CLIENT_SECRET,
  process.env.SPOTIFY_REDIRECT_URI || 'https://studysphere-n4up.onrender.com/api/spotify/auth/spotify/callback'
);

// Store tokens temporarily (in production, use a proper database)
let tokenStore = {};

// Route to initiate Spotify authentication
router.get('/auth/spotify', (req, res) => {
  try {
    console.log('Initiating Spotify authentication...');
    
    // Check if required environment variables are set
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.error('Missing Spotify credentials in environment variables');
      return res.status(500).json({ 
        error: 'Spotify credentials not configured',
        message: 'Please check your .env file for SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET'
      });
    }

    const { url, state } = spotifyAuth.getAuthUrl();
    
    // Store state for validation
    if (req.session) {
      req.session.spotifyState = state;
    }
    
    console.log('Generated Spotify auth URL:', url);
    res.json({ authUrl: url, state });
  } catch (error) {
    console.error('Error generating Spotify auth URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Spotify callback route
router.get('/auth/spotify/callback', async (req, res) => {
  console.log('Spotify callback received:', req.query);
  
  const { code, state, error } = req.query;

  if (error) {
    console.error('Spotify authorization error:', error);
    return res.status(400).json({ error: `Authorization failed: ${error}` });
  }

  if (!code) {
    console.error('No authorization code provided');
    return res.status(400).json({ error: 'Authorization code not provided' });
  }

  try {
    console.log('Exchanging authorization code for access token...');
    const tokenData = await spotifyAuth.getAccessToken(code, state);
    
    console.log('Getting user profile...');
    const userProfile = await spotifyAuth.getUserProfile(tokenData.access_token);
    
    // Store tokens (in production, use secure storage)
    const userId = userProfile.id;
    tokenStore[userId] = {
      ...tokenData,
      user: userProfile,
      timestamp: Date.now()
    };

    console.log('User authenticated successfully:', userId);
    
    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/success?userId=${userId}`);
  } catch (error) {
    console.error('Spotify callback error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userTokens = tokenStore[userId];

    if (!userTokens) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    res.json(userTokens.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's playlists
router.get('/user/:userId/playlists', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const userTokens = tokenStore[userId];

    if (!userTokens) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const playlists = await spotifyAuth.getUserPlaylists(userTokens.access_token, limit, offset);
    res.json(playlists);
  } catch (error) {
    if (error.message.includes('token')) {
      return res.status(401).json({ error: 'Token expired', needsRefresh: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get playlist tracks
router.get('/user/:userId/playlists/:playlistId/tracks', async (req, res) => {
  try {
    const { userId, playlistId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userTokens = tokenStore[userId];

    if (!userTokens) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const tracks = await spotifyAuth.getPlaylistTracks(userTokens.access_token, playlistId, limit, offset);
    res.json(tracks);
  } catch (error) {
    if (error.message.includes('token')) {
      return res.status(401).json({ error: 'Token expired', needsRefresh: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Search tracks
router.get('/user/:userId/search', async (req, res) => {
  try {
    const { userId } = req.params;
    const { q, limit = 20 } = req.query;
    const userTokens = tokenStore[userId];

    if (!userTokens) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!q) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const tracks = await spotifyAuth.searchTracks(userTokens.access_token, q, limit);
    res.json(tracks);
  } catch (error) {
    if (error.message.includes('token')) {
      return res.status(401).json({ error: 'Token expired', needsRefresh: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get user's top tracks
router.get('/user/:userId/top-tracks', async (req, res) => {
  try {
    const { userId } = req.params;
    const { time_range = 'medium_term', limit = 20 } = req.query;
    const userTokens = tokenStore[userId];

    if (!userTokens) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const topTracks = await spotifyAuth.getTopTracks(userTokens.access_token, time_range, limit);
    res.json(topTracks);
  } catch (error) {
    if (error.message.includes('token')) {
      return res.status(401).json({ error: 'Token expired', needsRefresh: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Refresh token
router.post('/user/:userId/refresh-token', async (req, res) => {
  try {
    const { userId } = req.params;
    const userTokens = tokenStore[userId];

    if (!userTokens || !userTokens.refresh_token) {
      return res.status(401).json({ error: 'No refresh token available' });
    }

    const newTokenData = await spotifyAuth.refreshAccessToken(userTokens.refresh_token);
    
    // Update stored tokens
    tokenStore[userId] = {
      ...userTokens,
      ...newTokenData,
      timestamp: Date.now()
    };

    res.json({ success: true, access_token: newTokenData.access_token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout user
router.post('/user/:userId/logout', (req, res) => {
  const { userId } = req.params;
  delete tokenStore[userId];
  res.json({ success: true });
});

module.exports = router;