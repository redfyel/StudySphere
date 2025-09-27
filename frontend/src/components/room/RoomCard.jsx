import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RoomCard.css';

function RoomCard({ room, userId, onDelete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const isOwner = room.createdBy === userId || room.adminId === userId;
  const participantCount = room.currentParticipants || 0;
  const maxParticipants = room.maxParticipants || 50;
  const roomType = room.roomType || 'private';

  const handleJoinRoom = async (e) => {
    e.stopPropagation();
    
    if (isLoading) return;
    
    if (!room.roomId || room.roomId === 'undefined') {
      setError('Invalid room ID');
      console.error('Invalid room ID:', room.roomId);
      return;
    }
    
    if (participantCount >= maxParticipants) {
      setError('Room is full');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Joining room:', room.roomId, 'Room data:', room);
      
      const response = await fetch(`https://studysphere-n4up.onrender.com//api/rooms/${room.roomId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Room not found');
        } else {
          throw new Error('Failed to verify room');
        }
      }
      
      const roomData = await response.json();
      console.log('Room verification successful:', roomData);
      
      navigate(`/room/lobby/${room.roomId}`);
      
    } catch (error) {
      console.error('Error joining room:', error);
      setError(error.message || 'Failed to join room');
      
      if (error.message === 'Room not found' && isOwner) {
        const shouldDelete = window.confirm(
          'This room no longer exists. Would you like to remove it from the list?'
        );
        if (shouldDelete) {
          onDelete(room.roomId);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoom = async (e) => {
    e.stopPropagation();
    
    if (!isOwner) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${room.name}"? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      await onDelete(room.roomId);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      } else if (diffInMinutes < 1440) {
        return `${Math.floor(diffInMinutes / 60)}h ago`;
      } else {
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const getParticipantStatus = () => {
    if (participantCount === 0) return 'empty';
    if (participantCount >= maxParticipants) return 'full';
    if (participantCount >= maxParticipants * 0.8) return 'almost-full';
    if (participantCount >= maxParticipants * 0.5) return 'half-full';
    return 'active';
  };

  const getRoomStatusText = () => {
    if (participantCount >= maxParticipants) return 'Room Full';
    if (participantCount === 0) return 'Start Session';
    if (roomType === 'private' && !isOwner) return 'Request to Join';
    return 'Join Session';
  };

  const isJoinDisabled = () => {
    return isLoading || participantCount >= maxParticipants || !!error;
  };

  const getRoomTypeDisplay = () => {
    switch (roomType) {
      case 'public':
        return { icon: 'public', text: 'Public' };
      case 'private':
        return { icon: 'lock', text: 'Private' };
      default:
        return { icon: 'lock', text: 'Private' };
    }
  };

  const roomTypeDisplay = getRoomTypeDisplay();

  return (
    <div className={`room-card ${getParticipantStatus()} ${roomType}`}>
      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="material-icons error-icon">error</span>
            <span className="error-message">{error}</span>
            <button 
              className="error-close"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Card Header */}
      <div className="card-header">
        <div className="room-title-section">
          <h3 className="room-title">{room.name || 'Unnamed Room'}</h3>
          <div className="room-badges">
            <span className={`type-badge ${roomType}`}>
              <span className="material-icons badge-icon">{roomTypeDisplay.icon}</span>
              <span className="badge-text">{roomTypeDisplay.text}</span>
            </span>
            {isOwner && (
              <span className="owner-badge">
                <span className="material-icons badge-icon">admin_panel_settings</span>
                <span className="badge-text">Owner</span>
              </span>
            )}
          </div>
        </div>
        
        {isOwner && (
          <button
            className="delete-button"
            onClick={handleDeleteRoom}
            title="Delete room"
            aria-label="Delete room"
          >
            <span className="material-icons">delete</span>
          </button>
        )}
      </div>

      {/* Room Topic */}
      {room.topic && (
        <div className="room-topic">
          <span className="material-icons topic-icon">topic</span>
          <span className="topic-text">{room.topic}</span>
        </div>
      )}

      {/* Room Description */}
      {room.description && (
        <div className="room-description">
          <p className="description-text">
            {room.description.length > 120 
              ? `${room.description.substring(0, 120)}...` 
              : room.description}
          </p>
        </div>
      )}

      {/* Participants Section */}
      <div className="participants-section">
        <div className="participant-count">
          <span className="material-icons count-icon">group</span>
          <span className="count-text">{participantCount}/{maxParticipants}</span>
          <span className={`status-indicator ${getParticipantStatus()}`}>
            {participantCount > 0 && <span className="live-dot"></span>}
            {participantCount > 0 ? 'Live' : 'Waiting'}
          </span>
        </div>
        
        <div className="progress-bar">
          <div 
            className={`progress-fill ${getParticipantStatus()}`}
            style={{ width: `${(participantCount / maxParticipants) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Room Settings Info */}
      <div className="room-settings">
        {roomType === 'private' && room.requiresApproval && (
          <div className="setting-item">
            <span className="material-icons setting-icon">verified_user</span>
            <span className="setting-text">Approval Required</span>
          </div>
        )}
        {roomType === 'public' && (
          <div className="setting-item">
            <span className="material-icons setting-icon">meeting_room</span>
            <span className="setting-text">Open Access</span>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="card-footer">
        <div className="footer-info">
          <span className="created-time">
            <span className="material-icons time-icon">schedule</span>
            Created {formatDate(room.createdAt)}
          </span>
          {roomType === 'private' && !isOwner && participantCount > 0 && (
            <span className="join-note">
              <span className="material-icons note-icon">pending</span>
              Admin approval needed
            </span>
          )}
        </div>
        
        <button 
          className={`join-button ${roomType} ${getParticipantStatus()} ${isLoading ? 'loading' : ''}`}
          disabled={isJoinDisabled()}
          onClick={handleJoinRoom}
        >
          <span className="button-content">
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                {roomType === 'private' && !isOwner ? 'Requesting...' : 'Joining...'}
              </>
            ) : error ? (
              <>
                <span className="material-icons button-icon">refresh</span>
                Try Again
              </>
            ) : (
              <>
                <span className="material-icons button-icon">
                  {participantCount >= maxParticipants ? 'block' : 
                   participantCount === 0 ? 'play_arrow' : 'meeting_room'}
                </span>
                {getRoomStatusText()}
              </>
            )}
          </span>
        </button>
      </div>

      {/* Development Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          ID: {room.roomId || 'undefined'} | Type: {roomType}
        </div>
      )}

      {/* Full Room Overlay */}
      {participantCount >= maxParticipants && (
        <div className="full-room-overlay">
          <div className="overlay-content">
            <span className="material-icons overlay-icon">block</span>
            <span className="overlay-text">Room is Full</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomCard;