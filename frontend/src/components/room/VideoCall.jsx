import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext'; // Import auth context
import io from 'socket.io-client';
import FloatingToolbar from './FloatingToolbar';
import MusicPlayer from './MusicPlayer';
import Timer from './Timer';
import Notes from './Notes';
import ChatPanel from './ChatPanel';
import ParticipantList from './ParticipantList';
import './VideoCall.css';

import {
    useLocation
} from 'react-router-dom';


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

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

// Waiting component for better UX
const WaitingForApproval = ({ roomId, onCancel }) => {
  return (
    <div className="waiting-overlay">
      <div className="waiting-content">
        <div className="spinner"></div>
        <h2>Waiting for approval...</h2>
        <p>Your request to join this private room has been sent to the creator.</p>
        <p>Please wait while they review your request.</p>
        <button onClick={onCancel} className="cancel-waiting-btn">
          Cancel and Return to Rooms
        </button>
      </div>
    </div>
  );
};

function VideoCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, sessionToken, isAuthenticated } = useAuth(); // Use auth context
  const location = useLocation();
    
    // Get initial preferences from URL parameters
  const queryParams = new URLSearchParams(location.search);
  const initialName = queryParams.get('name') || user?.username || 'Guest';
  const initialAudio = queryParams.get('audio') === 'true';
  const initialVideo = queryParams.get('video') === 'true';

  // Participants and media state
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteUsersData, setRemoteUsersData] = useState({}); // Stores media states of remote users
 
  // Media controls state - Initialize based on lobby preferences (MATCHING FIRST CODE)
  const [isMuted, setIsMuted] = useState(!initialAudio); // If audio is false, then muted is true
  const [isCameraOff, setIsCameraOff] = useState(!initialVideo); // If video is false, then camera is off
  const [isScreenSharing, setIsScreenSharing] = useState(false);
 
  // Room features state (MATCHING FIRST CODE)
  const [notes, setNotes] = useState('');
  const [timer, setTimer] = useState(0);
  const [targets, setTargets] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [isCreator, setIsCreator] = useState(false); // Is the current user the room creator/admin?
  const [roomType, setRoomType] = useState('private'); // 'private' or 'public'
 
  // UI state (MATCHING FIRST CODE - Adjusted defaults to be OFF/toggled off)
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUNDS[0]);
  const [mainViewRemoteStream, setMainViewRemoteStream] = useState(null);
  const [mainViewRemoteUserId, setMainViewRemoteUserId] = useState(null);
  const [showNotesPanel, setShowNotesPanel] = useState(false); // Default OFF
  const [showTimerPanel, setShowTimerPanel] = useState(false); // Default OFF
  const [showMusicPlayer, setShowMusicPlayer] = useState(false); // Default OFF
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showParticipantsPanel, setShowParticipantsPanel] = useState(false);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false); 
    const [activeScreenShareUserId, setActiveScreenShareUserId] = useState(null); 
 
  // Connection state
  const [connectionQuality, setConnectionQuality] = useState({});
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  // Refs 
  const localCameraVideoRef = useRef(null);
  const localScreenShareVideoRef = useRef(null);
  const backgroundVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const dataChannelsRef = useRef({});
  const localStreamRef = useRef(null);
  const connectionStatsIntervals = useRef({});
    const fullScreenRef = useRef(null); 
  // Ref for handleDataChannelMessage to break circular dependency with useCallback
  const handleDataChannelMessageRef = useRef();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !sessionToken || !user) {
      navigate('/auth', { replace: true });
      return;
    }
  }, [isAuthenticated, sessionToken, user, navigate]);

  const handleCloseChat = useCallback(() => {
    setShowChatPanel(false);
  }, []);

  // Update refs
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

    // Fullscreen handlers
    const toggleFullScreen = useCallback(() => {
        if (!isFullScreen) {
            // Check if main view is showing a screen share or a focused participant
            if (fullScreenRef.current && fullScreenRef.current.requestFullscreen) {
                fullScreenRef.current.requestFullscreen();
                setIsFullScreen(true);
            } else if (document.documentElement && document.documentElement.requestFullscreen) {
                // Fallback to general page fullscreen if mainRef isn't active
                document.documentElement.requestFullscreen();
                setIsFullScreen(true);
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    }, [isFullScreen]);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

  // User display name helper
  const getUserDisplayName = useCallback((userId) => {
    if (userId === user?.userId) return `${user.username} (You)`;
    const participant = participants.find(p => p.id === userId);
    const remoteData = remoteUsersData[userId];
    return participant?.name || remoteData?.username || `Guest ${userId?.slice(-4) || 'Unknown'}`;
  }, [user?.userId, user?.username, participants, remoteUsersData]);

  // Data channel message handler
  const handleDataChannelMessage = useCallback((senderId, data) => {
    switch (data.type) {
      case 'chat':
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          userId: senderId,
          username: getUserDisplayName(senderId),
          message: data.message,
          timestamp: new Date(),
          type: 'text'
        }]);
        break;
      case 'userUpdate':
        setRemoteUsersData(prev => ({
          ...prev,
          [senderId]: { ...prev[senderId], ...data.userData }
        }));
        break;
      default:
        console.log('Unknown data channel message type:', data.type);
    }
  }, [getUserDisplayName]);

  // Update the ref whenever handleDataChannelMessage changes
  useEffect(() => {
    handleDataChannelMessageRef.current = handleDataChannelMessage;
  }, [handleDataChannelMessage]);

  // Initialize media - CORRECTED VERSION
  const initializeMedia = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      // Use the initial preferences from lobby
      const videoConstraints = initialVideo ? { 
        width: { ideal: 1920 }, // Increased from 1280
        height: { ideal: 1080 }, // Increased from 720
        frameRate: { ideal: 30 }
      } : false;
      
      const audioConstraints = initialAudio ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } : false;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: videoConstraints, 
        audio: audioConstraints
      });
      
      // Apply initial media states to tracks
      if (stream) {
        stream.getAudioTracks().forEach(track => {
          track.enabled = initialAudio;
        });
        stream.getVideoTracks().forEach(track => {
          track.enabled = initialVideo;
        });
      }
      
      setLocalStream(stream);
      
      // Set the initial states based on lobby preferences
      setIsCameraOff(!initialVideo);
      setIsMuted(!initialAudio);
      
      setConnectionError(null);
    } catch (err) {
      console.error('Media access error:', err);
      setConnectionError('Could not access camera/microphone. Please ensure permissions are granted.');
      
      // Fallback logic
      try {
        if (initialAudio && !initialVideo) {
          // Try audio only if video failed but audio was requested
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setLocalStream(audioOnlyStream);
          setIsCameraOff(true);
          setIsMuted(false);
        } else {
          // Create empty stream
          setLocalStream(new MediaStream());
          setIsCameraOff(true);
          setIsMuted(true);
        }
      } catch (audioErr) {
        setLocalStream(new MediaStream());
        setIsCameraOff(true);
        setIsMuted(true);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [initialAudio, initialVideo]); // Add dependencies

  // Create peer connection with enhanced error handling and stats monitoring
  const createPeerConnection = useCallback((remoteUserId) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10
    });

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream from:', remoteUserId);
      setRemoteStreams(prev => ({ 
        ...prev, 
        [remoteUserId]: event.streams[0] 
      }));
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          targetUserId: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    // Handle negotiation needed
    peerConnection.onnegotiationneeded = async () => {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        if (socketRef.current) {
          socketRef.current.emit('signal', {
            targetUserId: remoteUserId,
            signal: peerConnection.localDescription,
          });
        }
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    };

    // Monitor connection state
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log(`Connection state with ${remoteUserId}:`, state);
      
      setConnectionQuality(prev => ({
        ...prev,
        [remoteUserId]: state
      }));

      if (state === 'failed' || state === 'disconnected') {
        // Attempt to reconnect
        setTimeout(() => {
          if (peerConnection.connectionState === 'failed') {
            console.log(`Attempting to renegotiate with ${remoteUserId}`);
            // Trigger renegotiation
            peerConnection.restartIce();
          }
        }, 1000);
      }
    };

    // Create data channel for additional features
    const dataChannel = peerConnection.createDataChannel('chat', {
      ordered: true
    });
    
    dataChannel.onopen = () => {
      console.log(`Data channel opened with ${remoteUserId}`);
    };

    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Use the ref to call handleDataChannelMessage
        handleDataChannelMessageRef.current(remoteUserId, data);
      } catch (err) {
        console.error('Error parsing data channel message:', err);
      }
    };

    dataChannelsRef.current[remoteUserId] = dataChannel;

    // Handle incoming data channels
    peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Use the ref to call handleDataChannelMessage
          handleDataChannelMessageRef.current(remoteUserId, data);
        } catch (err) {
          console.error('Error parsing incoming data channel message:', err);
      }
    };
    };

    // Start connection quality monitoring
    startConnectionMonitoring(remoteUserId, peerConnection);

    peerConnectionsRef.current[remoteUserId] = peerConnection;
    return peerConnection;
  }, []);

  // Connection quality monitoring
  const startConnectionMonitoring = (remoteUserId, peerConnection) => {
    if (connectionStatsIntervals.current[remoteUserId]) {
      clearInterval(connectionStatsIntervals.current[remoteUserId]);
    }

    connectionStatsIntervals.current[remoteUserId] = setInterval(async () => {
      try {
        const stats = await peerConnection.getStats();
        let bytesReceived = 0;
        let bytesSent = 0;
       
        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            bytesReceived += report.bytesReceived || 0;
          }
          if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
            bytesSent += report.bytesSent || 0;
          }
        });

        setConnectionQuality(prev => ({
          ...prev,
          [remoteUserId]: {
            ...prev[remoteUserId],
            bytesReceived,
            bytesSent,
            timestamp: Date.now()
          }
        }));
      } catch (err) {
        console.error('Error getting connection stats:', err);
      }
    }, 5000);
  };

  // Handle WebRTC signaling
  const handleSignal = useCallback(async (senderUserId, signal) => {
    if (!localStreamRef.current) return;

    let peerConnection = peerConnectionsRef.current[senderUserId];
    if (!peerConnection) {
      peerConnection = createPeerConnection(senderUserId);
    }

    try {
      if (signal.type === 'offer' || signal.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        
        if (signal.type === 'offer') {
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          if (socketRef.current) {
            socketRef.current.emit('signal', {
              targetUserId: senderUserId,
              signal: peerConnection.localDescription,
            });
        }
        }
      }
    } catch (err) {
      console.error('Error handling signal:', err);
    }
  }, [createPeerConnection]);

  // Handle ICE candidates
  const handleIceCandidate = useCallback(async (senderUserId, candidate) => {
    const peerConnection = peerConnectionsRef.current[senderUserId];
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error handling ICE candidate:', err);
      }
    }
  }, []);

  // Initialize media on component mount
  useEffect(() => {
    // Only initialize media if we have user info
    if (!isAuthenticated || !user) {
      navigate('/auth', { replace: true });
      return;
    }
    initializeMedia();
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isAuthenticated, user, initializeMedia, navigate]);

  // Update video refs when stream changes
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

  // Update background video
  useEffect(() => {
    if (backgroundVideoRef.current && selectedBackground && selectedBackground.type === 'video') {
      backgroundVideoRef.current.src = selectedBackground.url;
      backgroundVideoRef.current.load();
    }
  }, [selectedBackground]);

  // Socket connection and event handlers
  useEffect(() => {
    if (!isAuthenticated || !sessionToken || !user) return;

    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket'],
      upgrade: false,
      rememberUpgrade: false,
      query: { sessionToken }
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server with session token');
      setConnectionError(null);
      socketRef.current.emit('join-room', { roomId, sessionToken });
    });

    // Handle successful room join
    socketRef.current.on('room-joined-successfully', ({ 
      notes: initialNotes, 
      timer: initialTimer, 
      targets: initialTargets, 
      participants: initialParticipants, 
      joinRequests: initialJoinRequests, 
      localUserId: assignedUserId, 
      isLocked,
      roomType: currentRoomType,
      creatorId,
      isAdmin,
      isCreator: isCurrentUserCreator 
    }) => {
      console.log('Successfully joined room:', initialParticipants.length, 'participants');
      setNotes(initialNotes);
      setTimer(initialTimer);
      setTargets(initialTargets);
      setParticipants(initialParticipants);
      setJoinRequests(initialJoinRequests);
      setIsRoomLocked(isLocked);
      setRoomType(currentRoomType);
      setIsCreator(isCurrentUserCreator);
      setIsConnecting(false); // Stop the connecting state

      // Initialize remoteUsersData
      const initialRemoteData = {};
      initialParticipants.forEach(p => {
        if (p.id !== user.userId) {
          initialRemoteData[p.id] = {
            isMuted: p.isMuted,
            isCameraOff: p.isCameraOff,
            isScreenSharing: p.isScreenSharing,
            username: p.name
          };
        }
      });
      setRemoteUsersData(initialRemoteData);

      // Create peer connections
      initialParticipants.forEach(p => {
        if (p.id !== user.userId) {
          setTimeout(() => createPeerConnection(p.id), 1000);
        }
      });

      // FIX 1: Notify other participants of initial media state after connections start
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('media-state-update', { 
            isMuted: !initialAudio,
            isCameraOff: !initialVideo,
            isScreenSharing: false
          });
        }
      }, 2000);
    });

    // Handle join request sent (user should wait)
    socketRef.current.on('join-request-sent', ({ roomId, message, shouldWait }) => {
      if (shouldWait) {
        // Show waiting state, don't enter room
        setIsConnecting(false);
        setConnectionError(null);
        setIsWaitingForApproval(true);
        alert(message);
      }
    });

    // Handle join approval (user can now enter room)
    // *** MODIFIED: Changed to async and added media stream check ***
    socketRef.current.on('join-approved', async ({ 
      roomId,
      roomInfo,
      notes: initialNotes, 
      timer: initialTimer, 
      targets: initialTargets, 
      participants: initialParticipants, 
      joinRequests: initialJoinRequests, 
      localUserId: assignedUserId, 
      isLocked,
      roomType: currentRoomType,
      creatorId,
      isAdmin,
      isCreator: isCurrentUserCreator 
    }) => {
      console.log('Join request approved, entering room');
      
      // Update local UI state
      setNotes(initialNotes);
      setTimer(initialTimer);
      setTargets(initialTargets);
      setParticipants(initialParticipants);
      setJoinRequests(initialJoinRequests);
      setIsRoomLocked(isLocked);
      setRoomType(currentRoomType);
      setIsCreator(isCurrentUserCreator);
      setIsConnecting(false);
      setIsWaitingForApproval(false);

        // *** FIX for immediate disconnect: Re-initialize media if it wasn't successful before ***
        // This ensures the client has a valid stream before trying to send WebRTC signals.
        if (!localStreamRef.current || localStreamRef.current.getTracks().length === 0) {
            console.log("Local stream missing/invalid on join-approved. Re-initializing media...");
            await initializeMedia(); 
        }

      const initialRemoteData = {};
      initialParticipants.forEach(p => {
        if (p.id !== user.userId) {
          initialRemoteData[p.id] = {
            isMuted: p.isMuted,
            isCameraOff: p.isCameraOff,
            isScreenSharing: p.isScreenSharing,
            username: p.name
          };
        }
      });
      setRemoteUsersData(initialRemoteData);

      initialParticipants.forEach(p => {
        if (p.id !== user.userId) {
          // Give a brief moment to ensure new local stream is set
          setTimeout(() => createPeerConnection(p.id), 1000); 
        }
      });

      // FIX 1: Notify other participants of initial media state after connections start
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('media-state-update', { 
            isMuted: !initialAudio,
            isCameraOff: !initialVideo,
            isScreenSharing: false
          });
        }
      }, 2000);

      alert('Your join request was approved! Welcome to the room.');
    });

    socketRef.current.on('join-rejected', ({ roomId, message }) => {
      alert(message || `Your request to join room ${roomId} was rejected.`);
      navigate('/room');
    });

    socketRef.current.on('private-room-empty', ({ roomId, message }) => {
      alert(message || `This private room creator is not currently present.`);
      navigate('/room');
    });

    socketRef.current.on('room-not-found', () => {
      alert('Room not found!');
      navigate('/room');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionError('Connection lost. Attempting to reconnect...');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError('Failed to connect to server');
    });

    // Authentication required handler
    socketRef.current.on('authentication-required', ({ message }) => {
      console.error('Authentication required:', message);
      alert('Session expired. Please log in again.');
      navigate('/auth', { replace: true });
    });

    // Room state initialization (fallback for older server versions)
    socketRef.current.on('room-state', ({ 
      notes: initialNotes, 
      timer: initialTimer, 
      targets: initialTargets, 
      participants: initialParticipants, 
      joinRequests: initialJoinRequests, 
      localUserId: assignedUserId, 
      isLocked,
      roomType: currentRoomType,
      creatorId,
      isAdmin,
      isCreator: isCurrentUserCreator 
    }) => {
      console.log('Room state received:', initialParticipants.length, 'participants');
      setNotes(initialNotes);
      setTimer(initialTimer);
      setTargets(initialTargets);
      setParticipants(initialParticipants);
      setJoinRequests(initialJoinRequests);
      setIsRoomLocked(isLocked);
      setRoomType(currentRoomType);
      setIsCreator(isCurrentUserCreator);

      // Initialize remoteUsersData with initial participant media states
      const initialRemoteData = {};
      initialParticipants.forEach(p => {
        if (p.id !== user.userId) {
          initialRemoteData[p.id] = {
            isMuted: p.isMuted,
            isCameraOff: p.isCameraOff,
            isScreenSharing: p.isScreenSharing,
            username: p.name
          };
        }
      });
      setRemoteUsersData(initialRemoteData);

      // Create peer connections for existing participants
      initialParticipants.forEach(p => {
        if (p.id !== user.userId) {
          setTimeout(() => createPeerConnection(p.id), 1000);
        }
      });

      // FIX 1: Notify other participants of initial media state after connections start
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('media-state-update', { 
            isMuted: !initialAudio,
            isCameraOff: !initialVideo,
            isScreenSharing: false
          });
        }
      }, 2000);
    });

    // User connection events
    socketRef.current.on('user-connected', ({ userId, username, isMuted, isCameraOff, isScreenSharing, isAdmin, isCreator, canBeControlledByAdmin }) => {
      console.log('User connected:', username);
      setParticipants(prev => {
        if (!prev.some(p => p.id === userId)) {
          return [...prev, { 
            id: userId, 
            name: username, 
            isMuted, 
            isCameraOff, 
            isScreenSharing,
            isAdmin,
            isCreator,
            canBeControlledByAdmin
          }];
        }
        return prev;
      });
      setRemoteUsersData(prev => ({
        ...prev,
        [userId]: { isMuted, isCameraOff, isScreenSharing, username }
      }));

      // Create peer connection for new user
      if (userId !== user.userId) {
        setTimeout(() => createPeerConnection(userId), 500);
      }
    });

    socketRef.current.on('user-disconnected', (userId) => {
      console.log('User disconnected:', userId);
      
      // Clean up participant data
      setParticipants(prev => prev.filter(p => p.id !== userId));
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[userId];
        return newStreams;
      });
      setRemoteUsersData(prev => {
        const newData = { ...prev };
        delete newData[userId];
        return newData;
      });
      setConnectionQuality(prev => {
        const newQuality = { ...prev };
        delete newQuality[userId];
        return newQuality;
      });
        
        // Handle screen share state cleanup
        if (activeScreenShareUserId === userId) {
            setActiveScreenShareUserId(null);
            setMainViewRemoteStream(null);
            setMainViewRemoteUserId(null);
        }

      // Close peer connection
      if (peerConnectionsRef.current[userId]) {
        peerConnectionsRef.current[userId].close();
        delete peerConnectionsRef.current[userId];
      }

      // Close data channel
      if (dataChannelsRef.current[userId]) {
        dataChannelsRef.current[userId].close();
        delete dataChannelsRef.current[userId];
      }

      // Clear connection monitoring
      if (connectionStatsIntervals.current[userId]) {
        clearInterval(connectionStatsIntervals.current[userId]);
        delete connectionStatsIntervals.current[userId];
      }

      // Reset main view if it was showing this user
      if (mainViewRemoteUserId === userId) {
        setMainViewRemoteStream(null);
        setMainViewRemoteUserId(null);
      }
    });

    // WebRTC signaling
    socketRef.current.on('signal', ({ userId, signal }) => {
      handleSignal(userId, signal);
    });

    // ICE candidate handling
    socketRef.current.on('ice-candidate', ({ userId, candidate }) => {
      handleIceCandidate(userId, candidate);
    });

    // Room feature updates
    socketRef.current.on('notes-update', (newNotes) => setNotes(newNotes));
    socketRef.current.on('timer-update', (newTimer) => setTimer(newTimer));
    socketRef.current.on('targets-update', (newTargets) => setTargets(newTargets));

    // Join request handling
    socketRef.current.on('new-join-request', (request) => {
      setJoinRequests(prev => [...prev, request]);
      if (isCreator) {
        console.log(`New join request from ${request.username} for room ${roomId}`);
      }
    });

    socketRef.current.on('update-join-requests', (updatedRequests) => {
      setJoinRequests(updatedRequests);
    });

    // Room status updates
    socketRef.current.on('room-lock-status', (locked) => {
      setIsRoomLocked(locked);
    });

    // Chat messages
    socketRef.current.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    // Media state change notifications 
    socketRef.current.on('media-state-changed', ({ userId, isMuted, isCameraOff, isScreenSharing }) => {
      setRemoteUsersData(prev => ({
        ...prev,
        [userId]: { 
          ...prev[userId], 
          isMuted, 
          isCameraOff, 
          isScreenSharing 
        }
      }));
      setParticipants(prev => prev.map(p => 
        p.id === userId ? { ...p, isMuted, isCameraOff, isScreenSharing } : p
      ));

      // Handle screen sharing state - automatically put screen share in main view
      if (isScreenSharing) {
        setActiveScreenShareUserId(userId);
        // If the remote stream is available, set it as the main view stream
        if (remoteStreams[userId]) {
          setMainViewRemoteStream(remoteStreams[userId]);
          setMainViewRemoteUserId(userId);
        }
      } else if (!isScreenSharing && activeScreenShareUserId === userId) {
        setActiveScreenShareUserId(null);
        setMainViewRemoteStream(null);
        setMainViewRemoteUserId(null);
      }
    });

    // Screen sharing notifications 
    socketRef.current.on('user-screen-share-start', ({ userId, username }) => {
      setRemoteUsersData(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isScreenSharing: true, username }
      }));
      setActiveScreenShareUserId(userId);
    });

    socketRef.current.on('user-screen-share-stop', ({ userId }) => {
      setRemoteUsersData(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isScreenSharing: false }
      }));
      if (activeScreenShareUserId === userId) {
        setActiveScreenShareUserId(null);
        setMainViewRemoteStream(null);
        setMainViewRemoteUserId(null);
      }
    });


    // Audio/video toggle notifications
    socketRef.current.on('user-audio-toggle', ({ userId, isMuted }) => {
      setRemoteUsersData(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isMuted }
      }));
      setParticipants(prev => prev.map(p =>
        p.id === userId ? { ...p, isMuted } : p
      ));
    });

    socketRef.current.on('user-video-toggle', ({ userId, isCameraOff }) => {
      setRemoteUsersData(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isCameraOff }
      }));
      setParticipants(prev => prev.map(p =>
        p.id === userId ? { ...p, isCameraOff } : p
      ));
    });

    // Admin control events for the target participant
    socketRef.current.on('admin-mute-command', ({ roomId, isMuted, adminName }) => {
      console.log(`Admin ${adminName} ${isMuted ? 'muted' : 'unmuted'} you.`);
      setIsMuted(isMuted);
      if (localStream) {
        localStream.getAudioTracks().forEach(track => (track.enabled = !isMuted));
      }
      alert(`You have been ${isMuted ? 'muted' : 'unmuted'} by ${adminName}.`);
    });

    socketRef.current.on('admin-camera-command', ({ roomId, isCameraOff, adminName }) => {
      console.log(`Admin ${adminName} ${isCameraOff ? 'disabled' : 'enabled'} your camera.`);
      setIsCameraOff(isCameraOff);
      if (localStream) {
        localStream.getVideoTracks().forEach(track => (track.enabled = !isCameraOff));
      }
      alert(`Your camera has been ${isCameraOff ? 'disabled' : 'enabled'} by ${adminName}.`);
    });

    socketRef.current.on('removed-by-admin', ({ roomId, adminName, reason }) => {
      alert(`You have been removed from the room by ${adminName}. Reason: ${reason}`);
      navigate('/room');
    });

    // Admin control events for all participants (to update UI)
    socketRef.current.on('participant-muted-by-admin', ({ participantId, isMuted, adminName }) => {
      setRemoteUsersData(prev => ({
        ...prev,
        [participantId]: { ...prev[participantId], isMuted }
      }));
      setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, isMuted } : p));
      console.log(`Participant ${participantId} was ${isMuted ? 'muted' : 'unmuted'} by admin ${adminName}`);
    });

    socketRef.current.on('participant-camera-toggled-by-admin', ({ participantId, isCameraOff, adminName }) => {
      setRemoteUsersData(prev => ({
        ...prev,
        [participantId]: { ...prev[participantId], isCameraOff }
      }));
      setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, isCameraOff } : p));
      console.log(`Participant ${participantId} camera was ${isCameraOff ? 'disabled' : 'enabled'} by admin ${adminName}`);
    });

    socketRef.current.on('participant-removed-by-admin', ({ participantId, participantName, adminName }) => {
      console.log(`${participantName} was removed from the room by ${adminName}.`);
      // The 'user-disconnected' event will handle the actual removal from state
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      peerConnectionsRef.current = {};
      
      // Close all data channels
      Object.values(dataChannelsRef.current).forEach(dc => dc.close());
      dataChannelsRef.current = {};

      // Clear all intervals
      Object.values(connectionStatsIntervals.current).forEach(interval => {
        clearInterval(interval);
      });
      connectionStatsIntervals.current = {};
    };
  }, [roomId, user, sessionToken, isAuthenticated, navigate, createPeerConnection, handleSignal, handleIceCandidate, isCreator, initialAudio, initialVideo, activeScreenShareUserId, remoteStreams, initializeMedia]);

  // Update peer connections when local stream changes
  useEffect(() => {
    if (!localStream) return;

    Object.values(peerConnectionsRef.current).forEach(pc => {
      const videoTrack = localStream.getVideoTracks()[0];
      const audioTrack = localStream.getAudioTracks()[0];
      
      const videoSender = pc.getSenders().find(sender => 
        sender.track && sender.track.kind === 'video'
      );
      const audioSender = pc.getSenders().find(sender => 
        sender.track && sender.track.kind === 'audio'
      );

      // Handle video track
      if (videoTrack) {
        if (videoSender) {
          if (videoSender.track !== videoTrack) {
            videoSender.replaceTrack(videoTrack).catch(console.error);
          }
        } else {
          pc.addTrack(videoTrack, localStream);
        }
      } else if (videoSender) {
        // Video track is removed (e.g., camera off or switching to screen share without camera)
        // Replace with null to stop transmitting video data
        videoSender.replaceTrack(null).catch(console.error);
      }

      // Handle audio track
      if (audioTrack) {
        if (audioSender) {
          if (audioSender.track !== audioTrack) {
            audioSender.replaceTrack(audioTrack).catch(console.error);
          }
        } else {
          pc.addTrack(audioTrack, localStream);
        }
      } else if (audioSender) {
        // Audio track is removed (e.g., initial setup with audio:false)
        audioSender.replaceTrack(null).catch(console.error);
      }
    });
  }, [localStream]);

  // Media control functions
  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      
      // Notify other participants
      if (socketRef.current) {
        socketRef.current.emit('media-state-update', { 
          isMuted: newMutedState,
          isCameraOff,
          isScreenSharing
        });
      }
    }
  }, [localStream, isMuted, isCameraOff, isScreenSharing]);

  // FIX 2: Updated toggleCamera to correctly stop/start the physical camera
  const toggleCamera = useCallback(async () => {
    if (isScreenSharing) {
      alert("Please stop screen sharing before toggling your camera.");
      return;
    }

    if (localStream) {
      const currentVideoTrack = localStream.getVideoTracks()[0];
      
      if (!isCameraOff) {
        // --- Turn Off Camera (Releasing Hardware) ---
        if (currentVideoTrack) {
          currentVideoTrack.stop(); // Stops the physical camera
          localStream.removeTrack(currentVideoTrack);
          // Update localStream to trigger effect and replaceTrack with null
          // Preserve audio tracks if they exist
          const updatedStream = new MediaStream([...localStream.getAudioTracks()]);
          setLocalStream(updatedStream);
        }
        setIsCameraOff(true);

      } else {
        // --- Turn On Camera (Acquiring Hardware) ---
        try {
          const newVideoMedia = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1920 }, // Increased resolution
              height: { ideal: 1080 },
              frameRate: { ideal: 30 }
            } 
          });
          const newVideoTrack = newVideoMedia.getVideoTracks()[0];
          
          // Add the new video track to the existing stream (which may only have audio)
          localStream.addTrack(newVideoTrack);
          // Create a new MediaStream instance to trigger useEffect/re-render
          const updatedStream = new MediaStream([...localStream.getTracks()]);
          setLocalStream(updatedStream);

          setIsCameraOff(false);
        } catch (err) {
          console.error('Camera access error:', err);
          alert('Could not access camera. Please ensure permissions are granted.');
          return; // Exit if camera fails to turn on
        }
      }

      // Notify other participants of the new state
      if (socketRef.current) {
        socketRef.current.emit('media-state-update', { 
          isMuted,
          isCameraOff: !isCameraOff, // The new state
          isScreenSharing
        });
      }
    }
  }, [localStream, isMuted, isCameraOff, isScreenSharing]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      // Stop only the screen track (if it exists)
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      try {
        // Re-initialize media to switch back to camera/audio
        await initializeMedia(); 
        setIsScreenSharing(false);
        setActiveScreenShareUserId(null);
        
        // Reset main view if local user was sharing
        if (mainViewRemoteUserId === user?.userId) {
          setMainViewRemoteStream(null);
          setMainViewRemoteUserId(null);
        }

        if (socketRef.current) {
          socketRef.current.emit('screen-share-stop', { roomId });
        }
      } catch (err) {
        console.error('Error stopping screen share and fallback:', err);
        // Minimal fallback if camera re-init fails
        setLocalStream(new MediaStream());
        setIsScreenSharing(false);
        setIsCameraOff(true);
        setActiveScreenShareUserId(null);
      }
    } else {
      // Start screen sharing
      // Stop existing camera stream tracks before starting screen share
      if (localStream) {
        localStream.getVideoTracks().forEach(track => track.stop());
      }
      
      try {
        // Request screen sharing, allowing audio capture
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          }, 
          audio: true 
        });
        
        // Merge screen video and existing audio, or use screen's audio
        const audioTracks = localStream ? localStream.getAudioTracks() : [];
        const newTracks = [...screenStream.getVideoTracks(), ...audioTracks];
        
        // If screen share has audio, use it, otherwise keep old audio.
        if (screenStream.getAudioTracks().length > 0) {
          newTracks.push(...screenStream.getAudioTracks());
        } else if (localStream && localStream.getAudioTracks().length > 0) {
          // Keep existing mic audio if screen share has none
          newTracks.push(...localStream.getAudioTracks());
        }
        
        const finalStream = new MediaStream(newTracks);

        setLocalStream(finalStream);
        setIsScreenSharing(true);
        setIsCameraOff(true); // Camera is logically off when screen sharing
        
        // Automatically set local screen share to the main view
        setActiveScreenShareUserId(user?.userId);
        setMainViewRemoteStream(finalStream);
        setMainViewRemoteUserId(user?.userId);
        
        // Handle native screen share stop event (e.g., clicking browser 'stop sharing' button)
        screenStream.getVideoTracks()[0].onended = () => {
          // Only call toggleScreenShare if screen sharing is still active (prevents double call)
          if (isScreenSharing) {
            toggleScreenShare();
          }
        };
        
        if (socketRef.current) {
          socketRef.current.emit('screen-share-start', { roomId });
        }
      } catch (err) {
        console.error('Screen share error:', err);
        if (err.name !== 'NotAllowedError') {
          alert('Could not start screen sharing. Please ensure permissions are granted.');
        }
        // Fallback to camera/initial settings
        initializeMedia();
      }
    }
  }, [localStream, isScreenSharing, roomId, initializeMedia, user?.userId, mainViewRemoteUserId]);

  // UI event handlers
  const handleBackgroundChange = useCallback((newBackgroundUrl) => {
    const newBackground = BACKGROUNDS.find(bg => bg.url === newBackgroundUrl);
    setSelectedBackground(newBackground);
    // Don't clear main view if there's an active screen share
    if (!activeScreenShareUserId) {
      setMainViewRemoteStream(null);
      setMainViewRemoteUserId(null);
    }
  }, [activeScreenShareUserId]);

  const handleParticipantClick = useCallback((participantId, stream) => {
    // Prevent a focused view if someone is actively screen sharing (unless it's the screen sharer)
    if (activeScreenShareUserId && activeScreenShareUserId !== participantId) {
      return;
    }

    if (mainViewRemoteUserId === participantId || !stream) {
      // Only clear if no active screen share
      if (!activeScreenShareUserId) {
        setMainViewRemoteStream(null);
        setMainViewRemoteUserId(null);
      }
    } else {
      setMainViewRemoteStream(stream);
      setMainViewRemoteUserId(participantId);
    }
  }, [mainViewRemoteUserId, activeScreenShareUserId]);

  // Room feature handlers
  const handleNotesChange = useCallback((e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (socketRef.current && isCreator) {
      socketRef.current.emit('notes-update', { roomId, notes: newNotes });
    }
  }, [roomId, isCreator]);

  const handleTimerChange = useCallback((newTimer) => {
    setTimer(newTimer);
    if (socketRef.current && isCreator) {
      socketRef.current.emit('timer-update', { roomId, timer: newTimer });
    }
  }, [roomId, isCreator]);

  const handleTargetsChange = useCallback((newTargets) => {
    setTargets(newTargets);
    if (socketRef.current && isCreator) {
      socketRef.current.emit('targets-update', { roomId, targets: newTargets });
    }
  }, [roomId, isCreator]);

  const handleJoinRequestResponse = useCallback((requesterId, action) => {
    setJoinRequests(prev => prev.filter(req => req.userId !== requesterId));
    if (socketRef.current && isCreator) {
      // This is the admin's action, which triggers the 'join-approved'/'join-rejected' on the participant's client
      socketRef.current.emit('join-request-response', { roomId, userId: requesterId, action });
    }
  }, [roomId, isCreator]);

  const handleSendChatMessage = useCallback((message) => {
  if (socketRef.current && message.trim()) {
    socketRef.current.emit('chat-message', { roomId, message: message.trim() });
  }
}, [roomId]);

  const toggleRoomLock = useCallback(() => {
    if (isCreator && socketRef.current) {
      socketRef.current.emit('toggle-room-lock', { roomId });
    }
  }, [isCreator, roomId]);

  // Admin actions
  const onAdminMuteParticipant = useCallback((participantId, isMutedState) => {
    if (socketRef.current && isCreator) {
      socketRef.current.emit('admin-mute-participant', { roomId, participantId, isMuted: isMutedState });
    }
  }, [isCreator, roomId]);

  const onAdminRemoveParticipant = useCallback((participantId) => {
    if (socketRef.current && isCreator) {
      socketRef.current.emit('admin-remove-participant', { roomId, participantId });
    }
  }, [isCreator, roomId]);

  const onAdminToggleParticipantCamera = useCallback((participantId, isCameraOffState) => {
    if (socketRef.current && isCreator) {
      socketRef.current.emit('admin-toggle-participant-camera', { roomId, participantId, isCameraOff: isCameraOffState });
    }
  }, [isCreator, roomId]);

  // Leave room handler
  const handleLeaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    navigate('/room');
  }, [navigate]);

  // Cancel waiting handler
  const handleCancelWaiting = useCallback(() => {
    setIsWaitingForApproval(false);
    navigate('/room');
  }, [navigate]);

    // Added: Get main content helper from the first code (needed for the screen share logic)
    const getMainContent = () => {
        // Priority 1: Active screen share (from any user)
        if (activeScreenShareUserId) {
            const screenShareStream = activeScreenShareUserId === user?.userId ? localStream : remoteStreams[activeScreenShareUserId];
            const screenShareUser = getUserDisplayName(activeScreenShareUserId);

            return (
                <div className="main-screen-share-wrapper" ref={fullScreenRef}>
                    <video
                        ref={activeScreenShareUserId === user?.userId ? localScreenShareVideoRef : null}
                        autoPlay
                        playsInline
                        muted={activeScreenShareUserId === user?.userId}
                        srcObject={screenShareStream}
                    />
                    <div className="video-label-main">
                        {screenShareUser} - Screen Share
                    </div>
                    <button className="fullscreen-btn" onClick={toggleFullScreen}>
                        {isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    </button>
                </div>
            );
        }

        // Priority 2: Selected participant view
        if (mainViewRemoteStream && mainViewRemoteUserId) {
            return (
                <div className="main-participant-view-wrapper" ref={fullScreenRef}>
                    <video autoPlay playsInline srcObject={mainViewRemoteStream} />
                    <div className="video-label-main">
                        {getUserDisplayName(mainViewRemoteUserId)} - Focus View
                    </div>
                    <button className="fullscreen-btn" onClick={toggleFullScreen}>
                        {isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    </button>
                </div>
            );
        }

        // Priority 3: Default room info (only when no screen share is active)
        return null; // Show background only
    };

  // Return redirect component if not authenticated
  if (!isAuthenticated || !sessionToken || !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show waiting for approval state
  if (isWaitingForApproval) {
    return <WaitingForApproval roomId={roomId} onCancel={handleCancelWaiting} />;
  }

  // Show connecting state
  if (isConnecting) {
    return (
      <div className="video-call">
        <div className="connecting-overlay">
          <div className="connecting-content">
            <div className="spinner"></div>
            <h2>Connecting to room...</h2>
            <p>Please wait while we set up your connection</p>
            <div className="connection-details">
              <small>Room ID: {roomId}</small>
              <small>User: {user?.username}</small>
              <small>Audio: {initialAudio ? 'ON' : 'OFF'}</small>
              <small>Video: {initialVideo ? 'ON' : 'OFF'}</small>
            </div>
          </div>
            {connectionError && (
                <div className="connection-error-initial">
                    <span>{connectionError}</span>
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className={`video-call ${isFullScreen ? 'fullscreen-mode' : ''}`}>
      {/* Background Video: Hides when any user is actively screen sharing */}
      {selectedBackground && selectedBackground.type === 'video' && !activeScreenShareUserId && (
        <video
          ref={backgroundVideoRef}
          className="background-video"
          autoPlay
          loop
          muted
          playsInline
        />
      )}

      {/* Connection Error Notification */}
      {connectionError && (
        <div className="connection-error">
          <span>{connectionError}</span>
        </div>
      )}

      {/* Main content container */}
      <div className="content-container">
        {/* Left Sidebar for Participants - Hides in fullscreen mode */}
        {!isFullScreen && (
            <div className="left-sidebar">
                <div className="participant-list-vertical">
                    {/* Local user video: Shows only when camera is on and not screen sharing */}
                    {user?.userId && localStream && !isScreenSharing && (
                        <div
                            className={`video-wrapper local-video-sidebar enhanced-video ${
                                mainViewRemoteUserId === user.userId ? 'active-main-view' : ''
                            }`}
                            onClick={() => handleParticipantClick(user.userId, localStream)}
                        >
                            <video ref={localCameraVideoRef} autoPlay playsInline muted={true} />
                            <div className="video-label">{getUserDisplayName(user.userId)}</div>
                            {isMuted && <div className="media-status muted">🔇</div>}
                            {isCameraOff && <div className="media-status camera-off">📹</div>}
                        </div>
                    )}
                 
                  {/* Remote participants */}
                  {participants
                    .filter(p => p.id !== user?.userId)
                    .map(p => (
                      <div
                        key={p.id}
                        className={`video-wrapper enhanced-video ${
                          mainViewRemoteUserId === p.id ? 'active-main-view' : ''
                        } ${remoteUsersData[p.id]?.isScreenSharing ? 'screen-sharing-user' : ''}`}
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
                         
                        {/* Connection quality indicator */}
                        <div className={`connection-quality ${connectionQuality[p.id] || 'unknown'}`}>
                          <span>●</span>
                        </div>
                         
                        {/* Media status indicators */}
                        {remoteUsersData[p.id]?.isMuted && (
                          <div className="media-status muted">🔇</div>
                        )}
                        {remoteUsersData[p.id]?.isCameraOff && (
                          <div className="media-status camera-off">📹</div>
                        )}
                        {remoteUsersData[p.id]?.isScreenSharing && (
                          <div className="media-status screen-sharing">🖥️</div>
                        )}
                      </div>
                    ))}
                </div>
            </div>
        )}

        {/* Main Study Area - Dynamic content (Screen share appears here - middle part) */}
        <div className="main-study-area">
          {getMainContent()}
        </div>

        {/* Right Sidebar for Tools - Hides in fullscreen mode */}
        {!isFullScreen && (
            <div className="right-sidebar">
                <div className="tools-panel-stack">
                    {showNotesPanel && (
                        <div className="notes-panel">
                            <Notes
                                notes={notes}
                                onNotesChange={handleNotesChange}
                                isReadOnly={!isCreator}
                                creatorOnly={true}
                            />
                        </div>
                    )}
                    {showTimerPanel && (
                        <div className="timer-panel">
                            <Timer
                                timer={timer}
                                onTimerChange={handleTimerChange}
                                isReadOnly={!isCreator}
                                creatorOnly={true}
                            />
                        </div>
                    )}
                    {showMusicPlayer && (
                        <div className="music-player-panel">
                            <MusicPlayer />
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Chat Panel */}
      {showChatPanel && !isFullScreen && (
        <>
          <div className="chat-overlay" onClick={handleCloseChat}></div>
          <ChatPanel
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
            currentUserId={user?.userId}
            onClose={handleCloseChat}
          />
        </>
      )}

      {/* Participants Panel */}
      {showParticipantsPanel && !isFullScreen && (
        <ParticipantList
          participants={participants}
          joinRequests={joinRequests}
          isCreator={isCreator}
          roomType={roomType}
          currentUserId={user?.userId}
          onJoinRequestResponse={handleJoinRequestResponse}
          onToggleRoomLock={toggleRoomLock}
          isRoomLocked={isRoomLocked}
          connectionQuality={connectionQuality}
          remoteUsersData={remoteUsersData}
          onAdminMuteParticipant={onAdminMuteParticipant}
          onAdminRemoveParticipant={onAdminRemoveParticipant}
          onAdminToggleParticipantCamera={onAdminToggleParticipantCamera}
          onClose={() => setShowParticipantsPanel(false)}
        />
      )}
     
      {/* Enhanced Floating Toolbar */}
        {!isFullScreen && (
            <FloatingToolbar
                // Media controls
                isMuted={isMuted}
                isCameraOff={isCameraOff}
                isScreenSharing={isScreenSharing}
                onToggleMute={toggleMute}
                onToggleCamera={toggleCamera}
                onToggleScreenShare={toggleScreenShare}

                // Background props
                backgroundVideos={BACKGROUNDS}
                selectedBackground={selectedBackground.url}
                onSelectBackground={handleBackgroundChange}

                // UI Toggle handlers
                onToggleNotes={() => setShowNotesPanel(prev => !prev)}
                onToggleTimer={() => setShowTimerPanel(prev => !prev)}
                onToggleMusicPlayer={() => setShowMusicPlayer(prev => !prev)}
                onToggleChat={() => setShowChatPanel(prev => !prev)}
                onToggleParticipants={() => setShowParticipantsPanel(prev => !prev)}

                // Basic room props
                onLeaveRoom={handleLeaveRoom}
                participantCount={participants.length}
                unreadMessages={0}
                isCreator={isCreator}
                isRoomLocked={isRoomLocked}
                onToggleRoomLock={toggleRoomLock}
                roomType={roomType}
                joinRequestsCount={joinRequests.length}
                
                // Fullscreen and Screen Share status
                activeScreenShareUserId={activeScreenShareUserId}
                isFullScreen={isFullScreen}
                onToggleFullScreen={toggleFullScreen}
            />
        )}
        
        {/* Fullscreen exit button - Only shown when in Fullscreen mode */}
        {isFullScreen && (
            <button className="exit-fullscreen-btn" onClick={toggleFullScreen}>
                Exit Fullscreen
            </button>
        )}
    </div>
  );
}

export default VideoCall;