import React, { useState, useRef, useEffect } from 'react';

function MusicPlayer() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5); // Default volume
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const tracks = [
    { name: 'Calm Piano', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, // Placeholder
    { name: 'Ambient Study', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }, // Placeholder
    { name: 'Focus Beats', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }, // Placeholder
  ];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => console.error("Error playing audio:", error));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleTrackChange = (e) => {
    setCurrentTrackIndex(parseInt(e.target.value, 10));
    setIsPlaying(false); // Pause when changing track
  };

  const handleEnded = () => {
    // Play next track or loop current
    const nextTrackIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextTrackIndex);
    // Automatically play next track
    setIsPlaying(true);
    audioRef.current.play().catch(error => console.error("Error playing audio:", error));
  };

  return (
    <div className="music-player">
      <h3>Study Music</h3>
      <audio
        ref={audioRef}
        src={tracks[currentTrackIndex].src}
        onEnded={handleEnded}
        loop={false} // We'll handle looping/next track manually
      />
      <div className="player-controls">
        <button onClick={togglePlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <select value={currentTrackIndex} onChange={handleTrackChange}>
          {tracks.map((track, index) => (
            <option key={index} value={index}>
              {track.name}
            </option>
          ))}
        </select>
      </div>
      <div className="volume-control">
        <span>Volume:</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
        />
      </div>
    </div>
  );
}

export default MusicPlayer;
