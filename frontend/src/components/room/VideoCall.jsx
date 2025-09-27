import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
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
  const { user, sessionToken, isAuthenticated } = useAuth();
  const location = useLocation(); 
  
  // Get initial preferences from URL parameters
  const queryParams = new URLSearchParams(location.search);
  const initialName = queryParams.get('name') || user?.username || 'Guest';
  const initialAudio = queryParams.get('audio') === 'true';
  const initialVideo = queryParams.get('video') === 'true';
  
  // State variables
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteUsersData, setRemoteUsersData] = useState({});
  
  // Media controls state
  const [isMuted, setIsMuted] = useState(!initialAudio);
  const [isCameraOff, setIsCameraOff] = useState(!initialVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Room features state
  const [notes, setNotes] = useState('');
  const [timer, setTimer] = useState(0);
  const [targets, setTargets] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [roomType, setRoomType] = useState('private');
  
  // UI state
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUNDS[0]);
  const [mainViewRemoteStream, setMainViewRemoteStream] = useState(null);
  const [mainViewRemoteUserId, setMainViewRemoteUserId] = useState(null);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showTimerPanel, setShowTimerPanel] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
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
  const handleDataChannelMessageRef = useRef();

// ----------------------------------------------------------------------
// CORE UTILITIES AND CALLBACK DEFINITIONS
// ----------------------------------------------------------------------

  const handleCloseChat = useCallback(() => {
    setShowChatPanel(false);
  }, []);

  // Update refs
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // User display name helper
  const getUserDisplayName = useCallback((userId) => {
    if (userId === user?.userId) return `${user.username} (You)`;
    const participant = participants.find(p => p.id === userId);
    const remoteData = remoteUsersData[userId];
    return participant?.name || remoteData?.username || `Guest ${userId?.slice(-4) || 'Unknown'}`;
  }, [user?.userId, user?.username, participants, remoteUsersData]);

  // Data channel message handler (For WebRTC data channels)
  const handleDataChannelMessage = useCallback((senderId, data) => {
    switch (data.type) {
      case 'chat':
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          userId: senderId,
          username: getUserDisplayName(senderId),
          message: data.message,
          timestamp: new Date(),
          type: 'text',
          read: showChatPanel // Mark as read if chat is open when received
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
  }, [getUserDisplayName, showChatPanel]);

  // Update the ref whenever handleDataChannelMessage changes
  useEffect(() => {
    handleDataChannelMessageRef.current = handleDataChannelMessage;
  }, [handleDataChannelMessage]);

  // Initialize media
  const initializeMedia = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      const videoConstraints = initialVideo ? { 
        width: { ideal: 1920 },
        height: { ideal: 1080 },
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
      
      if (stream) {
        stream.getAudioTracks().forEach(track => {
          track.enabled = initialAudio;
        });
        stream.getVideoTracks().forEach(track => {
          track.enabled = initialVideo;
        });
      }
      
      setLocalStream(stream);
      setIsCameraOff(!initialVideo);
      setIsMuted(!initialAudio);
      setConnectionError(null);
    } catch (err) {
      console.error('Media access error:', err);
      setConnectionError('Could not access camera/microphone. Please ensure permissions are granted.');
      
      try {
        if (initialAudio && !initialVideo) {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setLocalStream(audioOnlyStream);
          setIsCameraOff(true);
          setIsMuted(false);
        } else {
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
  }, [initialAudio, initialVideo]);

  // Connection quality monitoring
  const startConnectionMonitoring = useCallback((remoteUserId, peerConnection) => {
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
  }, []);


// 1. FIXED: updatePeerConnectionTracks function - More robust track replacement
const updatePeerConnectionTracks = useCallback(async (newStream) => {
  console.log('Updating peer connection tracks with new stream:', {
    audioTracks: newStream.getAudioTracks().length,
    videoTracks: newStream.getVideoTracks().length,
    streamId: newStream.id
  });

  const peerConnections = peerConnectionsRef.current;
  const audioTrack = newStream.getAudioTracks()[0];
  const videoTrack = newStream.getVideoTracks()[0];

  const updatePromises = Object.keys(peerConnections).map(async (remoteUserId) => {
    const pc = peerConnections[remoteUserId];
    if (pc.connectionState === 'closed' || pc.connectionState === 'failed') {
      console.log(`Skipping track update for ${remoteUserId} - connection state: ${pc.connectionState}`);
      return;
    }

    try {
      console.log(`Updating tracks for peer: ${remoteUserId}`);
      
      // Get all current senders
      const senders = pc.getSenders();
      const videoSender = senders.find(sender => sender.track?.kind === 'video');
      const audioSender = senders.find(sender => sender.track?.kind === 'audio');

      // Handle VIDEO track replacement
      if (videoTrack) {
        if (videoSender) {
          console.log(`Replacing video track for ${remoteUserId}`);
          await videoSender.replaceTrack(videoTrack);
        } else {
          console.log(`Adding new video track for ${remoteUserId}`);
          pc.addTrack(videoTrack, newStream);
        }
      } else if (videoSender && videoSender.track) {
        console.log(`Removing video track for ${remoteUserId}`);
        await videoSender.replaceTrack(null);
      }

      // Handle AUDIO track replacement  
      if (audioTrack) {
        if (audioSender) {
          console.log(`Replacing audio track for ${remoteUserId}`);
          await audioSender.replaceTrack(audioTrack);
        } else {
          console.log(`Adding new audio track for ${remoteUserId}`);
          pc.addTrack(audioTrack, newStream);
        }
      } else if (audioSender && audioSender.track) {
        console.log(`Removing audio track for ${remoteUserId}`);
        await audioSender.replaceTrack(null);
      }

      // Force renegotiation after track updates
      console.log(`Forcing renegotiation for ${remoteUserId}`);
      if (pc.signalingState === 'stable') {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);
        
        if (socketRef.current?.connected) {
          socketRef.current.emit('signal', {
            targetUserId: remoteUserId,
            signal: pc.localDescription,
          });
          console.log(`Sent renegotiation offer to ${remoteUserId}`);
        }
      }

    } catch (error) {
      console.error(`Error updating tracks for ${remoteUserId}:`, error);
    }
  });

  await Promise.allSettled(updatePromises);
  console.log('Track update complete for all peers');
}, []);


  // 3. FIXED: createPeerConnection - Better handling of remote streams
  const createPeerConnection = useCallback((remoteUserId, isInitiator = false) => {
    console.log('Creating peer connection for:', remoteUserId, 'isInitiator:', isInitiator);
    
    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10
    });

    // Add local stream tracks if available
    if (localStreamRef.current && localStreamRef.current.getTracks().length > 0) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`Adding ${track.kind} track to peer connection for:`, remoteUserId);
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Enhanced remote stream handling
    peerConnection.ontrack = (event) => {
      console.log('Received remote track from:', remoteUserId, event.track.kind);
      const remoteStream = event.streams[0];
      
      if (!remoteStream) {
        console.error('No remote stream received');
        return;
      }
      
      console.log('Remote stream details:', {
        id: remoteStream.id,
        videoTracks: remoteStream.getVideoTracks().length,
        audioTracks: remoteStream.getAudioTracks().length
      });
      
      setRemoteStreams(prev => ({ 
        ...prev, 
        [remoteUserId]: remoteStream 
      }));

      // Auto-focus screen shares with delay to ensure state is updated
      setTimeout(() => {
        setRemoteUsersData(current => {
          const userData = current[remoteUserId];
          if (userData?.isScreenSharing) {
            console.log('Auto-focusing remote screen share from:', remoteUserId);
            setActiveScreenShareUserId(remoteUserId);
            setMainViewRemoteStream(remoteStream);
            setMainViewRemoteUserId(remoteUserId);
          }
          return current;
        });
      }, 1000);
    };

    // ICE candidate handling
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.connected) {
        console.log('Sending ICE candidate to:', remoteUserId);
        socketRef.current.emit('ice-candidate', {
          targetUserId: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    // Negotiation needed
    peerConnection.onnegotiationneeded = async () => {
      try {
        console.log('Negotiation needed with:', remoteUserId);
        if (peerConnection.signalingState === 'stable') {
          const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await peerConnection.setLocalDescription(offer);
          
          if (socketRef.current?.connected) {
            console.log('Sending offer to:', remoteUserId);
            socketRef.current.emit('signal', {
              targetUserId: remoteUserId,
              signal: peerConnection.localDescription,
            });
          }
        }
      } catch (err) {
        console.error('Error in negotiation with', remoteUserId, ':', err);
      }
    };

    // Connection state monitoring
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log(`Connection state with ${remoteUserId}:`, state);
      
      setConnectionQuality(prev => ({
        ...prev,
        [remoteUserId]: state
      }));

      if (state === 'failed') {
        console.log(`Connection failed with ${remoteUserId}, attempting restart`);
        setTimeout(() => {
          if (peerConnection.connectionState === 'failed') {
            peerConnection.restartIce();
          }
        }, 2000);
      }
    };

    // Data channel setup (existing code)
    const dataChannel = peerConnection.createDataChannel('chat', { ordered: true });
    dataChannel.onopen = () => console.log(`Data channel opened with ${remoteUserId}`);
    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleDataChannelMessageRef.current?.(remoteUserId, data);
      } catch (err) {
        console.error('Error parsing data channel message:', err);
      }
    };
    
    dataChannelsRef.current[remoteUserId] = dataChannel;
    
    peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleDataChannelMessageRef.current?.(remoteUserId, data);
        } catch (err) {
          console.error('Error parsing incoming data channel message:', err);
        }
      };
    };

    startConnectionMonitoring(remoteUserId, peerConnection);
    peerConnectionsRef.current[remoteUserId] = peerConnection;

    return peerConnection;
  }, [startConnectionMonitoring]);

  // 4. FIXED: handleSignal - Better signaling handling
  const handleSignal = useCallback(async (senderUserId, signal) => {
    console.log('Handling signal from:', senderUserId, 'type:', signal.type);
    
    if (!localStreamRef.current) {
      console.warn('No local stream available for signaling');
      return;
    }

    let peerConnection = peerConnectionsRef.current[senderUserId];
    if (!peerConnection) {
      console.log('Creating new peer connection for:', senderUserId);
      peerConnection = createPeerConnection(senderUserId);
    }

    try {
      if (signal.type === 'offer' || signal.type === 'answer') {
        const canSetRemote = 
          peerConnection.signalingState === 'stable' || 
          peerConnection.signalingState === 'have-local-offer' ||
          signal.type === 'answer';

        if (canSetRemote) {
          console.log(`Setting remote description for ${senderUserId}`);
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
          
          if (signal.type === 'offer') {
            console.log(`Creating answer for ${senderUserId}`);
            const answer = await peerConnection.createAnswer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true
            });
            await peerConnection.setLocalDescription(answer);
            
            if (socketRef.current?.connected) {
              console.log(`Sending answer to ${senderUserId}`);
              socketRef.current.emit('signal', {
                targetUserId: senderUserId,
                signal: peerConnection.localDescription,
              });
            }
          }
        } else {
          console.warn(`Cannot set remote description for ${senderUserId}, state:`, peerConnection.signalingState);
        }
      }
    } catch (err) {
      console.error('Error handling signal from', senderUserId, ':', err);
    }
  }, [createPeerConnection]);

  // **CRITICAL FIX FUNCTION:** handleIceCandidate
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


// ----------------------------------------------------------------------
// REACT HOOKS AND EFFECTS
// ----------------------------------------------------------------------


  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !sessionToken || !user) {
      navigate('/auth', { replace: true });
      return;
    }
  }, [isAuthenticated, sessionToken, user, navigate]);

  // Initialize media on component mount
  useEffect(() => {
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

// The actual track replacement is now called manually inside toggleScreenShare/toggleCamera
// This useEffect is kept primarily for logging/debugging (as per corrected guidance)
  useEffect(() => {
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];
    const videoTrack = localStream.getVideoTracks()[0];

    console.log('Local stream updated:', {
      audio: !!audioTrack,
      video: !!videoTrack,
      audioEnabled: audioTrack?.enabled,
      videoEnabled: videoTrack?.enabled,
      isScreenSharing,
      isCameraOff,
      isMuted
    });

    return () => {}; 

  }, [localStream, isScreenSharing, isCameraOff, isMuted]);

  // Debug logging hook (Temporary)
  useEffect(() => {
    console.log('Chat messages updated:', chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    console.log('Socket connection status:', socketRef.current?.connected);
    console.log('User data:', { userId: user?.userId, username: user?.username });
  }, [user]);
  // End Debug logging hook
  
  // Hook to mark messages as read when chat panel opens
  useEffect(() => {
    if (showChatPanel) {
      setChatMessages(prevMessages => 
        prevMessages.map(msg => ({ ...msg, read: true }))
      );
    }
  }, [showChatPanel]);


  // Fullscreen handlers
  const toggleFullScreen = useCallback(() => {
    if (!isFullScreen) {
      if (fullScreenRef.current?.requestFullscreen) {
        fullScreenRef.current.requestFullscreen();
        setIsFullScreen(true);
      } else if (document.documentElement?.requestFullscreen) {
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

  // FIXED: Media control functions with delayed notifications
  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      
      // Delayed notification to prevent disconnections
      if (socketRef.current?.connected) {
        setTimeout(() => {
          if (socketRef.current?.connected) {
            socketRef.current.emit('media-state-update', { 
              isMuted: newMutedState,
              isCameraOff,
              isScreenSharing
            });
          }
        }, 200);
      }
    }
  }, [localStream, isMuted, isCameraOff, isScreenSharing]);

  // **CORRECTED AND IMPROVED:** toggleCamera
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
        
        // Update peer connections
        await updatePeerConnectionTracks(updatedStream);
      }
    } else {
      // Turn on camera
      try {
        const newVideoMedia = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          } 
        });
        const newVideoTrack = newVideoMedia.getVideoTracks()[0];
        
        let updatedStream;
        if (localStream) {
          localStream.addTrack(newVideoTrack);
          updatedStream = new MediaStream([...localStream.getTracks()]);
        } else {
          const fullStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1920 }, 
              height: { ideal: 1080 },
              frameRate: { ideal: 30 }
            }, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          updatedStream = fullStream;
        }
        
        setLocalStream(updatedStream);
        setIsCameraOff(false);
        
        // Update peer connections
        await updatePeerConnectionTracks(updatedStream);
        
      } catch (err) {
        console.error('Camera access error:', err);
        alert('Could not access camera. Please ensure permissions are granted.');
        return;
      }
    }

    // Delayed notification to prevent disconnections
    if (socketRef.current?.connected) {
      setTimeout(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit('media-state-update', { 
            isMuted,
            isCameraOff: !isCameraOff,
            isScreenSharing
          });
        }
      }, 300);
    }
  }, [localStream, isMuted, isCameraOff, isScreenSharing, updatePeerConnectionTracks]);

  // 2. FIXED: toggleScreenShare function - Proper stream management
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // --- STOP SCREEN SHARING ---
      console.log('Stopping screen share...');
      
      // Stop current screen share tracks
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }

      try {
        // Get fresh camera/audio stream
        const constraints = {
          video: initialVideo ? { 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 }, 
            frameRate: { ideal: 30 } 
          } : false,
          audio: initialAudio ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } : false
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Apply current mute/camera state
        newStream.getAudioTracks().forEach(track => (track.enabled = !isMuted));
        newStream.getVideoTracks().forEach(track => (track.enabled = !isCameraOff));
        
        setLocalStream(newStream);
        setIsScreenSharing(false);

        // Clear screen share UI state
        if (activeScreenShareUserId === user?.userId) {
          setActiveScreenShareUserId(null);
          setMainViewRemoteStream(null);
          setMainViewRemoteUserId(null);
        }

        // Update peer connections with new stream
        await updatePeerConnectionTracks(newStream);

        // Notify server
        if (socketRef.current?.connected) {
          socketRef.current.emit('screen-share-stop', { roomId });
          
          // Wait before sending media state update
          setTimeout(() => {
            if (socketRef.current?.connected) {
              socketRef.current.emit('media-state-update', { 
                isMuted,
                isCameraOff,
                isScreenSharing: false
              });
            }
          }, 1000);
        }

      } catch (err) {
        console.error('Error stopping screen share:', err);
        // Fallback
        const emptyStream = new MediaStream();
        setLocalStream(emptyStream);
        setIsScreenSharing(false);
        setIsCameraOff(true);
        await updatePeerConnectionTracks(emptyStream);
      }

    } else {
      // --- START SCREEN SHARING ---
      console.log('Starting screen share...');
      
      // Stop current camera/audio tracks
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped ${track.kind} track before screen share`);
        });
      }
      
      try {
        // Get screen share stream
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 }, 
            frameRate: { ideal: 30 } 
          }, 
          audio: true 
        });
        
        console.log('Screen share stream obtained:', {
          videoTracks: screenStream.getVideoTracks().length,
          audioTracks: screenStream.getAudioTracks().length
        });
        
        setLocalStream(screenStream);
        setIsScreenSharing(true);
        setIsCameraOff(true);
        
        // Set as active screen share in UI
        setActiveScreenShareUserId(user?.userId);
        setMainViewRemoteStream(screenStream);
        setMainViewRemoteUserId(user?.userId);
        
        // Handle native screen share stop
        const videoTrack = screenStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            console.log('Screen share ended via browser UI');
            if (isScreenSharing) {
              toggleScreenShare();
            }
          };
        }

        // Update peer connections with screen share stream
        await updatePeerConnectionTracks(screenStream);
        
        // Notify server
        if (socketRef.current?.connected) {
          socketRef.current.emit('screen-share-start', { roomId });
          
          // Wait before sending media state update
          setTimeout(() => {
            if (socketRef.current?.connected) {
              socketRef.current.emit('media-state-update', { 
                isMuted,
                isCameraOff: true,
                isScreenSharing: true
              });
            }
          }, 1000);
        }
        
      } catch (err) {
        console.error('Screen share failed:', err);
        if (err.name !== 'NotAllowedError') {
          alert('Could not start screen sharing. Please ensure permissions are granted.');
        }
        // Fallback to camera
        initializeMedia();
      }
    }
  }, [
    localStream, 
    isScreenSharing, 
    roomId, 
    user?.userId, 
    isMuted, 
    isCameraOff, 
    activeScreenShareUserId, 
    initialVideo, 
    initialAudio, 
    updatePeerConnectionTracks,
    initializeMedia
  ]);


// ----------------------------------------------------------------------
// SOCKET CONNECTION HOOK (NOW DEFINED AFTER ALL CALLBACKS)
// ----------------------------------------------------------------------

  // Socket connection and event handlers
  useEffect(() => {
    // Prevent socket setup until dependencies (like localStream) are ready
    if (!localStream || !user?.userId) {
        return;
    }

    // NOTE: Changed port back to 3001 as per previous correct code structure, assuming 5000 was a typo.
    socketRef.current = io('https://studysphere-n4up.onrender.com/', { 
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
      setIsConnecting(false);

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
          // When we join a room, we are not the initiator for existing users, so no true flag is needed here.
          setTimeout(() => createPeerConnection(p.id, false), 1000); 
        }
      });

      setTimeout(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit('media-state-update', { 
            isMuted: !initialAudio,
            isCameraOff: !initialVideo,
            isScreenSharing: false
          });
        }
      }, 2000);
    });

    // Handle join request sent
    socketRef.current.on('join-request-sent', ({ roomId, message, shouldWait }) => {
      if (shouldWait) {
        setIsConnecting(false);
        setConnectionError(null);
        setIsWaitingForApproval(true);
        alert(message);
      }
    });

    // FIXED: Handle join approval
    socketRef.current.on('join-approved', ({
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

      setTimeout(() => {
        initialParticipants.forEach(p => {
          if (p.id !== user.userId) {
            createPeerConnection(p.id, false);
          }
        });
      }, 1500);

      setTimeout(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit('media-state-update', { 
            isMuted: !initialAudio,
            isCameraOff: !initialVideo,
            isScreenSharing: false
          });
        }
      }, 3000);

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

    socketRef.current.on('authentication-required', ({ message }) => {
      console.error('Authentication required:', message);
      alert('Session expired. Please log in again.');
      navigate('/auth', { replace: true });
    });

    // **FIXED:** Handle new user connected (The screen sharer initiates the negotiation)
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

      if (userId !== user.userId) {
          // We are the initiator of the negotiation when a new user joins, so pass 'true'.
        setTimeout(() => createPeerConnection(userId, true), 500); 
      }
    });

    socketRef.current.on('user-disconnected', (userId) => {
      console.log('User disconnected:', userId);
      
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

      if (activeScreenShareUserId === userId) {
        setActiveScreenShareUserId(null);
        setMainViewRemoteStream(null);
        setMainViewRemoteUserId(null);
      }

      if (peerConnectionsRef.current[userId]) {
        peerConnectionsRef.current[userId].close();
        delete peerConnectionsRef.current[userId];
      }

      if (dataChannelsRef.current[userId]) {
        dataChannelsRef.current[userId].close();
        delete dataChannelsRef.current[userId];
      }

      if (connectionStatsIntervals.current[userId]) {
        clearInterval(connectionStatsIntervals.current[userId]);
        delete connectionStatsIntervals.current[userId];
      }

      if (mainViewRemoteUserId === userId) {
        setMainViewRemoteStream(null);
        setMainViewRemoteUserId(null);
      }
    });

    // WebRTC signaling
    socketRef.current.on('signal', ({ userId, signal }) => {
      handleSignal(userId, signal);
    });

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

    socketRef.current.on('room-lock-status', (locked) => {
      setIsRoomLocked(locked);
    });

    // 2. Fix socket chat-message event handler
    socketRef.current.on('chat-message', (messageData) => {
      // Don't add our own messages again (already added locally)
      if (messageData.userId !== user?.userId) {
        const formattedMessage = {
          id: messageData.id || Date.now(),
          userId: messageData.userId,
          username: messageData.username || 'Unknown User',
          message: messageData.message,
          timestamp: messageData.timestamp ? new Date(messageData.timestamp) : new Date(),
          type: messageData.type || 'text',
          read: showChatPanel // Mark as read if chat panel is currently open
        };
        setChatMessages(prev => [...prev, formattedMessage]);
      }
    });

    // FIXED: Media state change notifications
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

      if (isScreenSharing) {
        setActiveScreenShareUserId(userId);
        setTimeout(() => {
          setRemoteStreams(currentStreams => {
            if (currentStreams[userId]) {
              setMainViewRemoteStream(currentStreams[userId]);
              setMainViewRemoteUserId(userId);
            }
            return currentStreams;
          });
        }, 500);
      } else if (!isScreenSharing && activeScreenShareUserId === userId) {
        setActiveScreenShareUserId(null);
        if (mainViewRemoteUserId === userId) {
          setMainViewRemoteStream(null);
          setMainViewRemoteUserId(null);
        }
      }
    });

    // FIXED: Enhanced screen sharing events
    socketRef.current.on('user-screen-share-start', ({ userId, username }) => {
      console.log(`User ${username} started screen sharing`);
      setRemoteUsersData(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isScreenSharing: true, username }
      }));
      setParticipants(prev => prev.map(p => 
        p.id === userId ? { ...p, isScreenSharing: true } : p
      ));
      setActiveScreenShareUserId(userId);
      
      const checkForStream = (attempts = 0) => {
        if (attempts > 10) return;
        
        setRemoteStreams(currentStreams => {
          if (currentStreams[userId]) { // Check if stream exists (it should, from ontrack/renegotiation)
            console.log('Auto-focusing screen share from:', username);
            setMainViewRemoteStream(currentStreams[userId]);
            setMainViewRemoteUserId(userId);
          } else {
            setTimeout(() => checkForStream(attempts + 1), 500);
          }
          return currentStreams;
        });
      };
      
      setTimeout(() => checkForStream(), 500);
    });

    socketRef.current.on('user-screen-share-stop', ({ userId }) => {
      console.log(`User stopped screen sharing: ${userId}`);
      setRemoteUsersData(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isScreenSharing: false }
      }));
      setParticipants(prev => prev.map(p => 
        p.id === userId ? { ...p, isScreenSharing: false } : p
      ));
      
      if (activeScreenShareUserId === userId) {
        setActiveScreenShareUserId(null);
        if (mainViewRemoteUserId === userId) {
          setMainViewRemoteStream(null);
          setMainViewRemoteUserId(null);
        }
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

    // Admin control events
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
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      peerConnectionsRef.current = {};
      
      Object.values(dataChannelsRef.current).forEach(dc => dc.close());
      dataChannelsRef.current = {};

      Object.values(connectionStatsIntervals.current).forEach(interval => {
        clearInterval(interval);
      });
      connectionStatsIntervals.current = {};
    };
  }, [
    roomId, 
    user, 
    sessionToken, 
    isAuthenticated, 
    navigate, 
    createPeerConnection, 
    handleSignal, 
    handleIceCandidate, 
    isCreator, 
    initialAudio, 
    initialVideo, 
    activeScreenShareUserId, 
    remoteStreams, 
    mainViewRemoteUserId, 
    localStream
    // Removed showChatPanel dependency to prevent accidental disconnections
  ]); 

// ----------------------------------------------------------------------
// UI EVENT HANDLERS
// ----------------------------------------------------------------------


  // UI event handlers
  const handleBackgroundChange = useCallback((newBackgroundUrl) => {
    const newBackground = BACKGROUNDS.find(bg => bg.url === newBackgroundUrl);
    setSelectedBackground(newBackground);
    if (!activeScreenShareUserId) {
      setMainViewRemoteStream(null);
      setMainViewRemoteUserId(null);
    }
  }, [activeScreenShareUserId]);

  // **FIXED:** Participant click logic to focus on camera or screen share
  const handleParticipantClick = useCallback((participantId, stream) => {
    if (!stream) return; // Cannot focus on a participant without a stream

    const isUserScreenSharing = remoteUsersData[participantId]?.isScreenSharing ||
                               (participantId === user?.userId && isScreenSharing);
    
    // 1. If the participant is currently screen sharing (remote or local), focus on that.
    if (isUserScreenSharing) {
      setActiveScreenShareUserId(participantId);
      setMainViewRemoteStream(stream);
      setMainViewRemoteUserId(participantId);
      return;
    }

    // 2. If the user clicked on the currently focused camera/stream, unfocus.
    if (mainViewRemoteUserId === participantId) {
      // If no one is screen sharing, clear the main view
      if (!activeScreenShareUserId) {
        setMainViewRemoteStream(null);
        setMainViewRemoteUserId(null);
      }
    } else {
      // 3. If they clicked a different camera/stream, focus on it.
      // Only focus camera if no one is currently screen sharing in the main view.
      if (!activeScreenShareUserId) {
        setMainViewRemoteStream(stream);
        setMainViewRemoteUserId(participantId);
      }
    }
  }, [mainViewRemoteUserId, activeScreenShareUserId, remoteUsersData, user?.userId, isScreenSharing]);

  // Room feature handlers
  const handleNotesChange = useCallback((e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (socketRef.current?.connected && isCreator) {
      socketRef.current.emit('notes-update', { roomId, notes: newNotes });
    }
  }, [roomId, isCreator]);

  const handleTimerChange = useCallback((newTimer) => {
    setTimer(newTimer);
    if (socketRef.current?.connected && isCreator) {
      socketRef.current.emit('timer-update', { roomId, timer: newTimer });
    }
  }, [roomId, isCreator]);

  const handleTargetsChange = useCallback((newTargets) => {
    setTargets(newTargets);
    if (socketRef.current?.connected && isCreator) {
      socketRef.current.emit('targets-update', { roomId, targets: newTargets });
    }
  }, [roomId, isCreator]);

  const handleJoinRequestResponse = useCallback((requesterId, action) => {
    setJoinRequests(prev => prev.filter(req => req.userId !== requesterId));
    if (socketRef.current?.connected && isCreator) {
      socketRef.current.emit('join-request-response', { roomId, userId: requesterId, action });
    }
  }, [roomId, isCreator]);

  // 1. Fix handleSendChatMessage function
  const handleSendChatMessage = useCallback((message) => {
    if (socketRef.current?.connected && message.trim()) {
      // Create the message object locally first
      const newMessage = {
        id: Date.now(),
        userId: user?.userId,
        username: user?.username || 'You',
        message: message.trim(),
        timestamp: new Date().toISOString(), // Use ISO string for reliable transport
        type: 'text',
        read: true // Always mark locally sent messages as read
      };
      
      // Add to local state immediately for better UX
      setChatMessages(prev => [...prev, newMessage]);
      
      // Send to server
      socketRef.current.emit('chat-message', { roomId, message: message.trim(), id: newMessage.id, timestamp: newMessage.timestamp });
    }
  }, [roomId, user?.userId, user?.username]);

  const toggleRoomLock = useCallback(() => {
    if (isCreator && socketRef.current?.connected) {
      socketRef.current.emit('toggle-room-lock', { roomId });
    }
  }, [isCreator, roomId]);

  // Admin actions
  const onAdminMuteParticipant = useCallback((participantId, isMutedState) => {
    if (socketRef.current?.connected && isCreator) {
      socketRef.current.emit('admin-mute-participant', { roomId, participantId, isMuted: isMutedState });
    }
  }, [isCreator, roomId]);

  const onAdminRemoveParticipant = useCallback((participantId) => {
    if (socketRef.current?.connected && isCreator) {
      socketRef.current.emit('admin-remove-participant', { roomId, participantId });
    }
  }, [isCreator, roomId]);

  const onAdminToggleParticipantCamera = useCallback((participantId, isCameraOffState) => {
    if (socketRef.current?.connected && isCreator) {
      socketRef.current.emit('admin-toggle-participant-camera', { roomId, participantId, isCameraOff: isCameraOffState });
    }
  }, [isCreator, roomId]);

  const handleLeaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    navigate('/room');
  }, [navigate]);

  const handleCancelWaiting = useCallback(() => {
    setIsWaitingForApproval(false);
    navigate('/room');
  }, [navigate]);

  // FIXED: Enhanced main content logic (Removed conditional ref for React warning)
  const getMainContent = () => {
    if (activeScreenShareUserId) {
      const screenShareStream = activeScreenShareUserId === user?.userId ? localStream : remoteStreams[activeScreenShareUserId];
      const screenShareUser = getUserDisplayName(activeScreenShareUserId);
      
      if (screenShareStream) {
        return (
          <div className="main-screen-share-wrapper" ref={fullScreenRef}>
            <video 
              // Removed conditional ref to fix React DOM warning
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
    }

    if (!activeScreenShareUserId && mainViewRemoteStream && mainViewRemoteUserId) {
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

    return null;
  };

  if (!isAuthenticated || !sessionToken || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (isWaitingForApproval) {
    return <WaitingForApproval roomId={roomId} onCancel={handleCancelWaiting} />;
  }

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
            <div className="connection-error">
              <span>{connectionError}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`video-call ${isFullScreen ? 'fullscreen-mode' : ''}`}>
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

      {connectionError && (
        <div className="connection-error">
          <span>{connectionError}</span>
        </div>
      )}

      <div className="content-container">
        {!isFullScreen && (
          <div className="left-sidebar">
            <div className="participant-list-vertical">
              {user?.userId && localStream && (
                <div
                  className={`video-wrapper local-video-sidebar enhanced-video ${
                    mainViewRemoteUserId === user.userId ? 'active-main-view' : ''
                  } ${isScreenSharing ? 'screen-sharing-user' : ''}`}
                  onClick={() => handleParticipantClick(user.userId, localStream)}
                >
                  <video 
                    ref={isScreenSharing ? localScreenShareVideoRef : localCameraVideoRef} 
                    autoPlay 
                    playsInline 
                    muted={true} 
                  />
                  <div className="video-label">{getUserDisplayName(user.userId)}</div>
                  {isMuted && <div className="media-status muted">🔇</div>}
                  {isCameraOff && !isScreenSharing && <div className="media-status camera-off">📹</div>}
                  {isScreenSharing && <div className="media-status screen-sharing">🖥️</div>}
                </div>
              )}
              
              {participants
                .filter(p => p.id !== user?.userId)
                .map(p => {
                  const isUserScreenSharing = remoteUsersData[p.id]?.isScreenSharing;
                  return (
                    <div
                      key={p.id}
                      className={`video-wrapper enhanced-video ${
                        mainViewRemoteUserId === p.id ? 'active-main-view' : ''
                      } ${isUserScreenSharing ? 'screen-sharing-user' : ''}`}
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
                      
                      <div className={`connection-quality ${connectionQuality[p.id] || 'unknown'}`}>
                        <span>●</span>
                      </div>
                      
                      {remoteUsersData[p.id]?.isMuted && (
                        <div className="media-status muted">🔇</div>
                      )}
                      {remoteUsersData[p.id]?.isCameraOff && !isUserScreenSharing && (
                        <div className="media-status camera-off">📹</div>
                      )}
                      {isUserScreenSharing && (
                        <div className="media-status screen-sharing">🖥️</div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <div className="main-study-area">
          {getMainContent()}
        </div>

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

      {showChatPanel && !isFullScreen && (
        <>
          <div className="chat-overlay" onClick={handleCloseChat}></div>
          {/* 3. Update ChatPanel props */}
          <ChatPanel
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
            currentUserId={user?.userId}
            onClose={handleCloseChat}
            typingUsers={[]} 
            embedded={true} 
          />
        </>
      )}

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

      {!isFullScreen && (
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
         
          unreadMessages={chatMessages.filter(msg => !msg.read && msg.userId !== user?.userId).length}
          isCreator={isCreator}
          isRoomLocked={isRoomLocked}
          onToggleRoomLock={toggleRoomLock}
          roomType={roomType}
          joinRequestsCount={joinRequests.length}
          activeScreenShareUserId={activeScreenShareUserId}
          // Passing Fullscreen state and function
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
