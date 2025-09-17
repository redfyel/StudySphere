import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import FloatingToolbar from './FloatingToolbar';
import Notes from './Notes';
import Timer from './Timer';
import StudyTargets from './StudyTargets';
import ParticipantList from './ParticipantList';
import JoinRequests from './JoinRequests';

function VideoCall() {
  const { roomId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [notes, setNotes] = useState('');
  const [timer, setTimer] = useState(0);
  const [targets, setTargets] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const videoRef = useRef(null);
  const socketRef = useRef();

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:3001');

    // Get user media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Emit join room event
        socketRef.current.emit('join-room', roomId);

        // Handle new participants
        socketRef.current.on('user-connected', userId => {
          setParticipants(prev => [...prev, userId]);
        });

        // Handle participant disconnection
        socketRef.current.on('user-disconnected', userId => {
          setParticipants(prev => prev.filter(id => id !== userId));
        });

        // Handle incoming signals
        socketRef.current.on('signal', ({ userId, signal }) => {
          // Handle signaling logic here
        });
      });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

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
      // Stop screen sharing
      const videoTrack = localStream.getVideoTracks()[0];
      const screenTrack = localStream.getVideoTracks().find(track => track.label.includes('screen'));
      if (screenTrack) {
        localStream.removeTrack(screenTrack);
        localStream.addTrack(videoTrack);
        setIsScreenSharing(false);
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = localStream.getVideoTracks()[0];
        localStream.removeTrack(videoTrack);
        localStream.addTrack(screenStream.getVideoTracks()[0]);
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    }
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    // Emit notes update to other participants
    socketRef.current.emit('notes-update', { roomId, notes: e.target.value });
  };

  const handleTimerChange = (newTimer) => {
    setTimer(newTimer);
    // Emit timer update to other participants
    socketRef.current.emit('timer-update', { roomId, timer: newTimer });
  };

  const handleTargetsChange = (newTargets) => {
    setTargets(newTargets);
    // Emit targets update to other participants
    socketRef.current.emit('targets-update', { roomId, targets: newTargets });
  };

  const handleJoinRequest = (userId, action) => {
    // Handle join request approval/rejection
    socketRef.current.emit('join-request-response', { roomId, userId, action });
    if (action === 'approve') {
      setParticipants(prev => [...prev, userId]);
    }
    setJoinRequests(prev => prev.filter(request => request.userId !== userId));
  };

  return (
    <div className="video-call">
      <div className="video-container">
        <video ref={videoRef} autoPlay playsInline muted />
        {remoteStreams.map((stream, index) => (
          <video key={index} autoPlay playsInline srcObject={stream} />
        ))}
      </div>
      <div className="sidebar">
        <Notes notes={notes} onNotesChange={handleNotesChange} />
        <Timer timer={timer} onTimerChange={handleTimerChange} />
        <StudyTargets targets={targets} onTargetsChange={handleTargetsChange} />
        <ParticipantList participants={participants} />
        <JoinRequests requests={joinRequests} onRequestResponse={handleJoinRequest} />
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