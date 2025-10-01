import React, { useState, useEffect, useRef } from 'react';
import './ParticipantList.css';

function ParticipantList({ 
  participants = [],
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
  const [activeTab, setActiveTab] = useState('participants');
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const [previousRequestCount, setPreviousRequestCount] = useState(joinRequests.length);
  const audioRef = useRef(null);

  // Create notification sound effect
  useEffect(() => {
    const createNotificationSound = () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a pleasant notification sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    // Play notification sound when new requests arrive
    if (joinRequests.length > previousRequestCount && isCreator) {
      try {
        createNotificationSound();
        // Optional: Switch to requests tab when new request comes in
        if (joinRequests.length > 0) {
          setActiveTab('requests');
        }
      } catch (error) {
        console.log('Audio notification not available');
      }
    }
    
    setPreviousRequestCount(joinRequests.length);
  }, [joinRequests.length, previousRequestCount, isCreator]);

  const getConnectionStatus = (userId) => {
    const quality = connectionQuality[userId];
    if (typeof quality === 'string') {
      switch (quality) {
        case 'connected': return { status: 'good', text: 'Connected' };
        case 'connecting': return { status: 'fair', text: 'Connecting' };
        case 'disconnected': return { status: 'poor', text: 'Disconnected' };
        case 'failed': return { status: 'poor', text: 'Failed' };
        default: return { status: 'unknown', text: 'Unknown' };
      }
    }
    return { status: 'unknown', text: 'Unknown' };
  };

  const formatJoinTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const joinTime = new Date(timestamp);
    const diffMinutes = Math.floor((now - joinTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return `${Math.floor(diffMinutes / 60)}h ago`;
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
      await onJoinRequestResponse(userId, action);
    } catch (error) {
      console.error('Error handling join request:', error);
    }
  };

  const TabButton = ({ tabId, children, count, hasNotifications }) => (
    <button
      className={`tab-button ${activeTab === tabId ? 'active' : ''}`}
      onClick={() => setActiveTab(tabId)}
      data-has-requests={hasNotifications && count > 0 ? 'true' : 'false'}
    >
      {children}
      {count > 0 && <span className="tab-count">{count}</span>}
    </button>
  );

  return (
    <div className="participant-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="header-content">
          <h3>Room Panel</h3>
          <div className="room-status">
            <span className={`room-type ${roomType}`}>
              {roomType === 'private' ? 'Private' : 'Public'}
            </span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>
          <span className="material-icons">close</span>
        </button>
      </div>

      {/* Room Controls - Only show for creators */}
      {isCreator && roomType === 'private' && (
        <div className="room-controls">
          <div className="lock-control">
            <div className="control-info">
              <span className="control-label">Approval Required</span>
              <span className="control-desc">New members need approval</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isRoomLocked}
                onChange={onToggleRoomLock}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tab-buttons">
          <TabButton tabId="participants" count={participants.length}>
            Participants
          </TabButton>
          {isCreator && (
            <TabButton 
              tabId="requests" 
              count={joinRequests.length}
              hasNotifications={true}
            >
              Requests
            </TabButton>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'participants' && (
            <div className="participants-tab">
              {participants.length === 0 ? (
                <div className="empty-state">
                  <span className="material-icons">people_outline</span>
                  <p>No participants yet</p>
                </div>
              ) : (
                <div className="participants-list">
                  {participants.map((participant) => {
                    const userData = remoteUsersData[participant.id] || {};
                    const connection = getConnectionStatus(participant.id);
                    const canControl = canControlParticipant(participant);
                    const isMuted = userData.isMuted || participant.isMuted;
                    const isCameraOff = userData.isCameraOff || participant.isCameraOff;
                    const isScreenSharing = userData.isScreenSharing || participant.isScreenSharing;
                    
                    return (
                      <div key={participant.id} className="participant-card">
                        <div className="participant-main">
                          <div className="participant-avatar">
                            <div className="avatar-circle">
                              {participant.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className={`connection-dot ${connection.status}`}></div>
                          </div>
                          
                          <div className="participant-details">
                            <div className="name-row">
                              <span className="participant-name">
                                {participant.name || 'Unknown User'}
                              </span>
                              <div className="badges">
                                {participant.id === currentUserId && (
                                  <span className="badge you">You</span>
                                )}
                                {participant.isCreator && (
                                  <span className="badge creator">
                                    <span className="material-icons">crown</span>
                                    Host
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="info-row">
                              <span className="join-time">
                                <span className="material-icons">schedule</span>
                                {formatJoinTime(participant.joinedAt)}
                              </span>
                              <span className={`connection-text ${connection.status}`}>
                                <span className="material-icons">signal_cellular_alt</span>
                                {connection.text}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="participant-controls">
                          <div className="media-indicators">
                            <div className={`media-item ${isMuted ? 'inactive' : 'active'}`}>
                              <span className="material-icons">
                                {isMuted ? 'mic_off' : 'mic'}
                              </span>
                            </div>
                            <div className={`media-item ${isCameraOff ? 'inactive' : 'active'}`}>
                              <span className="material-icons">
                                {isCameraOff ? 'videocam_off' : 'videocam'}
                              </span>
                            </div>
                            {isScreenSharing && (
                              <div className="media-item sharing">
                                <span className="material-icons">screen_share</span>
                              </div>
                            )}
                          </div>

                          {canControl && (
                            <div className="admin-actions">
                              <button
                                className={`action-btn ${isMuted ? 'active' : ''}`}
                                onClick={() => handleAdminAction('mute', participant.id, participant.name, isMuted)}
                                title={isMuted ? 'Unmute' : 'Mute'}
                              >
                                <span className="material-icons">
                                  {isMuted ? 'mic' : 'mic_off'}
                                </span>
                              </button>
                              <button
                                className={`action-btn ${isCameraOff ? 'active' : ''}`}
                                onClick={() => handleAdminAction('camera', participant.id, participant.name, isCameraOff)}
                                title={isCameraOff ? 'Enable Camera' : 'Disable Camera'}
                              >
                                <span className="material-icons">
                                  {isCameraOff ? 'videocam' : 'videocam_off'}
                                </span>
                              </button>
                              <button
                                className="action-btn danger"
                                onClick={() => handleAdminAction('remove', participant.id, participant.name)}
                                title="Remove Participant"
                              >
                                <span className="material-icons">person_remove</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && isCreator && (
            <div className="requests-tab">
              {joinRequests.length === 0 ? (
                <div className="empty-state">
                  <span className="material-icons">person_add_disabled</span>
                  <p>No pending requests</p>
                </div>
              ) : (
                <div className="requests-list">
                  {joinRequests.map((request) => (
                    <div key={request.userId} className="request-card">
                      <div className="request-main">
                        <div className="request-avatar">
                          <div className="avatar-circle">
                            {request.username?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="new-badge">
                            <span className="material-icons">fiber_new</span>
                          </div>
                        </div>
                        
                        <div className="request-details">
                          <div className="name-section">
                            <span className="request-name">
                              {request.username || 'Unknown User'}
                            </span>
                            <span className="request-time">
                              <span className="material-icons">access_time</span>
                              {formatJoinTime(request.requestedAt)}
                            </span>
                          </div>
                          
                          {request.email && (
                            <div className="email-section">
                              <span className="material-icons">email</span>
                              <span className="request-email">{request.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="request-actions">
                        <button
                          className="action-btn approve"
                          onClick={() => handleJoinRequestResponse(request.userId, 'approve')}
                        >
                          <span className="material-icons">check_circle</span>
                          Approve
                        </button>
                        <button
                          className="action-btn reject"
                          onClick={() => handleJoinRequestResponse(request.userId, 'reject')}
                        >
                          <span className="material-icons">cancel</span>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="dialog-overlay">
          <div className="confirm-dialog">
            <div className="dialog-header">
              <h4>Confirm Action</h4>
              <span className="material-icons">warning</span>
            </div>
            <div className="dialog-content">
              <p>
                Are you sure you want to <strong>{showConfirmDialog.action}</strong>{' '}
                <em>{showConfirmDialog.participantName}</em>?
              </p>
              {showConfirmDialog.action === 'remove' && (
                <div className="warning-note">
                  This will immediately disconnect them from the room.
                </div>
              )}
            </div>
            <div className="dialog-actions">
              <button className="dialog-btn cancel" onClick={showConfirmDialog.onCancel}>
                Cancel
              </button>
              <button className="dialog-btn confirm" onClick={showConfirmDialog.onConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParticipantList;