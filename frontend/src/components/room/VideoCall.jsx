import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import FloatingToolbar from './FloatingToolbar';
import MusicPlayer from './MusicPlayer';
import Timer from './Timer';
import Notes from './Notes'; // Re-import Notes for floating panel
// StudyTargets, ParticipantList, JoinRequests are removed from direct render for this UI style
// import StudyTargets from './StudyTargets';
// import ParticipantList from './ParticipantList';
// import JoinRequests from './JoinRequests';
import './VideoCall.css';

// Predefined background images
const BACKGROUND_IMAGES = [
  { name: 'Library View', url: 'https://images.unsplash.com/photo-1522204523234-8729aa607dc7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { name: 'Cozy Cafe', url: 'https://tse2.mm.bing.net/th/id/OIP.9gJhM-SjMV1Br2QhqpLM3AHaEo?pid=Api&P=0&h=180' },
  { name: 'Mountain View', url: 'https://tse2.mm.bing.net/th/id/OIP._PWT_U9pKLrJuamO2WeLqgHaEo?pid=Api&P=0&h=180' },
  { name: 'Forest Path', url: 'https://tse4.mm.bing.net/th/id/OIP.DZe4t3g9XPLF9L5Bk6cpygHaEK?pid=Api&P=0&h=180' },
  { name: 'Abstract Art', url: 'https://tse4.mm.bing.net/th/id/OIP.Y-KLVE4OMHZDsVw4Kj22XwHaEo?pid=Api&P=0&h=180' },
];

// --- VideoCall Component ---
function VideoCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [localUserId, setLocalUserId] = useState(null);
  const latestLocalUserId = useRef(localUserId); // Ref to keep localUserId current in closures
  const [localUsername, setLocalUsername] = useState(localStorage.getItem('studyRoomUsername') || '');
  const [showUsernameModal, setShowUsernameModal] = useState(!localUsername);

  const [participants, setParticipants] = useState([]); // List of { id, name }
  const [localStream, setLocalStream] = useState(null); // This will hold either camera or screen share
  const [remoteStreams, setRemoteStreams] = useState({}); // userId -> MediaStream
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [notes, setNotes] = useState('');
  const [timer, setTimer] = useState(0);
  const [targets, setTargets] = useState([]); // Kept for persistence, not rendered
  const [joinRequests, setJoinRequests] = useState([]); // Kept for persistence, not rendered
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUND_IMAGES[0].url); // Default background

  // New state for toggling visibility of overlay panels
  const [showNotesPanel, setShowNotesPanel] = useState(true);
  const [showTimerPanel, setShowTimerPanel] = useState(true);
  const [showMusicPlayer, setShowMusicPlayer] = useState(true);

  const localVideoRef = useRef(null); // For local camera/screen share in grid/main view
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({}); // userId -> RTCPeerConnection

  // Use refs for stable function identities that depend on mutable state (like localStream)
  const createPeerConnectionRef = useRef();
  const handleSignalRef = useRef();

  // Update latestLocalUserId ref whenever localUserId state changes
  useEffect(() => {
    latestLocalUserId.current = localUserId;
  }, [localUserId]);

  // Helper to get a user-friendly name
  const getUserDisplayName = useCallback((userId) => {
    if (userId === latestLocalUserId.current) return `${localUsername} (You)`; // Use ref here
    const participant = participants.find(p => p.id === userId);
    return participant ? participant.name : `Guest ${userId ? userId.slice(-4) : 'Unknown'}`;
  }, [localUsername, participants]);

  // --- WebRTC Setup: Define createPeerConnection and update its ref ---
  useEffect(() => {
    createPeerConnectionRef.current = (remoteUserId) => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], // Public STUN server
      });

      // Add local stream tracks if available
      if (localStream) {
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
      }

      peerConnection.ontrack = (event) => {
        console.log(`Received remote track from ${remoteUserId}`);
        setRemoteStreams(prev => ({
          ...prev,
          [remoteUserId]: event.streams[0],
        }));
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('signal', {
            targetUserId: remoteUserId,
            signal: { candidate: event.candidate },
          });
        }
      };

      peerConnection.onnegotiationneeded = async () => {
        try {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socketRef.current.emit('signal', {
            targetUserId: remoteUserId,
            signal: { sdp: peerConnection.localDescription },
          });
        } catch (err) {
          console.error('Error creating offer:', err);
        }
      };

      peerConnectionsRef.current[remoteUserId] = peerConnection;
      return peerConnection;
    };
  }, [localStream]);

  // --- WebRTC Setup: Define handleSignal and update its ref ---
  useEffect(() => {
    handleSignalRef.current = async (senderUserId, signal) => {
      if (!localStream) {
        console.warn('Local stream not available, deferring signal handling.');
        return;
      }

      let peerConnection = peerConnectionsRef.current[senderUserId];
      if (!peerConnection) {
        peerConnection = createPeerConnectionRef.current(senderUserId);
      }

      try {
        if (signal.sdp) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          if (signal.sdp.type === 'offer') {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socketRef.current.emit('signal', {
              targetUserId: senderUserId,
              signal: { sdp: peerConnection.localDescription },
            });
          }
        } else if (signal.candidate) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
          console.error('Error handling signal:', err);
      }
    };
  }, [localStream]);

  // --- Get Local Media Stream ---
  useEffect(() => {
    if (!localUsername || showUsernameModal) return;

    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing media devices.', err);
        alert('Could not access camera/microphone. Please ensure permissions are granted.');
      }
    };

    getMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localUsername, showUsernameModal]);

  // --- Socket Setup and Listeners ---
  useEffect(() => {
    if (!localUsername || showUsernameModal) {
      return;
    }

    socketRef.current = io('http://localhost:3001');

    socketRef.current.on('user-id-assigned', (assignedUserId) => {
      console.log('Connected to signaling server, assigned userId:', assignedUserId);
      setLocalUserId(assignedUserId);
      socketRef.current.emit('join-room', { roomId, username: localUsername });
    });

    socketRef.current.on('room-state', ({ notes: initialNotes, timer: initialTimer, targets: initialTargets, participants: initialParticipants, joinRequests: initialJoinRequests, localUserId: assignedUserId }) => {
      setNotes(initialNotes);
      setTimer(initialTimer);
      setTargets(initialTargets);
      setParticipants(initialParticipants);
      setJoinRequests(initialJoinRequests);
      console.log('Received initial room state:', { initialNotes, initialTimer, initialTargets, initialParticipants, initialJoinRequests, assignedUserId });

      initialParticipants.forEach(p => {
        if (p.id !== assignedUserId) {
          createPeerConnectionRef.current(p.id);
        }
      });
    });

    socketRef.current.on('user-connected', ({ userId, username }) => {
      console.log(`User ${username} (${userId}) connected`);
      setParticipants(prev => {
        if (!prev.some(p => p.id === userId)) {
          return [...prev, { id: userId, name: username }];
        }
        return prev;
      });
      if (userId !== latestLocalUserId.current) {
        createPeerConnectionRef.current(userId);
      }
    });

    socketRef.current.on('user-disconnected', (userId) => {
      console.log(`User ${userId} disconnected`);
      setParticipants(prev => prev.filter(p => p.id !== userId));
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[userId];
        return newStreams;
      });
      if (peerConnectionsRef.current[userId]) {
        peerConnectionsRef.current[userId].close();
        delete peerConnectionsRef.current[userId];
      }
    });

    socketRef.current.on('signal', ({ userId, signal }) => {
      handleSignalRef.current(userId, signal);
    });

    socketRef.current.on('notes-update', (newNotes) => setNotes(newNotes));
    socketRef.current.on('timer-update', (newTimer) => setTimer(newTimer));
    socketRef.current.on('targets-update', (newTargets) => setTargets(newTargets));
    socketRef.current.on('new-join-request', (request) => {
      setJoinRequests(prev => [...prev, request]);
    });
    socketRef.current.on('update-join-requests', (updatedRequests) => {
      setJoinRequests(updatedRequests);
    });
    socketRef.current.on('join-approved', (approvedRoomId) => {
      console.log(`You were approved to join room ${approvedRoomId}`);
    });
    socketRef.current.on('join-rejected', (rejectedRoomId) => {
      alert(`Your request to join room ${rejectedRoomId} was rejected.`);
      navigate('/');
    });
    socketRef.current.on('room-not-found', () => {
      alert('Room not found!');
      navigate('/');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      peerConnectionsRef.current = {};
    };
  }, [roomId, localUsername, showUsernameModal, navigate]);

  // --- Update Peer Connection Tracks when localStream changes (e.g., screen share) ---
  useEffect(() => {
    if (localStream) {
      Object.values(peerConnectionsRef.current).forEach(pc => {
        pc.getSenders().forEach(sender => {
          if (sender.track) {
            const newTrack = localStream.getTracks().find(track => track.kind === sender.track.kind);
            if (newTrack) {
              sender.replaceTrack(newTrack);
            } else {
              sender.replaceTrack(null);
            }
          }
        });
      });
    }
  }, [localStream]);


  // --- Toolbar Controls ---
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing, switch back to camera
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(newStream);
        // Local camera goes into the grid
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }
        setIsScreenSharing(false);
      } catch (err) {
        console.error('Error switching back to camera:', err);
      }
    } else {
      // Start screen sharing
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setLocalStream(screenStream);
        // Screen share goes to the main video ref
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare(); // Automatically stop screen sharing if user stops it from browser UI
        };
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    }
  };

  const handleBackgroundChange = (newBackgroundUrl) => {
    setSelectedBackground(newBackgroundUrl === 'none' ? null : newBackgroundUrl);
  };

  // --- Collaborative Tool Handlers ---
  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    socketRef.current.emit('notes-update', { roomId, notes: newNotes });
  };

  const handleTimerChange = (newTimer) => {
    setTimer(newTimer);
    socketRef.current.emit('timer-update', { roomId, timer: newTimer });
  };

  // These are kept for backend persistence but not directly rendered in this UI
  const handleTargetsChange = (newTargets) => {
    setTargets(newTargets);
    socketRef.current.emit('targets-update', { roomId, targets: newTargets });
  };

  const handleJoinRequestResponse = (requesterId, action) => {
    setJoinRequests(prev => prev.filter(req => req.userId !== requesterId)); // Optimistic update
    socketRef.current.emit('join-request-response', { roomId, userId: requesterId, action });
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (localUsername.trim()) {
      localStorage.setItem('studyRoomUsername', localUsername.trim());
      setShowUsernameModal(false);
      window.location.reload();
    }
  };

  if (showUsernameModal) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Enter Your Username</h2>
          <form onSubmit={handleUsernameSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                value={localUsername}
                onChange={(e) => setLocalUsername(e.target.value)}
                placeholder="e.g., JohnDoe"
                required
              />
            </div>
            <div className="modal-actions">
              <button type="submit">Continue</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Combine local and remote participants for the grid
  const allVideoParticipants = [
    ...(localUserId && localStream && !isScreenSharing ? [{ id: localUserId, name: localUsername, stream: localStream, isLocal: true }] : []),
    ...participants.filter(p => p.id !== localUserId).map(p => ({ ...p, stream: remoteStreams[p.id], isLocal: false }))
  ];

  return (
    <div className="video-call">
      <div
        className="top-study-area"
        style={{ backgroundImage: selectedBackground ? `url(${selectedBackground})` : 'none' }}
      >
        {isScreenSharing && localStream ? (
          <div className="main-screen-share-wrapper">
            <video ref={localVideoRef} autoPlay playsInline muted={true} />
            <div className="video-label">{getUserDisplayName(localUserId)} (Screen Share)</div>
          </div>
        ) : (
          <div className="main-background-placeholder">
            <p>Welcome to your study session!</p>
          </div>
        )}

        {/* Overlay Widgets */}
        <div className="overlay-widgets">
          {showMusicPlayer && (
            <div className="music-player-overlay">
              <MusicPlayer />
            </div>
          )}
          {showTimerPanel && (
            <div className="timer-overlay">
              <Timer timer={timer} onTimerChange={handleTimerChange} />
            </div>
          )}
          {showNotesPanel && (
            <div className="notes-overlay">
              <Notes notes={notes} onNotesChange={handleNotesChange} />
            </div>
          )}
        </div>
      </div>

      <div className="participant-video-grid">
        {/* Local User's Camera Feed (if not screen sharing) */}
        {localUserId && localStream && !isScreenSharing && (
          <div className="video-wrapper local-video-grid-item">
            <video ref={localVideoRef} autoPlay playsInline muted={true} />
            <div className="video-label">{getUserDisplayName(localUserId)}</div>
          </div>
        )}

        {/* Remote Participants */}
        {participants.filter(p => p.id !== localUserId).map(p => (
          <div key={p.id} className="video-wrapper">
            {remoteStreams[p.id] ? (
              <video autoPlay playsInline srcObject={remoteStreams[p.id]} />
            ) : (
              <div className="video-wrapper placeholder">
                <div className="video-label">{getUserDisplayName(p.id)} (Connecting...)</div>
              </div>
            )}
            <div className="video-label">{getUserDisplayName(p.id)}</div>
          </div>
        ))}
      </div>

      <FloatingToolbar
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        backgroundImages={BACKGROUND_IMAGES}
        selectedBackground={selectedBackground}
        onSelectBackground={handleBackgroundChange}
        onToggleNotes={() => setShowNotesPanel(prev => !prev)}
        onToggleTimer={() => setShowTimerPanel(prev => !prev)}
        onToggleMusicPlayer={() => setShowMusicPlayer(prev => !prev)}
      />
    </div>
  );
}

export default VideoCall;
