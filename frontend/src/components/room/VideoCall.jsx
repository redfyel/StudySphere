import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import FloatingToolbar from './FloatingToolbar';
import MusicPlayer from './MusicPlayer';
import Timer from './Timer';
import Notes from './Notes';
import './VideoCall.css';

// Import local video assets
import vid1 from '../../assets/vid1.mp4';
import vid2 from '../../assets/vid2.mp4';
import vid3 from '../../assets/vid3.mp4';
import vid4 from '../../assets/vid4.mp4';
import vid5 from '../../assets/vid5.mp4';

const BACKGROUNDS = [
  { name: 'Study Scene 1', url: vid1, type: 'video' },
  { name: 'Study Scene 2', url: vid2, type: 'video' },
  { name: 'Study Scene 3', url: vid3, type: 'video' },
  { name: 'Study Scene 4', url: vid4, type: 'video' },
  { name: 'Study Scene 5', url: vid5, type: 'video' },
  { name: 'No Background', url: 'none', type: 'none' },
];

function VideoCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [localUserId, setLocalUserId] = useState(null);
  const latestLocalUserId = useRef(localUserId);
  const [localUsername, setLocalUsername] = useState(localStorage.getItem('studyRoomUsername') || '');
  const [showUsernameModal, setShowUsernameModal] = useState(!localUsername);
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [notes, setNotes] = useState('');
  const [timer, setTimer] = useState(0);
  const [targets, setTargets] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUNDS[0]);
  const [mainViewRemoteStream, setMainViewRemoteStream] = useState(null);
  const [mainViewRemoteUserId, setMainViewRemoteUserId] = useState(null);
  const [showNotesPanel, setShowNotesPanel] = useState(true);
  const [showTimerPanel, setShowTimerPanel] = useState(true);
  const [showMusicPlayer, setShowMusicPlayer] = useState(true);
  const localCameraVideoRef = useRef(null);
  const localScreenShareVideoRef = useRef(null);
  const backgroundVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const createPeerConnectionRef = useRef();
  const handleSignalRef = useRef();

  useEffect(() => {
    latestLocalUserId.current = localUserId;
  }, [localUserId]);

  const getUserDisplayName = useCallback((userId) => {
    if (userId === latestLocalUserId.current) return `${localUsername} (You)`;
    const participant = participants.find(p => p.id === userId);
    return participant ? participant.name : `Guest ${userId ? userId.slice(-4) : 'Unknown'}`;
  }, [localUsername, participants]);

  useEffect(() => {
    createPeerConnectionRef.current = (remoteUserId) => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      if (localStream) {
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
      }
      peerConnection.ontrack = (event) => {
        setRemoteStreams(prev => ({ ...prev, [remoteUserId]: event.streams[0] }));
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

  useEffect(() => {
    handleSignalRef.current = async (senderUserId, signal) => {
      if (!localStream) {
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

  useEffect(() => {
    if (!localUsername || showUsernameModal) return;
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setIsCameraOff(false);
      } catch (err) {
        alert('Could not access camera/microphone. Please ensure permissions are granted.');
        setLocalStream(new MediaStream());
        setIsCameraOff(true);
      }
    };
    getMedia();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localUsername, showUsernameModal]);

  useEffect(() => {
    if (localStream) {
      if (isScreenSharing && localScreenShareVideoRef.current) {
        localScreenShareVideoRef.current.srcObject = localStream;
      } else if (!isScreenSharing && localCameraVideoRef.current) {
        localCameraVideoRef.current.srcObject = localStream;
      }
    } else {
      if (localScreenShareVideoRef.current) {
        localScreenShareVideoRef.current.srcObject = null;
      }
      if (localCameraVideoRef.current) {
        localCameraVideoRef.current.srcObject = null;
      }
    }
  }, [localStream, isScreenSharing]);

  useEffect(() => {
    if (backgroundVideoRef.current && selectedBackground && selectedBackground.type === 'video') {
      backgroundVideoRef.current.src = selectedBackground.url;
      backgroundVideoRef.current.load();
    }
  }, [selectedBackground]);

  useEffect(() => {
    if (!localUsername || showUsernameModal) {
      return;
    }
    socketRef.current = io('http://localhost:3001');
    socketRef.current.on('user-id-assigned', (assignedUserId) => {
      setLocalUserId(assignedUserId);
      socketRef.current.emit('join-room', { roomId, username: localUsername });
    });
    socketRef.current.on('room-state', ({ notes: initialNotes, timer: initialTimer, targets: initialTargets, participants: initialParticipants, joinRequests: initialJoinRequests, localUserId: assignedUserId }) => {
      setNotes(initialNotes);
      setTimer(initialTimer);
      setTargets(initialTargets);
      setParticipants(initialParticipants);
      setJoinRequests(initialJoinRequests);
      initialParticipants.forEach(p => {
        if (p.id !== assignedUserId) {
          createPeerConnectionRef.current(p.id);
        }
      });
    });
    socketRef.current.on('user-connected', ({ userId, username }) => {
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
      if (mainViewRemoteUserId === userId) {
        setMainViewRemoteStream(null);
        setMainViewRemoteUserId(null);
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
  }, [roomId, localUsername, showUsernameModal, navigate, mainViewRemoteUserId]);

  useEffect(() => {
    if (!localStream) return;
    Object.values(peerConnectionsRef.current).forEach(pc => {
      const videoTrack = localStream.getVideoTracks()[0];
      const audioTrack = localStream.getAudioTracks()[0];
      const videoSender = pc.getSenders().find(sender => sender.track && sender.track.kind === 'video');
      const audioSender = pc.getSenders().find(sender => sender.track && sender.track.kind === 'audio');
      if (videoTrack) {
        if (videoSender) {
          if (videoSender.track !== videoTrack) {
            videoSender.replaceTrack(videoTrack);
          }
        } else {
          pc.addTrack(videoTrack, localStream);
        }
      } else {
        if (videoSender) {
          videoSender.replaceTrack(null);
        }
      }
      if (audioTrack) {
        if (audioSender) {
          if (audioSender.track !== audioTrack) {
            audioSender.replaceTrack(audioTrack);
          }
        } else {
          pc.addTrack(audioTrack, localStream);
        }
      } else {
        if (audioSender) {
          audioSender.replaceTrack(null);
        }
      }
    });
  }, [localStream]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = async () => {
    if (isScreenSharing) {
      alert("Please stop screen sharing before toggling your camera.");
      return;
    }
    if (!isCameraOff) {
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.stop();
          localStream.removeTrack(track);
        });
        const updatedStream = new MediaStream([...localStream.getTracks()]);
        setLocalStream(updatedStream);
        setIsCameraOff(true);
      }
    } else {
      try {
        const newVideoMedia = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newVideoMedia.getVideoTracks()[0];
        if (localStream) {
          localStream.addTrack(newVideoTrack);
          const updatedStream = new MediaStream([...localStream.getTracks()]);
          setLocalStream(updatedStream);
        } else {
          const fullStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setLocalStream(fullStream);
        }
        setIsCameraOff(false);
      } catch (err) {
        alert('Could not access camera. Please ensure permissions are granted.');
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      try {
        const newCameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(newCameraStream);
        setIsScreenSharing(false);
        setIsCameraOff(false);
      } catch (err) {
        setLocalStream(new MediaStream());
        setIsScreenSharing(false);
        setIsCameraOff(true);
      }
    } else {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setLocalStream(screenStream);
        setIsScreenSharing(true);
        setIsCameraOff(true);
        setMainViewRemoteStream(null);
        setMainViewRemoteUserId(null);
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      } catch (err) {
        setLocalStream(new MediaStream());
        setIsScreenSharing(false);
        setIsCameraOff(true);
      }
    }
  };

  const handleBackgroundChange = (newBackgroundUrl) => {
    const newBackground = BACKGROUNDS.find(bg => bg.url === newBackgroundUrl);
    setSelectedBackground(newBackground);
    setMainViewRemoteStream(null);
    setMainViewRemoteUserId(null);
  };

  const handleParticipantClick = (participantId, stream) => {
    if (mainViewRemoteUserId === participantId || !stream) {
      setMainViewRemoteStream(null);
      setMainViewRemoteUserId(null);
    } else {
      setMainViewRemoteStream(stream);
      setMainViewRemoteUserId(participantId);
      if (isScreenSharing) {
        toggleScreenShare();
      }
    }
  };

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
    setJoinRequests(prev => prev.filter(req => req.userId !== requesterId));
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

  return (
    <div className="video-call">
      {/* Background Video (now at the top level) */}
      {selectedBackground && selectedBackground.type === 'video' && (
        <video
          ref={backgroundVideoRef}
          className="background-video"
          autoPlay
          loop
          muted
          playsInline
        />
      )}

      {/* Main content container (holds sidebars and main area) */}
      <div className="content-container">
        {/* Left Sidebar for Participants */}
        <div className="left-sidebar">
          
          <div className="participant-list-vertical">
            {localUserId && localStream && !isScreenSharing && (
              <div
                className={`video-wrapper local-video-sidebar ${mainViewRemoteUserId === localUserId ? 'active-main-view' : ''}`}
                onClick={() => handleParticipantClick(localUserId, localStream)}
              >
                <video ref={localCameraVideoRef} autoPlay playsInline muted={true} />
                <div className="video-label">{getUserDisplayName(localUserId)}</div>
              </div>
            )}
            {participants.filter(p => p.id !== localUserId).map(p => (
              <div
                key={p.id}
                className={`video-wrapper ${mainViewRemoteUserId === p.id ? 'active-main-view' : ''}`}
                onClick={() => handleParticipantClick(p.id, remoteStreams[p.id])}
              >
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
        </div>

        {/* Main Study Area (Screen Share) */}
        <div className="main-study-area">
          {mainViewRemoteStream ? (
            <div className="main-screen-share-wrapper">
              <video autoPlay playsInline srcObject={mainViewRemoteStream} />
              <div className="video-label">{getUserDisplayName(mainViewRemoteUserId)} (Viewing)</div>
            </div>
          ) : isScreenSharing && localStream ? (
            <div className="main-screen-share-wrapper">
              <video ref={localScreenShareVideoRef} autoPlay playsInline muted={true} />
              <div className="video-label">{getUserDisplayName(localUserId)} (Screen Share)</div>
            </div>
          ) : (
            <div className="main-background-placeholder">
             
            </div>
          )}
        </div>

        {/* Right Sidebar for Tools */}
        <div className="right-sidebar">
        
          {!isScreenSharing && (
            <div className="tools-panel-stack">
              {showNotesPanel && (
                <div className="notes-panel">
                  <Notes notes={notes} onNotesChange={handleNotesChange} />
                </div>
              )}
              {showTimerPanel && (
                <div className="timer-panel">
                  <Timer timer={timer} onTimerChange={handleTimerChange} />
                </div>
              )}
              {showMusicPlayer && (
                <div className="music-player-panel">
                  <MusicPlayer />
                </div>
              )}
            </div>
          )}
          {isScreenSharing && (
            <div className="tools-placeholder">
              <p>Tools hidden during screen share.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toolbar */}
      <FloatingToolbar
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        backgroundVideos={BACKGROUNDS}
        selectedBackground={selectedBackground.url}
        onSelectBackground={handleBackgroundChange}
        onToggleNotes={() => setShowNotesPanel(prev => !prev)}
        onToggleTimer={() => setShowTimerPanel(prev => !prev)}
        onToggleMusicPlayer={() => setShowMusicPlayer(prev => !prev)}
      />
    </div>
  );
}

export default VideoCall;