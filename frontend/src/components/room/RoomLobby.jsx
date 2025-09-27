import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/UserLoginContext'; // Assuming you have an AuthContext
import './RoomLobby.css'; // Add basic styling

function RoomLobby() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Assuming you get the user object from context

  // State for user preferences
  const [displayName, setDisplayName] = useState(user?.username || '');
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const videoRef = useRef(null);

  // 1. Get user media for preview
  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoOn ? { width: 320, height: 240 } : false,
          audio: isAudioOn,
        });
        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Failed to get media:', err);
        // Handle error: e.g., show a message to the user
        setLocalStream(null);
      }
    };

    getMedia();

    // Cleanup: stop tracks when component unmounts
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoOn, isAudioOn]); // Re-run when toggles change

  // 2. Handle final join
  const handleFinalJoin = () => {
    if (!displayName.trim()) {
      alert('Please enter a display name.');
      return;
    }

    // Stop local media preview to avoid conflicts with the main VideoCall component
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Redirect to the actual room, passing media preferences as URL query parameters
    navigate(
      `/room/${roomId}?name=${encodeURIComponent(displayName)}&audio=${isAudioOn}&video=${isVideoOn}`
    );
  };

  // 3. Media Toggle Handlers
  const handleAudioToggle = () => {
    setIsAudioOn(prev => !prev);
  };

  const handleVideoToggle = () => {
    setIsVideoOn(prev => !prev);
  };

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <h2>Prepare to Join Room: {roomId}</h2>
        <p>Set your preferences before entering the session.</p>

        {/* Video Preview Area */}
        <div className="video-preview-box">
          {isVideoOn && localStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={true} // Mute local preview
              className="local-preview"
            />
          ) : (
            <div className="video-placeholder">
              <span className="material-icons">
                {isVideoOn ? 'videocam_off' : 'no_photography'}
              </span>
              Video Off
            </div>
          )}
        </div>

        {/* Display Name Input */}
        <div className="form-group">
          <label htmlFor="displayName">Display Name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your Name"
            maxLength="20"
            required
          />
        </div>

        {/* Media Controls (Toggle Tools) */}
        <div className="media-controls">
          <button
            className={`media-toggle-btn ${isAudioOn ? 'on' : 'off'}`}
            onClick={handleAudioToggle}
          >
            <span className="material-icons">
              {isAudioOn ? 'mic' : 'mic_off'}
            </span>
            Audio
          </button>
          <button
            className={`media-toggle-btn ${isVideoOn ? 'on' : 'off'}`}
            onClick={handleVideoToggle}
          >
            <span className="material-icons">
              {isVideoOn ? 'videocam' : 'videocam_off'}
            </span>
            Video
          </button>
        </div>

        {/* Join Button */}
        <button className="join-session-btn" onClick={handleFinalJoin}>
          <span className="material-icons">call</span>
          Join Session
        </button>
      </div>
    </div>
  );
}

export default RoomLobby;