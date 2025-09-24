import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import FloatingToolbar from './FloatingToolbar';
import MusicPlayer from './MusicPlayer';
import Timer from './Timer';
import Notes from './Notes';
import ChatPanel from './ChatPanel';
import ParticipantList from './ParticipantList';
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

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

function VideoCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // User state
  const [localUserId, setLocalUserId] = useState(null);
  const [localUsername, setLocalUsername] = useState(localStorage.getItem('studyRoomUsername') || '');
  const [showUsernameModal, setShowUsernameModal] = useState(!localUsername);
  
  // Participants and media state
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteUsersData, setRemoteUsersData] = useState({});
  
  // Media controls state
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Room features state
  const [notes, setNotes] = useState('');
  const [timer, setTimer] = useState(0);
  const [targets, setTargets] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  
  // UI state
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUNDS[0]);
  const [mainViewRemoteStream, setMainViewRemoteStream] = useState(null);
  const [mainViewRemoteUserId, setMainViewRemoteUserId] = useState(null);
  const [showNotesPanel, setShowNotesPanel] = useState(true);
  const [showTimerPanel, setShowTimerPanel] = useState(true);
  const [showMusicPlayer, setShowMusicPlayer] = useState(true);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showParticipantsPanel, setShowParticipantsPanel] = useState(false);
  
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
  const latestLocalUserId = useRef(localUserId);
  const connectionStatsIntervals = useRef({});

  const handleCloseChat = useCallback(() => {
    setShowChatPanel(false);
}, []);

  // Update refs
  useEffect(() => {
    latestLocalUserId.current = localUserId;
    localStreamRef.current = localStream;
  }, [localUserId, localStream]);

  // User display name helper
  const getUserDisplayName = useCallback((userId) => {
    if (userId === latestLocalUserId.current) return `${localUsername} (You)`;
    const participant = participants.find(p => p.id === userId);
    const remoteData = remoteUsersData[userId];
    return participant?.name || remoteData?.username || `Guest ${userId?.slice(-4) || 'Unknown'}`;
  }, [localUsername, participants, remoteUsersData]);

  // Initialize media
  const initializeMedia = useCallback(async () => {
    try {
      setIsConnecting(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setLocalStream(stream);
      setIsCameraOff(false);
      setConnectionError(null);
    } catch (err) {
      console.error('Media access error:', err);
      setConnectionError('Could not access camera/microphone. Please ensure permissions are granted.');
      // Create empty stream for audio-only or no-media scenarios
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setLocalStream(audioOnlyStream);
        setIsCameraOff(true);
      } catch (audioErr) {
        setLocalStream(new MediaStream());
        setIsCameraOff(true);
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

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
        socketRef.current.emit('signal', {
          targetUserId: remoteUserId,
          signal: { candidate: event.candidate },
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
            signal: { sdp: peerConnection.localDescription },
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
            console.log(`Attempting to reconnect to ${remoteUserId}`);
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
        handleDataChannelMessage(remoteUserId, data);
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
          handleDataChannelMessage(remoteUserId, data);
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
      if (signal.sdp) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        
        if (signal.sdp.type === 'offer') {
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          if (socketRef.current) {
            socketRef.current.emit('signal', {
              targetUserId: senderUserId,
              signal: { sdp: peerConnection.localDescription },
            });
          }
        }
      } else if (signal.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (err) {
      console.error('Error handling signal:', err);
    }
  }, [createPeerConnection]);

  // Initialize media on component mount
  useEffect(() => {
    if (!localUsername || showUsernameModal) return;
    initializeMedia();
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localUsername, showUsernameModal, initializeMedia]);

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
    if (!localUsername || showUsernameModal) return;

    // Initialize socket connection
    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket'],
      upgrade: false,
      rememberUpgrade: false
    });

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setConnectionError(null);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionError('Connection lost. Attempting to reconnect...');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError('Failed to connect to server');
    });

    // User ID assignment
    socketRef.current.on('user-id-assigned', (assignedUserId) => {
      console.log('User ID assigned:', assignedUserId);
      setLocalUserId(assignedUserId);
      // Join room after getting user ID
      socketRef.current.emit('join-room', { roomId, username: localUsername });
    });

    // Room state initialization
    socketRef.current.on('room-state', ({ 
      notes: initialNotes, 
      timer: initialTimer, 
      targets: initialTargets, 
      participants: initialParticipants, 
      joinRequests: initialJoinRequests, 
      localUserId: assignedUserId,
      isLocked,
      creatorId
    }) => {
      console.log('Room state received:', initialParticipants.length, 'participants');
      setNotes(initialNotes);
      setTimer(initialTimer);
      setTargets(initialTargets);
      setParticipants(initialParticipants);
      setJoinRequests(initialJoinRequests);
      setIsRoomLocked(isLocked);
      setIsCreator(creatorId === assignedUserId);

      // Create peer connections for existing participants
      initialParticipants.forEach(p => {
        if (p.id !== assignedUserId) {
          setTimeout(() => createPeerConnection(p.id), 1000);
        }
      });
    });

    // User connection events
    socketRef.current.on('user-connected', ({ userId, username }) => {
      console.log('User connected:', username);
      setParticipants(prev => {
        if (!prev.some(p => p.id === userId)) {
          return [...prev, { id: userId, name: username }];
        }
        return prev;
      });

      // Create peer connection for new user
      if (userId !== latestLocalUserId.current) {
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

    // Room feature updates
    socketRef.current.on('notes-update', (newNotes) => setNotes(newNotes));
    socketRef.current.on('timer-update', (newTimer) => setTimer(newTimer));
    socketRef.current.on('targets-update', (newTargets) => setTargets(newTargets));

    // Join request handling
    socketRef.current.on('new-join-request', (request) => {
      setJoinRequests(prev => [...prev, request]);
    });

    socketRef.current.on('update-join-requests', (updatedRequests) => {
      setJoinRequests(updatedRequests);
    });

    socketRef.current.on('join-approved', (approvedRoomId) => {
      console.log(`Join approved for room ${approvedRoomId}`);
      window.location.reload(); // Reload to join the room
    });

    socketRef.current.on('join-rejected', (rejectedRoomId) => {
      alert(`Your request to join room ${rejectedRoomId} was rejected.`);
      navigate('/');
    });

    socketRef.current.on('join-request-sent', (roomId) => {
      alert(`Join request sent for room ${roomId}. Waiting for approval...`);
    });

    // Room status updates
    socketRef.current.on('room-lock-status', (locked) => {
      setIsRoomLocked(locked);
    });

    socketRef.current.on('room-not-found', () => {
      alert('Room not found!');
      navigate('/');
    });

    // Chat messages
    socketRef.current.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    // Screen sharing notifications
    socketRef.current.on('user-screen-share-start', ({ userId, username }) => {
      setRemoteUsersData(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isScreenSharing: true, username }
      }));
    });

    socketRef.current.on('user-screen-share-stop', ({ userId }) => {
      setRemoteUsersData(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isScreenSharing: false }
      }));
    });

    // Audio/video toggle notifications
    socketRef.current.on('user-audio-toggle', ({ userId, isMuted }) => {
      setRemoteUsersData(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isMuted }
      }));
    });

    socketRef.current.on('user-video-toggle', ({ userId, isCameraOff }) => {
      setRemoteUsersData(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isCameraOff }
      }));
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
  }, [roomId, localUsername, showUsernameModal, navigate, createPeerConnection, handleSignal]);

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
        socketRef.current.emit('toggle-audio', { roomId, isMuted: newMutedState });
      }
    }
  }, [localStream, isMuted, roomId]);

  const toggleCamera = useCallback(async () => {
    if (isScreenSharing) {
      alert("Please stop screen sharing before toggling your camera.");
      return;
    }

    if (!isCameraOff) {
      // Turn off camera
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
      // Turn on camera
      try {
        const newVideoMedia = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          } 
        });
        const newVideoTrack = newVideoMedia.getVideoTracks()[0];
        
        if (localStream) {
          localStream.addTrack(newVideoTrack);
          const updatedStream = new MediaStream([...localStream.getTracks()]);
          setLocalStream(updatedStream);
        } else {
          const fullStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1280 }, 
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            }, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          setLocalStream(fullStream);
        }
        setIsCameraOff(false);
      } catch (err) {
        console.error('Camera access error:', err);
        alert('Could not access camera. Please ensure permissions are granted.');
      }
    }

    // Notify other participants
    if (socketRef.current) {
      socketRef.current.emit('toggle-video', { roomId, isCameraOff: !isCameraOff });
    }
  }, [localStream, isCameraOff, isScreenSharing, roomId]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      try {
        await initializeMedia();
        setIsScreenSharing(false);
        setIsCameraOff(false);
        
        if (socketRef.current) {
          socketRef.current.emit('screen-share-stop', { roomId });
        }
      } catch (err) {
        console.error('Error stopping screen share:', err);
        setLocalStream(new MediaStream());
        setIsScreenSharing(false);
        setIsCameraOff(true);
      }
    } else {
      // Start screen sharing
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          }, 
          audio: true 
        });
        
        setLocalStream(screenStream);
        setIsScreenSharing(true);
        setIsCameraOff(true);
        setMainViewRemoteStream(null);
        setMainViewRemoteUserId(null);
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
        
        if (socketRef.current) {
          socketRef.current.emit('screen-share-start', { roomId });
        }
      } catch (err) {
        console.error('Screen share error:', err);
        if (err.name !== 'NotAllowedError') {
          alert('Could not start screen sharing. Please ensure permissions are granted.');
        }
        // Fallback to camera
        initializeMedia();
      }
    }
  }, [localStream, isScreenSharing, roomId, initializeMedia]);

  // UI event handlers
  const handleBackgroundChange = useCallback((newBackgroundUrl) => {
    const newBackground = BACKGROUNDS.find(bg => bg.url === newBackgroundUrl);
    setSelectedBackground(newBackground);
    setMainViewRemoteStream(null);
    setMainViewRemoteUserId(null);
  }, []);

  const handleParticipantClick = useCallback((participantId, stream) => {
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
  }, [mainViewRemoteUserId, isScreenSharing, toggleScreenShare]);

  // Room feature handlers
  const handleNotesChange = useCallback((e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (socketRef.current) {
      socketRef.current.emit('notes-update', { roomId, notes: newNotes });
    }
  }, [roomId]);

  const handleTimerChange = useCallback((newTimer) => {
    setTimer(newTimer);
    if (socketRef.current) {
      socketRef.current.emit('timer-update', { roomId, timer: newTimer });
    }
  }, [roomId]);

  const handleTargetsChange = useCallback((newTargets) => {
    setTargets(newTargets);
    if (socketRef.current) {
      socketRef.current.emit('targets-update', { roomId, targets: newTargets });
    }
  }, [roomId]);

  const handleJoinRequestResponse = useCallback((requesterId, action) => {
    setJoinRequests(prev => prev.filter(req => req.userId !== requesterId));
    if (socketRef.current) {
      socketRef.current.emit('join-request-response', { roomId, userId: requesterId, action });
    }
  }, [roomId]);

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

  // Username modal handler
  const handleUsernameSubmit = useCallback((e) => {
    e.preventDefault();
    if (localUsername.trim()) {
      localStorage.setItem('studyRoomUsername', localUsername.trim());
      setShowUsernameModal(false);
      window.location.reload();
    }
  }, [localUsername]);

  // Leave room handler
  const handleLeaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId });
    }
    navigate('/');
  }, [roomId, navigate]);

  // Show username modal if needed
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
                autoFocus
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

  // Show connecting state
  if (isConnecting) {
    return (
      <div className="video-call">
        <div className="connecting-overlay">
          <div className="connecting-content">
            <div className="spinner"></div>
            <h2>Connecting to room...</h2>
            <p>Please wait while we set up your connection</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call">
      {/* Background Video */}
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

      {/* Connection Error Notification */}
      {connectionError && (
        <div className="connection-error">
          <span>{connectionError}</span>
        </div>
      )}

      {/* Main content container */}
      <div className="content-container">
        {/* Left Sidebar for Participants */}
        <div className="left-sidebar">
          <div className="participant-list-vertical">
            {/* Local user video */}
            {localUserId && localStream && !isScreenSharing && (
              <div
                className={`video-wrapper local-video-sidebar ${
                  mainViewRemoteUserId === localUserId ? 'active-main-view' : ''
                }`}
                onClick={() => handleParticipantClick(localUserId, localStream)}
              >
                <video ref={localCameraVideoRef} autoPlay playsInline muted={true} />
                <div className="video-label">{getUserDisplayName(localUserId)}</div>
                {isMuted && <div className="media-status muted">🔇</div>}
                {isCameraOff && <div className="media-status camera-off">📹</div>}
              </div>
            )}
            
            {/* Remote participants */}
            {participants
              .filter(p => p.id !== localUserId)
              .map(p => (
                <div
                  key={p.id}
                  className={`video-wrapper ${
                    mainViewRemoteUserId === p.id ? 'active-main-view' : ''
                  }`}
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

        {/* Main Study Area (Screen Share) */}
        <div className="main-study-area">
          {mainViewRemoteStream ? (
            <div className="main-screen-share-wrapper">
              <video autoPlay playsInline srcObject={mainViewRemoteStream} />
              <div className="video-label">
                {getUserDisplayName(mainViewRemoteUserId)} (Viewing)
              </div>
            </div>
          ) : isScreenSharing && localStream ? (
            <div className="main-screen-share-wrapper">
              <video ref={localScreenShareVideoRef} autoPlay playsInline muted={true} />
              <div className="video-label">
                {getUserDisplayName(localUserId)} (Screen Share)
              </div>
            </div>
          ) : (
            <div className="main-background-placeholder">
              <div className="room-info">
                <h2>Room: {roomId}</h2>
                <p>{participants.length} participant{participants.length !== 1 ? 's' : ''} connected</p>
                {isRoomLocked && <p>🔒 Room is locked</p>}
              </div>
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

      {/* Chat Panel */}
     {showChatPanel && (
            <>
                <div className="chat-overlay" onClick={handleCloseChat}></div>
                <ChatPanel
                    messages={chatMessages}
                    onSendMessage={handleSendChatMessage}
                    currentUserId={localUserId}
                    onClose={handleCloseChat} // Pass the close handler
                />
            </>
        )}

      {/* Participants Panel */}
      {showParticipantsPanel && (
        <ParticipantList
          participants={participants}
          joinRequests={joinRequests}
          isCreator={isCreator}
          onJoinRequestResponse={handleJoinRequestResponse}
          onToggleRoomLock={toggleRoomLock}
          isRoomLocked={isRoomLocked}
          connectionQuality={connectionQuality}
          remoteUsersData={remoteUsersData}
          onClose={() => setShowParticipantsPanel(false)}
        />
      )}

      {/* Enhanced Floating Toolbar */}
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
        onToggleChat={() => setShowChatPanel(prev => !prev)}
        onToggleParticipants={() => setShowParticipantsPanel(prev => !prev)}
        onLeaveRoom={handleLeaveRoom}
        participantCount={participants.length}
        unreadMessages={0} // You can implement unread message counting
        isCreator={isCreator}
        isRoomLocked={isRoomLocked}
        onToggleRoomLock={toggleRoomLock}
      />
    </div>
  );
}

export default VideoCall;