import React from 'react';
import './ParticipantList.css';

function ParticipantList({ 
  participants, 
  joinRequests, 
  isCreator, 
  isAdmin,
  roomType,
  onJoinRequestResponse, 
  onToggleRoomLock, 
  isRoomLocked, 
  connectionQuality, 
  remoteUsersData, 
  onClose 
}) {
  const getConnectionStatus = (userId) => {
    const quality = connectionQuality[userId];
    if (typeof quality === 'string') {
      switch (quality) {
        case 'connected': return { status: 'good', color: '#4CAF50', text: 'Connected' };
        case 'connecting': return { status: 'fair', color: '#FF9800', text: 'Connecting' };
        case 'disconnected': return { status: 'poor', color: '#f44336', text: 'Disconnected' };
        case 'failed': return { status: 'poor', color: '#f44336', text: 'Failed' };
        default: return { status: 'unknown', color: '#9E9E9E', text: 'Unknown' };
      }
    }
    return { status: 'unknown', color: '#9E9E9E', text: 'Unknown' };
  };

  const formatJoinTime = (timestamp) => {
    const now = new Date();
    const joinTime = new Date(timestamp);
    const diffMinutes = Math.floor((now - joinTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return `${Math.floor(diffMinutes / 60)}h ago`;
  };

  const getRoomTypeDisplay = () => {
    switch (roomType) {
      case 'public':
        return { icon: '🌐', text: 'Public Room', color: '#10b981' };
      case 'private':
        return { icon: '🔒', text: 'Private Room', color: '#f59e0b' };
      default:
        return { icon: '🔒', text: 'Private Room', color: '#f59e0b' };
    }
  };

  const roomTypeDisplay = getRoomTypeDisplay();

  return (
    <div className="participant-list-panel">
      <div className="participant-list-header">
        <h3>Room Participants</h3>
        <button className="close-btn" onClick={onClose} aria-label="Close participants panel">
          ×
        </button>
      </div>

      {/* Room Info Section */}
      <div className="room-info-section">
        <div className="room-type-display" style={{ backgroundColor: `${roomTypeDisplay.color}15`, borderColor: roomTypeDisplay.color }}>
          <span className="room-type-icon">{roomTypeDisplay.icon}</span>
          <span className="room-type-label">{roomTypeDisplay.text}</span>
          {roomType === 'private' && isRoomLocked && (
            <span className="lock-status">🔐 Approval Required</span>
          )}
          {roomType === 'public' && (
            <span className="open-status">🚪 Open Access</span>
          )}
        </div>
      </div>

      {/* Room Controls - Only show to creator for private rooms */}
      {isCreator && roomType === 'private' && (
        <div className="room-controls">
          <div className="room-lock-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isRoomLocked}
                onChange={onToggleRoomLock}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="control-label">
              {isRoomLocked ? '🔐 Approval Required' : '🔓 No Approval Needed'}
            </span>
            <small className="control-description">
              {isRoomLocked 
                ? 'New participants need your approval to join' 
                : 'New participants can join your private room directly'}
            </small>
          </div>
        </div>
      )}

      {/* Join Requests Section - Only show to admins when there are requests */}
      {(isAdmin || isCreator) && joinRequests && joinRequests.length > 0 && (
        <div className="join-requests-section">
          <h4 className="section-title">
            <span className="requests-icon">✋</span>
            Pending Join Requests ({joinRequests.length})
          </h4>
          <div className="join-requests-list">
            {joinRequests.map((request) => (
              <div key={request.userId} className="join-request-item">
                <div className="request-info">
                  <div className="request-user">
                    <div className="user-avatar">
                      {request.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="user-details">
                      <span className="username">{request.username}</span>
                      <span className="request-time">
                        Requested {formatJoinTime(request.requestedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="request-actions">
                  <button
                    className="approve-btn"
                    onClick={() => onJoinRequestResponse(request.userId, 'approve')}
                    title={`Approve ${request.username}`}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => onJoinRequestResponse(request.userId, 'reject')}
                    title={`Reject ${request.username}`}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Join Requests Message for Admins */}
      {(isAdmin || isCreator) && roomType === 'private' && (!joinRequests || joinRequests.length === 0) && (
        <div className="no-requests-section">
          <div className="no-requests-message">
            <span className="no-requests-icon">👥</span>
            <p>No pending join requests</p>
            <small>
              {isRoomLocked 
                ? 'Users will need your approval to join this private room'
                : 'Users can join this private room directly'}
            </small>
          </div>
        </div>
      )}

      {/* Current Participants Section */}
      <div className="current-participants-section">
        <h4 className="section-title">
          <span className="participants-icon">👥</span>
          Current Participants ({participants.length})
        </h4>
        <div className="participants-list">
          {participants.length === 0 ? (
            <div className="no-participants">
              <span className="empty-icon">🏠</span>
              <p>No participants yet</p>
              <small>Share the room link to invite others</small>
            </div>
          ) : (
            participants.map((participant) => {
              const userData = remoteUsersData[participant.id] || {};
              const connection = getConnectionStatus(participant.id);
              
              return (
                <div key={participant.id} className="participant-item">
                  <div className="participant-avatar">
                    <div className="avatar-circle">
                      {participant.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div 
                      className="connection-indicator"
                      style={{ backgroundColor: connection.color }}
                      title={`Connection: ${connection.text}`}
                    ></div>
                  </div>
                  
                  <div className="participant-info">
                    <div className="participant-name">
                      {participant.name || 'Unknown User'}
                      {(participant.isAdmin || participant.isCreator) && (
                        <span className="admin-badge" title="Room Admin">👑</span>
                      )}
                      {participant.isCreator && (
                        <span className="creator-badge" title="Room Creator">⭐</span>
                      )}
                    </div>
                    <div className="participant-status">
                      {/* Media status indicators */}
                      <div className="media-indicators">
                        {(userData.isMuted || participant.isMuted) && (
                          <span className="media-icon muted" title="Muted">🔇</span>
                        )}
                        {(userData.isCameraOff || participant.isCameraOff) && (
                          <span className="media-icon camera-off" title="Camera off">📹</span>
                        )}
                        {(userData.isScreenSharing || participant.isScreenSharing) && (
                          <span className="media-icon screen-sharing" title="Screen sharing">🖥️</span>
                        )}
                      </div>
                      <span className="connection-status" style={{ color: connection.color }}>
                        {connection.text}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-section">
          <h5>Debug Info:</h5>
          <div className="debug-grid">
            <div className="debug-item">
              <strong>Is Creator:</strong> {isCreator ? 'Yes' : 'No'}
            </div>
            <div className="debug-item">
              <strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}
            </div>
            <div className="debug-item">
              <strong>Room Type:</strong> {roomType || 'Unknown'}
            </div>
            <div className="debug-item">
              <strong>Is Room Locked:</strong> {isRoomLocked ? 'Yes' : 'No'}
            </div>
            <div className="debug-item">
              <strong>Join Requests:</strong> {joinRequests?.length || 0}
            </div>
            <div className="debug-item">
              <strong>Participants:</strong> {participants?.length || 0}
            </div>
          </div>
          {joinRequests && joinRequests.length > 0 && (
            <div className="debug-requests">
              <strong>Pending Requests:</strong>
              <ul>
                {joinRequests.map(req => (
                  <li key={req.userId}>{req.username} - {req.userId.slice(-4)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ParticipantList;