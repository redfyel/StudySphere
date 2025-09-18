import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import FloatingToolbar from './FloatingToolbar';
import Notes from './Notes';
import Timer from './Timer';
import StudyTargets from './StudyTargets';
import ParticipantList from './ParticipantList';
import JoinRequests from './JoinRequests';

// --- VideoCall Component ---
function VideoCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [localUserId, setLocalUserId] = useState(null);
  const [localUsername, setLocalUsername] = useState(localStorage.getItem('studyRoomUsername') || '');
  const [showUsernameModal, setShowUsernameModal] = useState(!localUsername);

  const [participants, setParticipants] = useState([]); // List of { id, name }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // userId -> MediaStream
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [notes, setNotes] = useState('');
  const [timer, setTimer] = useState(0);
  const [targets, setTargets] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]); // { userId, username }
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({}); // userId -> RTCPeerConnection

  // Use refs for stable function identities that depend on mutable state (like localStream)
  const createPeerConnectionRef = useRef();
  const handleSignalRef = useRef();

  // Helper to get a user-friendly name
  const getUserDisplayName = useCallback((userId) => {
    if (userId === localUserId) return `${localUsername} (You)`;
    const participant = participants.find(p => p.id === userId);
    return participant ? participant.name : `Guest ${userId ? userId.slice(-4) : 'Unknown'}`;
  }, [localUserId, localUsername, participants]);

  // --- WebRTC Setup: Define createPeerConnection and update its ref ---
  useEffect(() => {
    createPeerConnectionRef.current = (remoteUserId) => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], // Public STUN server
        // In production, you would also include TURN servers here:
        // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'password' }
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
  }, [localStream]); // This effect re-runs only when localStream changes, updating the ref

  // --- WebRTC Setup: Define handleSignal and update its ref ---
  useEffect(() => {
    handleSignalRef.current = async (senderUserId, signal) => {
      // If localStream is not yet available, we can't process signals that require adding tracks.
      if (!localStream) {
        console.warn('Local stream not available, deferring signal handling.');
        return;
      }

      let peerConnection = peerConnectionsRef.current[senderUserId];
      if (!peerConnection) {
        // Use the ref to call the latest createPeerConnection function
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
  }, [localStream]); // This effect re-runs only when localStream changes, updating the ref

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
  }, [localUsername, showUsernameModal]); // Only re-run if username changes or modal state changes

  // --- Socket Setup and Listeners (main effect, now with stable dependencies) ---
  useEffect(() => {
    // Only proceed if username is set and modal is closed
    if (!localUsername || showUsernameModal) {
      return;
    }

    // Connect to the real backend server
    socketRef.current = io('http://localhost:3001'); // Assuming backend runs on port 3001

    // Listen for the custom event for assigned user ID
    socketRef.current.on('user-id-assigned', (assignedUserId) => {
      console.log('Connected to signaling server, assigned userId:', assignedUserId);
      setLocalUserId(assignedUserId);
      // Emit join-room ONLY after localUserId is assigned by the server
      socketRef.current.emit('join-room', { roomId, username: localUsername });
    });

    socketRef.current.on('room-state', ({ notes: initialNotes, timer: initialTimer, targets: initialTargets, participants: initialParticipants, joinRequests: initialJoinRequests, localUserId: assignedUserId }) => {
      // setLocalUserId(assignedUserId); // This is already handled by 'user-id-assigned'
      setNotes(initialNotes);
      setTimer(initialTimer);
      setTargets(initialTargets);
      setParticipants(initialParticipants);
      setJoinRequests(initialJoinRequests);
      console.log('Received initial room state:', { initialNotes, initialTimer, initialTargets, initialParticipants, initialJoinRequests, assignedUserId });

      // After getting initial participants, set up peer connections for existing ones
      initialParticipants.forEach(p => {
        if (p.id !== assignedUserId) {
          // Use the ref to call the latest createPeerConnection function
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
      // Initiate WebRTC connection for new user
      if (userId !== localUserId) { // localUserId is stable here
        // Use the ref to call the latest createPeerConnection function
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
      // Use the ref to call the latest handleSignal function
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
  }, [roomId, localUsername, showUsernameModal, navigate]); // Removed localUserId from dependencies

  // --- Update Peer Connection Tracks when localStream changes (e.g., screen share) ---
  useEffect(() => {
    if (localStream) {
      Object.values(peerConnectionsRef.current).forEach(pc => {
        pc.getSenders().forEach(sender => {
          if (sender.track) {
            // Find the corresponding track in the new localStream
            const newTrack = localStream.getTracks().find(track => track.kind === sender.track.kind);
            if (newTrack) {
              sender.replaceTrack(newTrack);
            } else {
              // If a track type is no longer available (e.g., audio during screen share without audio)
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
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          // Automatically stop screen sharing if user stops it from browser UI
          toggleScreenShare();
        };
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    }
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

  const handleTargetsChange = (newTargets) => {
    setTargets(newTargets);
    socketRef.current.emit('targets-update', { roomId, targets: newTargets });
  };

  const handleJoinRequestResponse = (requesterId, action) => {
    socketRef.current.emit('join-request-response', { roomId, userId: requesterId, action });
    // The server will emit 'update-join-requests' back to the moderator,
    // so no need to filter locally here.
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (localUsername.trim()) {
      localStorage.setItem('studyRoomUsername', localUsername.trim());
      setShowUsernameModal(false);
      // Reload to re-initialize the component with the new username and connect to socket
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

  // Determine if the current user is the "moderator" (first participant in the list)
  const isModerator = localUserId && participants.length > 0 && participants[0].id === localUserId;

  return (
    <div className="video-call">
      <div className="video-container">
        {localStream && (
          <div className="local-video-wrapper">
            <video ref={localVideoRef} autoPlay playsInline muted={true} />
            <div className="video-label">{getUserDisplayName(localUserId)}</div>
          </div>
        )}
        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <div key={userId} className="remote-video-wrapper">
            <video autoPlay playsInline srcObject={stream} />
            <div className="video-label">{getUserDisplayName(userId)}</div>
          </div>
        ))}
        {/* Placeholder for participants without video streams yet */}
        {participants
          .filter(p => p.id !== localUserId && !remoteStreams[p.id])
          .map(p => (
            <div key={p.id} className="remote-video-wrapper placeholder">
              <div className="video-label">{getUserDisplayName(p.id)} (Connecting...)</div>
            </div>
          ))}
      </div>
      <div className="sidebar">
        <Notes notes={notes} onNotesChange={handleNotesChange} />
        <Timer timer={timer} onTimerChange={handleTimerChange} />
        <StudyTargets targets={targets} onTargetsChange={handleTargetsChange} />
        <ParticipantList participants={participants} localUserId={localUserId} />
        {isModerator && (
          <JoinRequests requests={joinRequests} onRequestResponse={handleJoinRequestResponse} />
        )}
      </div>
      <FloatingToolbar
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
      />
    </div>
  );
}

export default VideoCall;
