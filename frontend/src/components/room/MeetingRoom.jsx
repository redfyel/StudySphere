import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import ParticipantList from './ParticipantList';
import './MeetingRoom.css';

function MeetingRoom({ roomId }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [localUserId, setLocalUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [joinStatus, setJoinStatus] = useState('entering'); // entering, pending, joined, rejected
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [notes, setNotes] = useState('');
  const [timer, setTimer] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});

  // Get username from storage or prompt user
  useEffect(() => {
    const storedUsername = localStorage.getItem('studyRoomUsername');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      const name = prompt('Enter your name:');
      if (name) {
        setUsername(name);
        localStorage.setItem('studyRoomUsername', name);
      }
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!username) return;

    const newSocket = io('https://studysphere-n4up.onrender.com/', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setSocket(newSocket);
    });

    newSocket.on('user-id-assigned', (userId) => {
      setLocalUserId(userId);
    });

    newSocket.on('room-state', (state) => {
      setRoomData(state.roomInfo);
      setParticipants(state.participants);
      setJoinRequests(state.joinRequests);
      setNotes(state.notes);
      setTimer(state.timer);
      setIsAdmin(state.isAdmin);
      setJoinStatus('joined');
      setHasJoined(true);
    });

    newSocket.on('join-request-pending', () => {
      setJoinStatus('pending');
    });

    newSocket.on('join-approved', () => {
      setJoinStatus('joined');
      setHasJoined(true);
    });

    newSocket.on('join-rejected', () => {
      setJoinStatus('rejected');
      setError('Your join request was rejected by the room admin.');
    });

    newSocket.on('user-connected', (userData) => {
      setParticipants(prev => [...prev.filter(p => p.id !== userData.userId), {
        id: userData.userId,
        name: userData.username,
        isMuted: userData.isMuted,
        isCameraOff: userData.isCameraOff,
        isScreenSharing: userData.isScreenSharing,
        isAdmin: userData.isAdmin
      }]);
    });

    newSocket.on('user-disconnected', (userId) => {
      setParticipants(prev => prev.filter(p => p.id !== userId));
    });

    newSocket.on('new-join-request', (requestData) => {
      setJoinRequests(prev => [...prev, requestData]);
    });

    newSocket.on('update-join-requests', (requests) => {
      setJoinRequests(requests);
    });

    newSocket.on('media-state-changed', ({ userId, isMuted, isCameraOff, isScreenSharing }) => {
      setParticipants(prev => prev.map(p => 
        p.id === userId 
          ? { ...p, isMuted, isCameraOff, isScreenSharing }
          : p
      ));
    });

    newSocket.on('notes-update', (newNotes) => {
      setNotes(newNotes);
    });

    newSocket.on('timer-update', (newTimer) => {
      setTimer(newTimer);
    });

    newSocket.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    newSocket.on('kicked-from-room', () => {
      setError('You have been removed from the room by an admin.');
      setHasJoined(false);
      setJoinStatus('entering');
    });

    newSocket.on('room-deleted', () => {
      setError('This room has been deleted by the admin.');
      setHasJoined(false);
      setJoinStatus('entering');
    });

    newSocket.on('error', (errorData) => {
      setError(errorData.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [username]);

  // Join room when socket and username are ready
  useEffect(() => {
    if (socket && username && roomId && !hasJoined && joinStatus === 'entering') {
      socket.emit('join-room', { roomId, username });
    }
  }, [socket, username, roomId, hasJoined, joinStatus]);

  // Media control functions
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (socket) {
      socket.emit('media-state-update', {
        isMuted: newMuted,
        isCameraOff,
        isScreenSharing
      });
    }
  };

  const toggleCamera = () => {
    const newCameraOff = !isCameraOff;
    setIsCameraOff(newCameraOff);
    if (socket) {
      socket.emit('media-state-update', {
        isMuted,
        isCameraOff: newCameraOff,
        isScreenSharing
      });
    }
  };

  const toggleScreenShare = () => {
    const newScreenSharing = !isScreenSharing;
    setIsScreenSharing(newScreenSharing);
    if (socket) {
      socket.emit('media-state-update', {
        isMuted,
        isCameraOff,
        isScreenSharing: newScreenSharing
      });
      
      if (newScreenSharing) {
        socket.emit('screen-share-start', { roomId });
      } else {
        socket.emit('screen-share-stop', { roomId });
      }
    }
  };

  // Admin functions
  const handleApproveJoinRequest = (userId) => {
    if (socket && isAdmin) {
      socket.emit('join-request-response', {
        roomId,
        userId,
        action: 'approve'
      });
    }
  };

  const handleRejectJoinRequest = (userId) => {
    if (socket && isAdmin) {
      socket.emit('join-request-response', {
        roomId,
        userId,
        action: 'reject'
      });
    }
  };

  const handleKickParticipant = (participantId) => {
    if (socket && isAdmin) {
      socket.emit('kick-participant', {
        roomId,
        participantId
      });
    }
  };

  // Notes and timer functions
  const handleNotesUpdate = (newNotes) => {
    setNotes(newNotes);
    if (socket && isAdmin) {
      socket.emit('notes-update', { roomId, notes: newNotes });
    }
  };

  const handleTimerUpdate = (newTimer) => {
    setTimer(newTimer);
    if (socket && isAdmin) {
      socket.emit('timer-update', { roomId, timer: newTimer });
    }
  };

  // Chat functions
  const sendMessage = () => {
    if (newMessage.trim() && socket) {
      socket.emit('chat-message', {
        roomId,
        message: newMessage.trim()
      });
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Leave room
  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave-room');
      socket.disconnect();
    }
    window.location.href = '/';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isConnected) {
    return (
      <div className="meeting-room loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Connecting to room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meeting-room error">
        <div className="error-container">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.href = '/'}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (joinStatus === 'pending') {
    return (
      <div className="meeting-room pending">
        <div className="pending-container">
          <h2>⏳ Waiting for Approval</h2>
          <p>The room admin needs to approve your join request.</p>
          <div className="pending-spinner">
            <div className="spinner"></div>
          </div>
          <button onClick={leaveRoom}>Cancel</button>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="meeting-room loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Joining room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-room">
      <header className="room-header">
        <div className="room-info">
          <h1>{roomData?.name || 'Study Room'}</h1>
          {roomData?.topic && <span className="room-topic">📚 {roomData.topic}</span>}
          {isAdmin && <span className="admin-indicator">👑 Admin</span>}
        </div>
        <div className="room-actions">
          <button className="leave-btn" onClick={leaveRoom}>
            Leave Room
          </button>
        </div>
      </header>

      <div className="room-content">
        <div className="main-content">
          {/* Video Grid */}
          <div className="video-grid">
            <div className="video-container local">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={isCameraOff ? 'camera-off' : ''}
              />
              <div className="video-overlay">
                <span className="participant-name">You</span>
                <div className="video-controls">
                  {isMuted && <span className="muted-indicator">🔇</span>}
                  {isCameraOff && <span className="camera-off-indicator">📷</span>}
                  {isScreenSharing && <span className="screen-share-indicator">🖥️</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="meeting-controls">
            <button
              className={`control-btn ${isMuted ? 'active' : ''}`}
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>
            
            <button
              className={`control-btn ${isCameraOff ? 'active' : ''}`}
              onClick={toggleCamera}
              title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isCameraOff ? '📷' : '📹'}
            </button>
            
            <button
              className={`control-btn ${isScreenSharing ? 'active' : ''}`}
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              🖥️
            </button>
            
            <button
              className={`control-btn ${showChat ? 'active' : ''}`}
              onClick={() => setShowChat(!showChat)}
              title="Toggle chat"
            >
              💬
            </button>
          </div>
        </div>

        <div className="sidebar">
          <ParticipantList
            participants={participants}
            localUserId={localUserId}
            joinRequests={joinRequests}
            isAdmin={isAdmin}
            onApproveJoinRequest={handleApproveJoinRequest}
            onRejectJoinRequest={handleRejectJoinRequest}
            onKickParticipant={handleKickParticipant}
          />

          {/* Study Tools */}
          <div className="study-tools">
            <h3>📝 Study Tools</h3>
            
            {/* Timer */}
            <div className="tool-section">
              <h4>⏱️ Study Timer</h4>
              <div className="timer-display">{formatTime(timer)}</div>
              {isAdmin && (
                <div className="timer-controls">
                  <button onClick={() => handleTimerUpdate(timer + 60)}>+1min</button>
                  <button onClick={() => handleTimerUpdate(timer + 300)}>+5min</button>
                  <button onClick={() => handleTimerUpdate(0)}>Reset</button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="tool-section">
              <h4>📓 Shared Notes</h4>
              <textarea
                value={notes}
                onChange={(e) => handleNotesUpdate(e.target.value)}
                placeholder={isAdmin ? "Add shared notes..." : "Only admin can edit notes"}
                disabled={!isAdmin}
                rows={6}
                className="notes-textarea"
              />
            </div>
          </div>

          {/* Chat */}
          {showChat && (
            <div className="chat-section">
              <h3>💬 Chat</h3>
              <div className="chat-messages">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="chat-message">
                    <strong>{msg.username}: </strong>
                    {msg.message}
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MeetingRoom;