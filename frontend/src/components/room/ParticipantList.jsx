import React, { useState } from 'react';
import './ParticipantList.css';

function ParticipantList({ 
  participants = [], // Default to empty array
  joinRequests = [], 
  isCreator, 
  roomType,
  currentUserId,
  onJoinRequestResponse, 
  onToggleRoomLock, 
  isRoomLocked, 
  connectionQuality, 
  remoteUsersData,
  onAdminMuteParticipant,
  onAdminRemoveParticipant,
  onAdminToggleParticipantCamera,
  onClose 
}) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const [expandedParticipant, setExpandedParticipant] = useState(null);

  const getConnectionStatus = (userId) => {
    const quality = connectionQuality[userId];
    if (typeof quality === 'string') {
      switch (quality) {
        case 'connected': return { status: 'good', color: '#89A8B2', text: 'Connected' };
        case 'connecting': return { status: 'fair', color: '#B3C8CF', text: 'Connecting' };
        case 'disconnected': return { status: 'poor', color: '#E5E1DA', text: 'Disconnected' };
        case 'failed': return { status: 'poor', color: '#E5E1DA', text: 'Failed' };
        default: return { status: 'unknown', color: '#F1F0E8', text: 'Unknown' };
      }
    }
    return { status: 'unknown', color: '#F1F0E8', text: 'Unknown' };
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
        return { icon: 'public', text: 'Public Room', color: '#89A8B2' };
      case 'private':
        return { icon: 'lock', text: 'Private Room', color: '#B3C8CF' };
      default:
        return { icon: 'lock', text: 'Private Room', color: '#B3C8CF' };
    }
  };

  const handleAdminAction = (action, participantId, participantName, currentState = null) => {
    let actionText = '';
    let confirmAction = null;

    switch (action) {
      case 'mute':
        actionText = currentState ? 'unmute' : 'mute';
        confirmAction = () => onAdminMuteParticipant(participantId, !currentState);
        break;
      case 'camera':
        actionText = currentState ? 'enable camera for' : 'disable camera for';
        confirmAction = () => onAdminToggleParticipantCamera(participantId, !currentState);
        break;
      case 'remove':
        actionText = 'remove';
        confirmAction = () => onAdminRemoveParticipant(participantId);
        break;
      default:
        return;
    }

    setShowConfirmDialog({
      action: actionText,
      participantName,
      onConfirm: () => {
        confirmAction();
        setShowConfirmDialog(null);
      },
      onCancel: () => setShowConfirmDialog(null)
    });
  };

  const canControlParticipant = (participant) => {
    return isCreator && 
           roomType === 'private' && 
           !participant.isCreator && 
           participant.id !== currentUserId;
  };

  const handleJoinRequestResponse = async (userId, action) => {
    try {
      console.log(`[FRONTEND] ${action === 'approve' ? 'Approving' : 'Rejecting'} join request for user ${userId}`);
      await onJoinRequestResponse(userId, action);
    } catch (error) {
      console.error('Error handling join request:', error);
    }
  };

  const toggleParticipantExpansion = (participantId) => {
    setExpandedParticipant(expandedParticipant === participantId ? null : participantId);
  };

  const roomTypeDisplay = getRoomTypeDisplay();

  return (
    <div className="participant-list-panel">
      <div className="participant-list-header">
        <h3>Room Participants</h3>
        <button className="close-btn" onClick={onClose} aria-label="Close participants panel">
          <span className="material-icons">close</span>
        </button>
      </div>

      {/* Room Info Section */}
      <div className="room-info-section">
        <div className="room-type-display" style={{ backgroundColor: `${roomTypeDisplay.color}15`, borderColor: roomTypeDisplay.color }}>
          <span className="material-icons room-type-icon">{roomTypeDisplay.icon}</span>
          <span className="room-type-label">{roomTypeDisplay.text}</span>
          {roomType === 'private' && isCreator && (
            <span className="admin-badge">
              <span className="material-icons">admin_panel_settings</span>
              Creator
            </span>
          )}
          {roomType === 'private' && isRoomLocked && (
            <span className="lock-status">
              <span className="material-icons">enhanced_encryption</span>
              Approval Required
            </span>
          )}
          {roomType === 'public' && (
            <span className="open-status">
              <span className="material-icons">door_front</span>
              Open Access
            </span>
          )}
        </div>
      </div>

      {/* Room Controls */}
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
            <div className="control-info">
              <span className="control-label">
                <span className="material-icons">
                  {isRoomLocked ? 'enhanced_encryption' : 'lock_open'}
                </span>
                {isRoomLocked ? 'Approval Required' : 'Auto-Accept Members'}
              </span>
              <small className="control-description">
                {isRoomLocked 
                  ? 'New participants need your approval to join' 
                  : 'New participants can join your private room directly'}
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Join Requests Section */}
      {isCreator && joinRequests && joinRequests.length > 0 && (
        <div className="join-requests-section">
          <h4 className="section-title">
            <span className="material-icons participants-icon">pan_tool</span>
            Pending Join Requests ({joinRequests.length})
            <span className="material-icons urgent-indicator">priority_high</span>
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
                      <span className="username">{request.username || 'Unknown User'}</span>
                      {request.email && (
                        <span className="user-email">
                          <span className="material-icons">email</span>
                          {request.email}
                        </span>
                      )}
                      <span className="request-time">
                        Requested {formatJoinTime(request.requestedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="request-actions">
                  <button
                    className="approve-btn"
                    onClick={() => handleJoinRequestResponse(request.userId, 'approve')}
                    title={`Approve ${request.username || 'this user'}`}
                  >
                    <span className="material-icons">check</span>
                    Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleJoinRequestResponse(request.userId, 'reject')}
                    title={`Reject ${request.username || 'this user'}`}
                  >
                    <span className="material-icons">close</span>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Participants Section */}
      <div className="current-participants-section">
        <h4 className="section-title">
          <span className="material-icons participants-icon">people</span>
          Current Participants ({participants.length})
          {isCreator && roomType === 'private' && (
            <span className="admin-controls-hint">Admin Controls</span>
          )}
        </h4>
        
        <div className="participants-list">
          {participants.length === 0 ? (
            <div className="no-participants">
              <span className="material-icons empty-icon">home</span>
              <p>No participants yet</p>
              <small>Share the room link to invite others</small>
            </div>
          ) : (
            participants.map((participant) => {
              const userData = remoteUsersData[participant.id] || {};
              const connection = getConnectionStatus(participant.id);
              const canControl = canControlParticipant(participant);
              const isMuted = userData.isMuted || participant.isMuted;
              const isCameraOff = userData.isCameraOff || participant.isCameraOff;
              const isExpanded = expandedParticipant === participant.id;
              
              return (
                <div key={participant.id} className={`participant-item ${canControl ? 'controllable' : ''} ${isExpanded ? 'expanded' : ''}`}>
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
                      {participant.id === currentUserId && (
                        <span className="you-badge" title="This is you">(You)</span>
                      )}
                      {participant.isCreator && (
                        <span className="creator-badge" title="Room Creator">
                          <span className="material-icons">admin_panel_settings</span>
                        </span>
                      )}
                    </div>

                    {/* Enhanced Participant Details */}
                    <div className="participant-details">
                      {participant.email && (
                        <div className="participant-email">
                          <span className="material-icons email-icon">email</span>
                          {participant.email}
                        </div>
                      )}
                      
                      <div className="participant-stats">
                        <div className="stat-item">
                          <span className="material-icons">schedule</span>
                          <span>{participant.joinedAt ? formatJoinTime(participant.joinedAt) : 'Unknown'}</span>
                        </div>
                        <div className="stat-item">
                          <span className="material-icons">signal_cellular_alt</span>
                          <span style={{ color: connection.color }}>{connection.text}</span>
                        </div>
                      </div>
                    </div>

                    {/* Media Status and Controls */}
                    <div className="participant-status">
                      <div className="media-indicators">
                        {isMuted && (
                          <span className="material-icons media-icon muted" title="Muted">volume_off</span>
                        )}
                        {isCameraOff && (
                          <span className="material-icons media-icon camera-off" title="Camera off">videocam_off</span>
                        )}
                        {(userData.isScreenSharing || participant.isScreenSharing) && (
                          <span className="material-icons media-icon screen-sharing" title="Screen sharing">screen_share</span>
                        )}
                        {!isMuted && (
                          <span className="material-icons media-icon" title="Audio on">volume_up</span>
                        )}
                        {!isCameraOff && (
                          <span className="material-icons media-icon" title="Camera on">videocam</span>
                        )}
                      </div>
                      
                      {/* Expand/Collapse button for more details */}
                      <button 
                        className="expand-btn"
                        onClick={() => toggleParticipantExpansion(participant.id)}
                        title={isExpanded ? 'Show less' : 'Show more details'}
                      >
                        <span className="material-icons">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="expanded-details">
                        <div className="detail-row">
                          <span className="detail-label">User ID:</span>
                          <span className="detail-value">{participant.id.slice(-8)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Role:</span>
                          <span className="detail-value">
                            {participant.isCreator ? 'Creator' : 'Member'}
                            {participant.isAdmin && !participant.isCreator && ' (Admin)'}
                          </span>
                        </div>
                        {participant.joinedAt && (
                          <div className="detail-row">
                            <span className="detail-label">Joined At:</span>
                            <span className="detail-value">
                              {new Date(participant.joinedAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Enhanced Admin Controls */}
                  {canControl && (
                    <div className="admin-controls">
                      <div className="admin-control-buttons">
                        <button
                          className={`admin-btn mute-btn ${isMuted ? 'active' : ''}`}
                          onClick={() => handleAdminAction('mute', participant.id, participant.name, isMuted)}
                          title={isMuted ? `Unmute ${participant.name}` : `Mute ${participant.name}`}
                        >
                          <span className="material-icons">
                            {isMuted ? 'volume_up' : 'volume_off'}
                          </span>
                        </button>
                        <button
                          className={`admin-btn camera-btn ${isCameraOff ? 'active' : ''}`}
                          onClick={() => handleAdminAction('camera', participant.id, participant.name, isCameraOff)}
                          title={isCameraOff ? `Enable camera for ${participant.name}` : `Disable camera for ${participant.name}`}
                        >
                          <span className="material-icons">
                            {isCameraOff ? 'videocam' : 'videocam_off'}
                          </span>
                        </button>
                        <button
                          className="admin-btn remove-btn"
                          onClick={() => handleAdminAction('remove', participant.id, participant.name)}
                          title={`Remove ${participant.name} from room`}
                        >
                          <span className="material-icons">logout</span>
                        </button>
                      </div>
                      <small className="admin-controls-label">Admin Controls</small>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Enhanced Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <div className="dialog-header">
              <h4>Confirm Admin Action</h4>
              <span className="material-icons admin-icon">warning</span>
            </div>
            <div className="dialog-content">
              <p>
                Are you sure you want to <strong>{showConfirmDialog.action}</strong>{' '}
                <em>{showConfirmDialog.participantName}</em>?
              </p>
              {showConfirmDialog.action === 'remove' && (
                <div className="warning-note">
                  <strong>Warning:</strong> This will immediately disconnect them from the room.
                </div>
              )}
            </div>
            <div className="dialog-actions">
              <button 
                className="cancel-btn" 
                onClick={showConfirmDialog.onCancel}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn" 
                onClick={showConfirmDialog.onConfirm}
              >
                Confirm {showConfirmDialog.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParticipantList;