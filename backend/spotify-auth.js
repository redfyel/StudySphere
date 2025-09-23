// spotify-auth.js
const axios = require('axios');
const querystring = require('querystring');

class SpotifyAuth {
  constructor(clientId, clientSecret, redirectUri) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.baseURL = 'https://accounts.spotify.com'; // Fixed: removed /api
    this.apiURL = 'https://api.spotify.com/v1';
  }

  // Generate authorization URL
  getAuthUrl(scopes = ['user-read-private', 'user-read-email', 'user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing', 'playlist-read-private', 'playlist-read-collaborative', 'user-top-read']) {
    const state = this.generateRandomString(16);
    const scope = scopes.join(' ');

    const params = querystring.stringify({
      response_type: 'code',
      client_id: this.clientId,
      scope: scope,
      redirect_uri: this.redirectUri,
      state: state,
    });

    return {
      url: `${this.baseURL}/authorize?${params}`, // Now correctly points to /authorize
      state: state
    };
  }

  // Exchange authorization code for access token
  async getAccessToken(code, state) {
    try {
      const response = await axios.post(`${this.baseURL}/api/token`, // Token endpoint still uses /api
        querystring.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
        }), {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Token exchange error:', error.response?.data);
      throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post(`${this.baseURL}/api/token`,
        querystring.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }), {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error.response?.data);
      throw new Error(`Token refresh failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  // Get user profile
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`${this.apiURL}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Get user profile error:', error.response?.data);
      throw new Error(`Failed to get user profile: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get user's playlists
  async getUserPlaylists(accessToken, limit = 20, offset = 0) {
    try {
      const response = await axios.get(`${this.apiURL}/me/playlists`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          limit,
          offset
        }
      });

      return response.data;
    } catch (error) {
      console.error('Get playlists error:', error.response?.data);
      throw new Error(`Failed to get playlists: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get playlist tracks
  async getPlaylistTracks(accessToken, playlistId, limit = 50, offset = 0) {
    try {
      const response = await axios.get(`${this.apiURL}/playlists/${playlistId}/tracks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          limit,
          offset
        }
      });

      return response.data;
    } catch (error) {
      console.error('Get playlist tracks error:', error.response?.data);
      throw new Error(`Failed to get playlist tracks: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Search for tracks
  async searchTracks(accessToken, query, limit = 20) {
    try {
      const response = await axios.get(`${this.apiURL}/search`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          q: query,
          type: 'track',
          limit
        }
      });

      return response.data.tracks;
    } catch (error) {
      console.error('Search tracks error:', error.response?.data);
      throw new Error(`Search failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get current playback state
  async getCurrentPlayback(accessToken) {
    try {
      const response = await axios.get(`${this.apiURL}/me/player`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 204) {
        return null; // No active device
      }
      console.error('Get playback error:', error.response?.data);
      throw new Error(`Failed to get playback state: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get user's top tracks
  async getTopTracks(accessToken, timeRange = 'medium_term', limit = 20) {
    try {
      const response = await axios.get(`${this.apiURL}/me/top/tracks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          time_range: timeRange,
          limit
        }
      });

      return response.data;
    } catch (error) {
      console.error('Get top tracks error:', error.response?.data);
      throw new Error(`Failed to get top tracks: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Generate random string for state parameter
  generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}

module.exports = SpotifyAuth;