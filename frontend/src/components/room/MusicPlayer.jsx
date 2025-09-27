import React, { useState, useRef, useEffect, useCallback } from 'react';

function SpotifyMusicPlayer() {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(0.7);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeatOne, setIsRepeatOne] = useState(false);
  const [isRepeatAll, setIsRepeatAll] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [error, setError] = useState(null);
  
  // Spotify specific states
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showSpotifyPlaylists, setShowSpotifyPlaylists] = useState(false);
  const [activeView, setActiveView] = useState('demo'); // 'demo', 'spotify', 'search'

  const API_BASE_URL = 'https://studysphere-n4up.onrender.com/';

  // Default demo tracks
  const demoTracks = [
    { 
      id: 'demo1',
      name: 'Calm Piano', 
      artist: 'SoundHelix',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: '2:56',
      image: null,
      preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    },
    { 
      id: 'demo2',
      name: 'Ambient Study', 
      artist: 'SoundHelix',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      duration: '3:24',
      image: null,
      preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
    },
    { 
      id: 'demo3',
      name: 'Focus Beats', 
      artist: 'SoundHelix',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      duration: '2:48',
      image: null,
      preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
    },
  ];

  const currentTracks = activeView === 'spotify' ? tracks : 
                       activeView === 'search' ? searchResults : demoTracks;

  // Check if user is authenticated on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');
    
    if (userIdParam) {
      setUserId(userIdParam);
      setIsSpotifyConnected(true);
      fetchUserProfile(userIdParam);
      fetchUserPlaylists(userIdParam);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Spotify API calls
  const fetchUserProfile = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/spotify/user/${userId}`);
      if (response.ok) {
        const user = await response.json();
        setSpotifyUser(user);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const fetchUserPlaylists = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/spotify/user/${userId}/playlists`);
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  const loadPlaylistTracks = async (playlistId) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/spotify/user/${userId}/playlists/${playlistId}/tracks`);
      if (response.ok) {
        const data = await response.json();
        const formattedTracks = data.items.map(item => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists.map(a => a.name).join(', '),
          duration: formatSpotifyDuration(item.track.duration_ms),
          image: item.track.album.images[0]?.url,
          preview_url: item.track.preview_url,
          src: item.track.preview_url // Spotify only provides 30s previews
        })).filter(track => track.preview_url); // Only tracks with previews
        
        setTracks(formattedTracks);
        setActiveView('spotify');
        setCurrentTrackIndex(0);
        setShowSpotifyPlaylists(false);
      }
    } catch (error) {
      console.error('Failed to load playlist tracks:', error);
      setError('Failed to load playlist tracks');
    }
    setIsLoading(false);
  };

  const searchTracks = async (query) => {
    if (!userId || !query.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/spotify/user/${userId}/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        const formattedTracks = data.items.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          duration: formatSpotifyDuration(track.duration_ms),
          image: track.album.images[0]?.url,
          preview_url: track.preview_url,
          src: track.preview_url
        })).filter(track => track.preview_url);
        
        setSearchResults(formattedTracks);
        setActiveView('search');
        setCurrentTrackIndex(0);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setError('Search failed');
    }
    setIsLoading(false);
  };

  const connectToSpotify = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/spotify/auth/spotify`);
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('Failed to initiate Spotify auth:', error);
      setError('Failed to connect to Spotify');
    }
  };

  const disconnectSpotify = async () => {
    if (userId) {
      try {
        await fetch(`${API_BASE_URL}/api/spotify/user/${userId}/logout`, { method: 'POST' });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
    
    setIsSpotifyConnected(false);
    setSpotifyUser(null);
    setUserId(null);
    setPlaylists([]);
    setTracks([]);
    setSearchResults([]);
    setActiveView('demo');
    setCurrentTrackIndex(0);
  };

  const formatSpotifyDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update audio properties when they change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate]);

  // Time update handler
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isNaN(audioRef.current.currentTime)) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  // Load metadata handler
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
      setError(null);
    }
  }, []);

  // Error handler
  const handleError = useCallback(() => {
    setIsLoading(false);
    setIsPlaying(false);
    setError('Failed to load audio track');
  }, []);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleError);
      audio.addEventListener('loadstart', () => setIsLoading(true));
      audio.addEventListener('canplay', () => setIsLoading(false));

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [handleTimeUpdate, handleLoadedMetadata, handleError]);

  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    
    setError(null);
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setError('Unable to play audio');
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(previousVolume);
    } else {
      setPreviousVolume(volume);
      setIsMuted(true);
      setVolume(0);
    }
  };

  const changeTrack = (newIndex) => {
    if (newIndex >= 0 && newIndex < currentTracks.length) {
      setCurrentTrackIndex(newIndex);
      setIsPlaying(false);
      setCurrentTime(0);
      setError(null);
    }
  };

  const nextTrack = () => {
    let nextIndex;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * currentTracks.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % currentTracks.length;
    }
    changeTrack(nextIndex);
  };

  const prevTrack = () => {
    if (currentTime > 3) {
      // If more than 3 seconds played, restart current track
      audioRef.current.currentTime = 0;
    } else {
      // Go to previous track
      const prevIndex = currentTrackIndex === 0 ? currentTracks.length - 1 : currentTrackIndex - 1;
      changeTrack(prevIndex);
    }
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleEnded = () => {
    if (isRepeatOne) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (isRepeatAll || currentTrackIndex < currentTracks.length - 1) {
      nextTrack();
      // Auto-play next track
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(console.error);
          setIsPlaying(true);
        }
      }, 100);
    } else {
      setIsPlaying(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchTracks(searchQuery);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentTrack = currentTracks[currentTrackIndex];

  return (
    <div className="music-player">
      <audio
        ref={audioRef}
        src={currentTrack?.src || currentTrack?.preview_url}
        onEnded={handleEnded}
        preload="metadata"
      />
      
      <div className="player-header">
        <div className="app-title">Music Player</div>
        <div className="header-controls">
          {!isSpotifyConnected ? (
            <button className="spotify-btn" onClick={connectToSpotify}>
              Connect Spotify
            </button>
          ) : (
            <div className="spotify-user">
              <img 
                src={spotifyUser?.images?.[0]?.url || '/api/placeholder/32/32'} 
                alt="Profile" 
                className="user-avatar"
              />
              <span className="user-name">{spotifyUser?.display_name}</span>
              <button className="disconnect-btn" onClick={disconnectSpotify}>
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="view-tabs">
        <button 
          className={`tab-btn ${activeView === 'demo' ? 'active' : ''}`}
          onClick={() => setActiveView('demo')}
        >
          Demo Tracks
        </button>
        {isSpotifyConnected && (
          <>
            <button 
              className={`tab-btn ${activeView === 'spotify' ? 'active' : ''}`}
              onClick={() => setShowSpotifyPlaylists(true)}
            >
              Spotify
            </button>
            <button 
              className={`tab-btn ${activeView === 'search' ? 'active' : ''}`}
              onClick={() => setShowSearch(true)}
            >
              Search
            </button>
          </>
        )}
      </div>

      {currentTrack && (
        <>
          <div className="track-info">
            {currentTrack.image && (
              <img 
                src={currentTrack.image} 
                alt="Album cover" 
                className="track-image"
              />
            )}
            <div className="track-details">
              <div className="track-name">{currentTrack.name}</div>
              <div className="track-artist">{currentTrack.artist}</div>
              <div className="track-counter">
                {currentTrackIndex + 1} of {currentTracks.length}
                {activeView === 'spotify' && ' (30s previews)'}
              </div>
            </div>
          </div>

          <div className="progress-section">
            <span className="time-current">{formatTime(currentTime)}</span>
            <div 
              className="progress-container" 
              ref={progressRef}
              onClick={handleProgressClick}
            >
              <div className="progress-track">
                <div 
                  className="progress-fill"
                  style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
              </div>
            </div>
            <span className="time-total">{formatTime(duration)}</span>
          </div>

          <div className="main-controls">
            <button 
              onClick={() => setIsShuffled(!isShuffled)}
              className={`control-btn secondary ${isShuffled ? 'active' : ''}`}
            >
              Shuffle
            </button>
            
            <div className="playback-controls">
              <button onClick={prevTrack} className="control-btn">
                Prev
              </button>
              
              <button 
                onClick={togglePlayPause} 
                className="play-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Loading' : (isPlaying ? 'Pause' : 'Play')}
              </button>
              
              <button onClick={nextTrack} className="control-btn">
                Next
              </button>
            </div>
            
            <button 
              onClick={() => {
                if (isRepeatOne) {
                  setIsRepeatOne(false);
                  setIsRepeatAll(true);
                } else if (isRepeatAll) {
                  setIsRepeatOne(false);
                  setIsRepeatAll(false);
                } else {
                  setIsRepeatOne(true);
                  setIsRepeatAll(false);
                }
              }}
              className={`control-btn secondary ${(isRepeatOne || isRepeatAll) ? 'active' : ''}`}
            >
              {isRepeatOne ? 'Repeat 1' : isRepeatAll ? 'Repeat All' : 'No Repeat'}
            </button>
          </div>

          <div className="bottom-controls">
            <div className="volume-section">
              <button onClick={toggleMute} className="volume-btn">
                {isMuted || volume === 0 ? 'Muted' : 'Volume'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
              <span className="volume-percent">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
            </div>

            <div className="speed-section">
              <label className="speed-label">Speed:</label>
              <select 
                value={playbackRate} 
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="speed-select"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>
          </div>
        </>
      )}

      {showPlaylist && (
        <div className="playlist">
          <div className="playlist-header">
            Current Playlist ({activeView})
            <button 
              className="close-btn"
              onClick={() => setShowPlaylist(false)}
            >
              ×
            </button>
          </div>
          {currentTracks.map((track, index) => (
            <div
              key={track.id || index}
              className={`playlist-item ${index === currentTrackIndex ? 'active' : ''}`}
              onClick={() => changeTrack(index)}
            >
              {track.image && (
                <img 
                  src={track.image} 
                  alt="Track" 
                  className="playlist-track-image"
                />
              )}
              <div className="playlist-track-info">
                <div className="playlist-track-name">{track.name}</div>
                <div className="playlist-track-artist">{track.artist}</div>
              </div>
              <div className="playlist-track-duration">{track.duration}</div>
            </div>
          ))}
        </div>
      )}

      {showSpotifyPlaylists && isSpotifyConnected && (
        <div className="playlist">
          <div className="playlist-header">
            Your Spotify Playlists
            <button 
              className="close-btn"
              onClick={() => setShowSpotifyPlaylists(false)}
            >
              ×
            </button>
          </div>
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="playlist-item spotify-playlist"
              onClick={() => loadPlaylistTracks(playlist.id)}
            >
              {playlist.images?.[0] && (
                <img 
                  src={playlist.images[0].url} 
                  alt="Playlist" 
                  className="playlist-track-image"
                />
              )}
              <div className="playlist-track-info">
                <div className="playlist-track-name">{playlist.name}</div>
                <div className="playlist-track-artist">{playlist.tracks.total} tracks</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSearch && isSpotifyConnected && (
        <div className="playlist">
          <div className="playlist-header">
            Search Spotify
            <button 
              className="close-btn"
              onClick={() => setShowSearch(false)}
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for songs, artists, albums..."
              className="search-input"
            />
            <button type="submit" className="search-btn" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((track, index) => (
                <div
                  key={track.id}
                  className="playlist-item"
                  onClick={() => {
                    setActiveView('search');
                    changeTrack(index);
                    setShowSearch(false);
                  }}
                >
                  {track.image && (
                    <img 
                      src={track.image} 
                      alt="Track" 
                      className="playlist-track-image"
                    />
                  )}
                  <div className="playlist-track-info">
                    <div className="playlist-track-name">{track.name}</div>
                    <div className="playlist-track-artist">{track.artist}</div>
                  </div>
                  <div className="playlist-track-duration">{track.duration}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="playlist-toggle-section">
        <button 
          className="playlist-toggle"
          onClick={() => setShowPlaylist(!showPlaylist)}
        >
          Show Current Playlist
        </button>
      </div>

      <style jsx>{`
        .music-player {
          width: 100%;
          max-width: 250px;
          margin: 0 auto;
          padding: 20px;
          background: #F1F0E8;
          border: 1px solid #E5E1DA;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(137, 168, 178, 0.1);
          color: #89A8B2;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
        }

        .player-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .app-title {
          font-size: 16px;
          font-weight: 600;
          color: #89A8B2;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spotify-btn {
          background: #1DB954;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .spotify-btn:hover {
          background: #1ed760;
        }

        .spotify-user {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .user-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-name {
          font-size: 12px;
          color: #89A8B2;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .disconnect-btn {
          background: #E5E1DA;
          border: none;
          border-radius: 4px;
          color: #89A8B2;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 10px;
          transition: all 0.2s ease;
        }

        .disconnect-btn:hover {
          background: #B3C8CF;
          color: #F1F0E8;
        }

        .view-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          background: #E5E1DA;
          border-radius: 6px;
          padding: 4px;
        }

        .tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: #B3C8CF;
          padding: 6px 8px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          background: #F1F0E8;
          color: #89A8B2;
        }

        .tab-btn:hover:not(.active) {
          background: rgba(241, 240, 232, 0.5);
        }

        .error-message {
          background: #F1F0E8;
          border: 1px solid #E5E1DA;
          border-radius: 6px;
          color: #89A8B2;
          padding: 8px 12px;
          margin-bottom: 16px;
          font-size: 12px;
          text-align: center;
        }

        .track-info {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 20px;
          padding: 16px;
          background: #F1F0E8;
          border: 1px solid #E5E1DA;
          border-radius: 8px;
        }

        .track-image {
          width: 60px;
          height: 60px;
          border-radius: 6px;
          object-fit: cover;
        }

        .track-details {
          flex: 1;
          min-width: 0;
        }

        .track-name {
          font-size: 16px;
          font-weight: 600;
          color: #89A8B2;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .track-artist {
          font-size: 13px;
          color: #B3C8CF;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .track-counter {
          font-size: 11px;
          color: #B3C8CF;
          font-weight: 500;
        }

        .progress-section {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .time-current,
        .time-total {
          font-family: monospace;
          font-size: 11px;
          color: #B3C8CF;
          min-width: 32px;
        }

        .progress-container {
          flex: 1;
          cursor: pointer;
          padding: 4px 0;
        }

        .progress-track {
          height: 4px;
          background: #E5E1DA;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #89A8B2;
          border-radius: 2px;
          transition: width 0.1s ease;
        }

        .main-controls {
          margin-bottom: 16px;
        }

        .playback-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .control-btn {
          background: #E5E1DA;
          border: none;
          border-radius: 6px;
          color: #89A8B2;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
          min-width: 50px;
        }

        .control-btn:hover {
          background: #B3C8CF;
          color: #F1F0E8;
        }

        .control-btn.secondary {
          background: #F1F0E8;
          color: #B3C8CF;
          padding: 6px 10px;
          font-size: 11px;
          min-width: 60px;
        }

        .control-btn.secondary.active {
          background: #B3C8CF;
          color: #F1F0E8;
          border: 1px solid #89A8B2;
        }

        .control-btn.secondary:hover {
          background: #E5E1DA;
          color: #89A8B2;
        }

        .play-btn {
          background: #89A8B2;
          color: #F1F0E8;
          padding: 10px 16px;
          font-weight: 600;
          font-size: 13px;
          min-width: 70px;
        }

        .play-btn:hover:not(:disabled) {
          background: #B3C8CF;
        }

        .play-btn:disabled {
          background: #E5E1DA;
          color: #B3C8CF;
          cursor: not-allowed;
        }

        .bottom-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .volume-section {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .volume-btn {
          background: none;
          border: none;
          color: #B3C8CF;
          cursor: pointer;
          font-size: 11px;
          padding: 4px 6px;
          min-width: 48px;
          text-align: left;
        }

        .volume-btn:hover {
          color: #89A8B2;
        }

        .volume-slider {
          flex: 1;
          height: 3px;
          background: #E5E1DA;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          -webkit-appearance: none;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: #89A8B2;
          border-radius: 50%;
          cursor: pointer;
        }

        .volume-percent {
          font-size: 10px;
          color: #B3C8CF;
          min-width: 28px;
          text-align: right;
        }

        .speed-section {
          
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .speed-label {
          font-size: 11px;
          color: #B3C8CF;
        }

        .speed-select {
          background: #F1F0E8;
          border: 1px solid #E5E1DA;
          border-radius: 4px;
          color: #89A8B2;
          padding: 3px 6px;
          font-size: 11px;
          cursor: pointer;
        }

        .playlist {
          background: #F1F0E8;
          border: 1px solid #E5E1DA;
          border-radius: 8px;
          margin-bottom: 16px;
          overflow: hidden;
          max-height: 300px;
          display: flex;
          flex-direction: column;
        }

        .playlist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #E5E1DA;
          border-bottom: 1px solid #B3C8CF;
          font-size: 13px;
          font-weight: 600;
          color: #89A8B2;
        }

        .close-btn {
          background: none;
          border: none;
          color: #B3C8CF;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #89A8B2;
        }

        .playlist-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.2s ease;
          border-bottom: 1px solid #E5E1DA;
        }

        .playlist-item:last-child {
          border-bottom: none;
        }

        .playlist-item:hover {
          background: #E5E1DA;
        }

        .playlist-item.active {
          background: #B3C8CF;
          border-left: 3px solid #89A8B2;
        }

        .playlist-track-image {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .playlist-track-info {
          flex: 1;
          min-width: 0;
        }

        .playlist-track-name {
          font-size: 13px;
          font-weight: 500;
          color: #89A8B2;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .playlist-track-artist {
          font-size: 11px;
          color: #B3C8CF;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .playlist-track-duration {
          font-size: 11px;
          color: #B3C8CF;
          font-family: monospace;
          flex-shrink: 0;
        }

        .search-form {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid #E5E1DA;
        }

        .search-input {
          flex: 1;
          border: 1px solid #E5E1DA;
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 12px;
          background: #F1F0E8;
          color: #89A8B2;
        }

        .search-input:focus {
          outline: none;
          border-color: #89A8B2;
        }

        .search-btn {
          background: #89A8B2;
          color: #F1F0E8;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        }

        .search-btn:hover:not(:disabled) {
          background: #B3C8CF;
        }

        .search-btn:disabled {
          background: #E5E1DA;
          color: #B3C8CF;
          cursor: not-allowed;
        }

        .search-results {
          flex: 1;
          overflow-y: auto;
        }

        .playlist-toggle-section {
          text-align: center;
        }

        .playlist-toggle {
          background: #E5E1DA;
          border: none;
          border-radius: 6px;
          color: #89A8B2;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .playlist-toggle:hover {
          background: #B3C8CF;
          color: #F1F0E8;
        }

        @media (max-width: 480px) {
          .music-player {
            max-width: 100%;
            padding: 16px;
          }

          .spotify-user .user-name {
            max-width: 60px;
          }

          .track-info {
            flex-direction: column;
            text-align: center;
          }

          .track-details {
            width: 100%;
          }

          .main-controls {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .control-btn.secondary {
            align-self: center;
          }

          .bottom-controls {
            flex-direction: column;
            gap: 8px;
            align-items: stretch;
          }

          .volume-section,
          .speed-section {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}

export default SpotifyMusicPlayer;