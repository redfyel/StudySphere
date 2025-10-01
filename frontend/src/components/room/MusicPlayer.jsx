import React, { useState, useRef, useEffect, useCallback } from 'react';

function MusicPlayer() {
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
    
    // --- SIMPLE DEMO TRACKS ---
    const demoTracks = [
        { 
            id: 'demo1',
            name: 'Calm Piano Study', 
            artist: 'Focus Ambience',
            src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            image: 'https://via.placeholder.com/60/89A8B2/F1F0E8?text=P1'
        },
        { 
            id: 'demo2',
            name: 'Ambient Relax', 
            artist: 'Quiet Minds',
            src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            image: 'https://via.placeholder.com/60/B3C8CF/F1F0E8?text=A2'
        },
        { 
            id: 'demo3',
            name: 'Lo-fi Productivity', 
            artist: 'Beat Flow',
            src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
            image: 'https://via.placeholder.com/60/E5E1DA/89A8B2?text=L3'
        },
    ];

    const currentTracks = demoTracks;

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
            // Auto-play the first track upon load if a song is selected and the user initiated playback previously
            if (isPlaying && audioRef.current.paused) {
                 audioRef.current.play().catch(err => {
                    if (err.name === 'NotAllowedError') {
                        // Suppress autoplay error, user needs to click play
                    } else {
                        console.error('Autoplay error:', err);
                        setError('Autoplay blocked. Tap play button.');
                        setIsPlaying(false);
                    }
                 });
            }
        }
    }, [isPlaying]);

    // Error handler
    const handleError = useCallback(() => {
        setIsLoading(false);
        setIsPlaying(false);
        setError('Failed to load audio track');
    }, []);

    // Audio event listeners setup
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            // Re-initialize volume on load
            audio.volume = isMuted ? 0 : volume;
            
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
    }, [handleTimeUpdate, handleLoadedMetadata, handleError, volume, isMuted]);
    
    // Auto-play logic when track index changes
    useEffect(() => {
        // Only trigger manual play/load if a track exists
        if (currentTracks.length > 0) {
            audioRef.current.src = currentTracks[currentTrackIndex].src;
            audioRef.current.load();
            setCurrentTime(0);
            
            // Only attempt to play if it was already playing
            if (isPlaying) {
                setIsLoading(true);
                audioRef.current.play().catch(err => {
                    console.error("Manual play error:", err);
                    setError('Autoplay blocked. Tap play button.');
                    setIsPlaying(false);
                    setIsLoading(false);
                });
            }
        }
    }, [currentTrackIndex]);


    const togglePlayPause = async () => {
        if (!audioRef.current || isLoading) return;
        
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
            setError('Unable to play audio. Check browser autoplay settings.');
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
            setVolume(previousVolume > 0.05 ? previousVolume : 0.7); // Restore previous volume
        } else {
            setPreviousVolume(volume > 0.05 ? volume : 0.7);
            setIsMuted(true);
            setVolume(0);
        }
    };

    const changeTrack = (newIndex) => {
        if (newIndex >= 0 && newIndex < currentTracks.length) {
            setCurrentTrackIndex(newIndex);
            // Playing state is handled by the useEffect on currentTrackIndex change
        }
    };

    const nextTrack = () => {
        let nextIndex;
        if (isShuffled) {
            // Generate a random index, ensuring it's not the same as current unless only one track exists
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * currentTracks.length);
            } while (newIndex === currentTrackIndex && currentTracks.length > 1);
            nextIndex = newIndex;
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
        if (!audioRef.current || !progressRef.current || isNaN(duration) || duration === 0) return;
        
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
        } else if (isRepeatAll) {
            nextTrack();
        } else {
            // Stop playing if neither repeat mode is active
            setIsPlaying(false);
        }
    };

    const formatTime = (time) => {
        if (isNaN(time) || time < 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const currentTrack = currentTracks[currentTrackIndex];

    const toggleRepeatMode = () => {
        if (isRepeatAll) {
            setIsRepeatAll(false);
            setIsRepeatOne(true);
        } else if (isRepeatOne) {
            setIsRepeatOne(false);
            setIsRepeatAll(false);
        } else {
            setIsRepeatAll(true);
            setIsRepeatOne(false);
        }
    };

    return (
        <div className="music-player">
            <audio
                ref={audioRef}
                src={currentTrack?.src}
                onEnded={handleEnded}
                preload="metadata"
            />
            
            <div className="player-header">
                <div className="app-title">Study Music</div>
                {error && <div className="error-message">{error}</div>}
            </div>

            {/* Current Track Info */}
            {currentTrack && (
                <>
                    <div className="track-info">
                        <img 
                            src={currentTrack.image} 
                            alt="Album cover" 
                            className="track-image"
                        />
                        <div className="track-details">
                            <div className="track-name">{currentTrack.name}</div>
                            <div className="track-artist">{currentTrack.artist}</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
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

                    {/* Main Playback Controls */}
                    <div className="main-controls">
                        
                        <button 
                            onClick={() => setIsShuffled(!isShuffled)}
                            className={`control-btn secondary shuffle-btn ${isShuffled ? 'active' : ''}`}
                            title="Shuffle"
                        >
                            <span className="material-icons-round">shuffle</span>
                        </button>
                        
                        <button onClick={prevTrack} className="control-btn nav-btn">
                            <span className="material-icons-round">skip_previous</span>
                        </button>
                        
                        <button 
                            onClick={togglePlayPause} 
                            className="play-btn"
                            disabled={isLoading}
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            <span className="material-icons-round large-icon">
                                {isLoading ? 'hourglass_bottom' : (isPlaying ? 'pause' : 'play_arrow')}
                            </span>
                        </button>
                        
                        <button onClick={nextTrack} className="control-btn nav-btn">
                            <span className="material-icons-round">skip_next</span>
                        </button>
                        
                        <button 
                            onClick={toggleRepeatMode}
                            className={`control-btn secondary repeat-btn ${isRepeatOne || isRepeatAll ? 'active' : ''}`}
                            title={isRepeatOne ? 'Repeat One' : isRepeatAll ? 'Repeat All' : 'No Repeat'}
                        >
                            <span className="material-icons-round">
                                {isRepeatOne ? 'repeat_one' : 'repeat'}
                            </span>
                        </button>
                        
                    </div>

                    {/* Volume and Speed Controls */}
                    <div className="bottom-controls">
                        <div className="volume-section">
                            <button onClick={toggleMute} className="volume-btn" title={isMuted ? 'Unmute' : 'Mute'}>
                                <span className="material-icons-round">
                                    {isMuted || volume === 0 ? 'volume_off' : volume > 0.5 ? 'volume_up' : 'volume_down'}
                                </span>
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
                        </div>

                        <div className="speed-section">
                            <label className="speed-label" htmlFor="speed-select">Speed:</label>
                            <select 
                                id="speed-select"
                                value={playbackRate} 
                                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                                className="speed-select"
                            >
                                <option value="0.5">0.5x</option>
                                <option value="0.75">0.75x</option>
                                <option value="1">1.0x</option>
                                <option value="1.25">1.25x</option>
                                <option value="1.5">1.5x</option>
                                <option value="2">2.0x</option>
                            </select>
                        </div>
                    </div>
                </>
            )}

            {/* Playlist View */}
            <div className="playlist-toggle-section">
                <button 
                    className="playlist-toggle"
                    onClick={() => setShowPlaylist(!showPlaylist)}
                >
                    {showPlaylist ? 'Hide Playlist' : 'Show Playlist'}
                </button>
            </div>

            {showPlaylist && (
                <div className="playlist-view">
                    <h4 className="playlist-title">Demo Tracks</h4>
                    {currentTracks.map((track, index) => (
                        <div
                            key={track.id || index}
                            className={`playlist-item ${index === currentTrackIndex ? 'active' : ''}`}
                            onClick={() => changeTrack(index)}
                        >
                            <div className="playlist-track-info">
                                <div className="playlist-track-name">{track.name}</div>
                                <div className="playlist-track-artist">{track.artist}</div>
                            </div>
                            <span className="material-icons-round play-indicator">
                                {index === currentTrackIndex && isPlaying ? 'volume_up' : (index === currentTrackIndex ? 'music_note' : 'play_circle')}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
                
                :root {
                    --bg-light: #F1F0E8;
                    --bg-medium: #E5E1DA;
                    --primary-color: #89A8B2;
                    --accent-color: #B3C8CF;
                    --text-dark: #1F2937;
                    --danger-color: #EF4444;
                }

                .music-player {
                    width: 100%;
                    max-width: 320px;
                    margin: 0 auto;
                    padding: 20px;
                    background: var(--bg-light);
                    border: 1px solid var(--bg-medium);
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(137, 168, 178, 0.1);
                    color: var(--primary-color);
                    font-family: sans-serif;
                    display: flex;
                    flex-direction: column;
                }

                .player-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .app-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--primary-color);
                }

                .error-message {
                    background: var(--bg-medium);
                    border: 1px solid var(--danger-color);
                    border-radius: 6px;
                    color: var(--danger-color);
                    padding: 8px;
                    margin-bottom: 16px;
                    font-size: 12px;
                    text-align: center;
                }

                .track-info {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    margin-bottom: 20px;
                    padding: 10px;
                }

                .track-image {
                    width: 60px;
                    height: 60px;
                    border-radius: 6px;
                    object-fit: cover;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }

                .track-details {
                    flex: 1;
                    min-width: 0;
                }

                .track-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--primary-color);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .track-artist {
                    font-size: 12px;
                    color: var(--accent-color);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .progress-section {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 20px;
                }

                .time-current,
                .time-total {
                    font-family: monospace;
                    font-size: 11px;
                    color: var(--accent-color);
                    min-width: 28px;
                    text-align: center;
                }

                .progress-container {
                    flex: 1;
                    cursor: pointer;
                    padding: 4px 0;
                }

                .progress-track {
                    height: 4px;
                    background: var(--bg-medium);
                    border-radius: 2px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: var(--primary-color);
                    border-radius: 2px;
                    transition: width 0.1s linear;
                }

                .main-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                
                .control-btn {
                    background: var(--bg-medium);
                    border: none;
                    border-radius: 50%;
                    color: var(--primary-color);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 10px;
                }

                .nav-btn {
                    width: 40px;
                    height: 40px;
                }

                .control-btn:hover:not(:disabled) {
                    background: var(--accent-color);
                    color: var(--bg-light);
                }

                .control-btn.secondary {
                    background: transparent;
                    color: var(--accent-color);
                }
                
                .control-btn.secondary.active {
                    color: var(--primary-color);
                }

                .play-btn {
                    background: var(--primary-color);
                    color: var(--bg-light);
                    width: 55px;
                    height: 55px;
                    border-radius: 50%;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    transition: background 0.2s;
                }

                .play-btn:hover:not(:disabled) {
                    background: var(--accent-color);
                }

                .play-btn:disabled {
                    background: var(--bg-medium);
                    color: var(--primary-color);
                    cursor: not-allowed;
                }

                .large-icon {
                    font-size: 32px !important;
                }

                .material-icons-round {
                    font-size: 20px;
                }

                .bottom-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
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
                    color: var(--accent-color);
                    cursor: pointer;
                    padding: 4px;
                    min-width: 24px;
                    height: 24px;
                }

                .volume-btn:hover {
                    color: var(--primary-color);
                }

                .volume-slider {
                    flex: 1;
                    height: 4px;
                    background: var(--bg-medium);
                    border-radius: 2px;
                    outline: none;
                    cursor: pointer;
                    -webkit-appearance: none;
                }
                .volume-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 12px;
                    height: 12px;
                    background: var(--primary-color);
                    border-radius: 50%;
                    cursor: pointer;
                }

                .speed-section {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .speed-label {
                    font-size: 12px;
                    color: var(--accent-color);
                }

                .speed-select {
                    background: var(--bg-medium);
                    border: 1px solid var(--accent-color);
                    border-radius: 4px;
                    color: var(--primary-color);
                    padding: 3px 6px;
                    font-size: 11px;
                    cursor: pointer;
                }

                .playlist-toggle-section {
                    text-align: center;
                    margin-top: 16px;
                }

                .playlist-toggle {
                    background: var(--bg-medium);
                    border: none;
                    border-radius: 6px;
                    color: var(--primary-color);
                    padding: 8px 16px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }

                .playlist-toggle:hover {
                    background: var(--accent-color);
                    color: var(--bg-light);
                }

                .playlist-view {
                    margin-top: 20px;
                    padding-top: 10px;
                    border-top: 1px solid var(--bg-medium);
                }
                
                .playlist-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--accent-color);
                    margin-bottom: 10px;
                }

                .playlist-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 0;
                    cursor: pointer;
                    transition: background 0.2s ease;
                    border-bottom: 1px solid rgba(179, 200, 207, 0.1);
                }

                .playlist-item:hover {
                    background: var(--bg-medium);
                    border-radius: 4px;
                }

                .playlist-item.active {
                    background: var(--accent-color);
                    border-radius: 4px;
                }
                
                .playlist-item.active .playlist-track-name,
                .playlist-item.active .playlist-track-artist {
                    color: var(--bg-light);
                }

                .playlist-track-info {
                    flex: 1;
                    min-width: 0;
                    padding: 0 8px;
                }

                .play-indicator {
                    font-size: 18px;
                    color: var(--accent-color);
                    padding-right: 8px;
                }
                
                .playlist-item.active .play-indicator {
                    color: var(--bg-light);
                }
                
                /* Mobile Responsiveness (Ensures it fits well in the small sidebar panel) */
                @media (max-width: 480px) {
                    .music-player {
                        padding: 12px;
                    }
                    
                    .track-info {
                        padding: 0;
                        gap: 8px;
                    }

                    .track-image {
                        width: 50px;
                        height: 50px;
                    }

                    .track-name {
                        font-size: 13px;
                    }

                    .track-artist {
                        font-size: 11px;
                    }
                    
                    .main-controls {
                        gap: 4px;
                        justify-content: space-around;
                    }
                    
                    .play-btn {
                        width: 50px;
                        height: 50px;
                    }
                    
                    .large-icon {
                        font-size: 28px !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default MusicPlayer;