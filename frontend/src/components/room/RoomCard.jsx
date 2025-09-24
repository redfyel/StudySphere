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
  const roomType = room.roomType || 'private'; // Default to private for backward compatibility

  const handleJoinRoom = async (e) => {
    e.stopPropagation();
    
    if (isLoading) return;
    
    // Validate room data
    if (!room.roomId || room.roomId === 'undefined') {
      setError('Invalid room ID');
      console.error('Invalid room ID:', room.roomId);
      return;
    }
    
    // Check if room is full
    if (participantCount >= maxParticipants) {
      setError('Room is full');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Joining room:', room.roomId, 'Room data:', room);
      
      // Optional: Verify room exists before navigating
      const response = await fetch(`http://localhost:3001/api/rooms/${room.roomId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Room not found');
        } else {
          throw new Error('Failed to verify room');
        }
      }
      
      const roomData = await response.json();
      console.log('Room verification successful:', roomData);
      
      // Navigate to the video call route with roomId as parameter
      navigate(`/rooms/${room.roomId}`);
      
    } catch (error) {
      console.error('Error joining room:', error);
      setError(error.message || 'Failed to join room');
      
      // If room not found, suggest deletion
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
        return { icon: '🌐', text: 'Public', color: '#10b981' };
      case 'private':
        return { icon: '🔒', text: 'Private', color: '#f59e0b' };
      default:
        return { icon: '🔒', text: 'Private', color: '#f59e0b' };
    }
  };

  const roomTypeDisplay = getRoomTypeDisplay();

  return (
    <div className={`room-card ${getParticipantStatus()} ${roomType}`}>
      {/* Error Display */}
      {error && (
        <div className="room-card-error">
          <span>⚠️ {error}</span>
          <button 
            className="error-dismiss"
            onClick={() => setError(null)}
            title="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="room-card-header">
        <div className="room-info">
          <div className="room-title-row">
            <h3 className="room-name" title={room.name}>
              {room.name || 'Unnamed Room'}
            </h3>
            <div className="room-type-badge" style={{ backgroundColor: roomTypeDisplay.color }}>
              <span className="room-type-icon">{roomTypeDisplay.icon}</span>
              <span className="room-type-text">{roomTypeDisplay.text}</span>
            </div>
          </div>
          {room.topic && (
            <span className="room-topic" title={room.topic}>
              📚 {room.topic}
            </span>
          )}
        </div>
        
        {isOwner && (
          <div className="room-actions">
            <button
              className="delete-btn"
              onClick={handleDeleteRoom}
              title="Delete room"
              aria-label="Delete room"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {room.description && (
        <p className="room-description" title={room.description}>
          {room.description.length > 100 
            ? `${room.description.substring(0, 100)}...` 
            : room.description}
        </p>
      )}

      <div className="room-metadata">
        <div className="participant-info">
          <span className={`participant-count ${getParticipantStatus()}`}>
            👥 {participantCount}/{maxParticipants}
          </span>
          {participantCount > 0 && (
            <span className="live-indicator">
              🔴 Live
            </span>
          )}
        </div>
        
        <div className="room-settings">
          {roomType === 'private' && room.requiresApproval && (
            <span className="approval-required" title="Requires admin approval to join">
              🔐 Approval Required
            </span>
          )}
          {roomType === 'public' && (
            <span className="open-access" title="Anyone can join">
              🚪 Open Access
            </span>
          )}
          {isOwner && (
            <span className="owner-badge" title="You own this room">
              👑 Admin
            </span>
          )}
        </div>
      </div>

      <div className="room-footer">
        <div className="room-footer-info">
          <span className="created-time">
            Created {formatDate(room.createdAt)}
          </span>
          {roomType === 'private' && !isOwner && participantCount > 0 && (
            <span className="join-note">
              ⏳ Admin approval needed
            </span>
          )}
        </div>
        
        <button 
          className={`join-btn ${roomType} ${isLoading ? 'loading' : ''} ${isJoinDisabled() ? 'disabled' : ''}`}
          disabled={isJoinDisabled()}
          onClick={handleJoinRoom}
        >
          {isLoading ? (
            <span className="loading-text">
              <span className="loading-dots">...</span>
              {roomType === 'private' && !isOwner ? 'Requesting...' : 'Joining...'}
            </span>
          ) : error ? (
            'Try Again'
          ) : (
            getRoomStatusText()
          )}
        </button>
      </div>

      {/* Room ID Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info" style={{ 
          fontSize: '10px', 
          color: '#666', 
          marginTop: '5px',
          fontFamily: 'monospace'
        }}>
          ID: {room.roomId || 'undefined'} | Type: {roomType}
        </div>
      )}

      {participantCount >= maxParticipants && (
        <div className="room-full-overlay">
          <span>Room is full</span>
        </div>
      )}
    </div>
  );
}

export default RoomCard;