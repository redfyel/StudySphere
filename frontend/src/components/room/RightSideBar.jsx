import React, { useState } from 'react';
import Notes from './Notes';
import Timer from './Timer';
import MusicPlayer from './MusicPlayer';
import ChatPanel from './ChatPanel';
import ParticipantList from './ParticipantList';

const RightSidebar = ({
  // Required for chat
  roomId,
  sessionToken,
  
  // Notes props
  notes,
  onNotesChange,
  isCreator,
  
  // Timer props
  timer,
  onTimerChange,
  
  // Chat props
  chatMessages,
  onSendMessage,
  currentUserId,
  currentUsername,
  
  // Participants props
  participants,
  joinRequests,
  roomType,
  onJoinRequestResponse,
  onToggleRoomLock,
  isRoomLocked,
  connectionQuality,
  remoteUsersData,
  onAdminMuteParticipant,
  onAdminRemoveParticipant,
  onAdminToggleParticipantCamera,
  getUserDisplayName,
  
  // Control props
  isScreenSharing,
  
  // Close handler
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('chat');

  const tabs = [
    {
      id: 'chat',
      label: 'Chat',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2Z" />
        </svg>
      ),
      notification: chatMessages?.filter(msg => !msg.read)?.length || 0
    },
    {
      id: 'participants',
      label: 'People',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M16,4C18.21,4 20,5.79 20,8C20,10.21 18.21,12 16,12C13.79,12 12,10.21 12,8C12,5.79 13.79,4 16,4M16,14C20.42,14 24,15.79 24,18V20H8V18C8,15.79 11.58,14 16,14M6,6V9H4V6H1V4H4V1H6V4H9V6M6,16V19H4V16H1V14H4V11H6V14H9V16" />
        </svg>
      ),
      notification: participants?.length || 0
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,0.6 4.7,1.7L9,6L6,9L1.6,4.7C0.4,7.1 0.9,10.1 2.9,12.1C4.8,14 7.5,14.5 9.8,13.6L18.9,22.7C19.3,23.1 19.9,23.1 20.3,22.7L22.7,20.3C23.1,19.9 23.1,19.3 22.7,19Z" />
        </svg>
      ),
      notification: 0
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="tab-content-wrapper">
            <ChatPanel
              roomId={roomId}
              sessionToken={sessionToken}
              currentUserId={currentUserId}
              currentUsername={currentUsername}
              onClose={onClose}
              isVisible={true}
            />
          </div>
        );
      
      case 'participants':
        return (
          <div className="tab-content-wrapper">
            <ParticipantList
              participants={participants}
              joinRequests={joinRequests}
              isCreator={isCreator}
              roomType={roomType}
              currentUserId={currentUserId}
              onJoinRequestResponse={onJoinRequestResponse}
              onToggleRoomLock={onToggleRoomLock}
              isRoomLocked={isRoomLocked}
              connectionQuality={connectionQuality}
              remoteUsersData={remoteUsersData}
              onAdminMuteParticipant={onAdminMuteParticipant}
              onAdminRemoveParticipant={onAdminRemoveParticipant}
              onAdminToggleParticipantCamera={onAdminToggleParticipantCamera}
              getUserDisplayName={getUserDisplayName}
              embedded={true}
            />
          </div>
        );
      
      case 'tools':
        return (
          <div className="tab-content-wrapper">
            {!isScreenSharing ? (
              <div className="tools-content">
                <div className="tool-section">
                  <h4 className="tool-title">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                    Notes
                  </h4>
                  <Notes 
                    notes={notes} 
                    onNotesChange={onNotesChange}
                    isReadOnly={!isCreator}
                    creatorOnly={true}
                    embedded={true}
                  />
                </div>
                
                <div className="tool-section">
                  <h4 className="tool-title">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z" />
                    </svg>
                    Study Timer
                  </h4>
                  <Timer 
                    timer={timer} 
                    onTimerChange={onTimerChange}
                    isReadOnly={!isCreator}
                    creatorOnly={true}
                    embedded={true}
                  />
                </div>
                
                <div className="tool-section">
                  <h4 className="tool-title">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A3,3 0 0,0 7,16A3,3 0 0,0 10,19A3,3 0 0,0 13,16V7H17V5H12V3Z" />
                    </svg>
                    Background Music
                  </h4>
                  <MusicPlayer embedded={true} />
                </div>
              </div>
            ) : (
              <div className="tools-placeholder">
                <div className="placeholder-content">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48" style={{opacity: 0.5}}>
                    <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
                  </svg>
                  <p>Tools hidden during screen share</p>
                  <small>Stop screen sharing to access study tools</small>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return <div className="tab-content-wrapper">Select a tab</div>;
    }
  };

  return (
    <div className="right-sidebar-enhanced">
      {/* Tab Navigation */}
      <div className="tools-panel-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            <div className="tab-icon">{tab.icon}</div>
            <span className="tab-label">{tab.label}</span>
            {tab.notification > 0 && (
              <span className="tab-notification">
                {tab.notification > 99 ? '99+' : tab.notification}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tools-panel-content">
        {renderTabContent()}
      </div>

      <style jsx>{`
        .right-sidebar-enhanced {
          width: 350px;
          position: fixed;
          right: 0;
          top: 52px;
          height: calc(100vh - 52px);
          z-index: 100;
          background: rgba(137, 168, 178, 0.1);
          backdrop-filter: blur(25px);
          border-left: 1px solid rgba(229, 225, 218, 0.2);
          box-shadow: -4px 0 10px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          color: #E5E1DA;
        }

        .tools-panel-tabs {
          display: flex;
          background: rgba(229, 225, 218, 0.1);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(229, 225, 218, 0.2);
          padding: 0;
        }

        .tab-button {
          flex: 1;
          padding: 12px 8px;
          background: transparent;
          border: none;
          color: rgba(229, 225, 218, 0.8);
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          font-size: 12px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-height: 60px;
        }

        .tab-button:hover {
          background: rgba(229, 225, 218, 0.1);
          color: #F1F0E8;
          transform: translateY(-1px);
        }

        .tab-button.active {
          color: #F1F0E8;
          background: rgba(137, 168, 178, 0.2);
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #B3C8CF;
          border-radius: 3px 3px 0 0;
        }

        .tab-button:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(179, 200, 207, 0.6);
        }

        .tab-icon {
          opacity: 0.8;
          transition: all 0.3s ease;
        }

        .tab-button.active .tab-icon {
          opacity: 1;
          transform: scale(1.1);
        }

        .tab-label {
          font-size: 11px;
          font-weight: 500;
        }

        .tab-notification {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #E74C3C;
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          font-size: 9px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(229, 225, 218, 0.3);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .tools-panel-content {
          flex: 1;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(229, 225, 218, 0.3) transparent;
        }

        .tools-panel-content::-webkit-scrollbar {
          width: 6px;
        }

        .tools-panel-content::-webkit-scrollbar-track {
          background: rgba(229, 225, 218, 0.05);
          border-radius: 3px;
        }

        .tools-panel-content::-webkit-scrollbar-thumb {
          background: rgba(229, 225, 218, 0.3);
          border-radius: 3px;
        }

        .tab-content-wrapper {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .tools-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .tool-section {
          background: rgba(229, 225, 218, 0.05);
          backdrop-filter: blur(15px);
          border-radius: 16px;
          border: 1px solid rgba(229, 225, 218, 0.1);
          padding: 16px;
          transition: all 0.3s ease;
        }

        .tool-section:hover {
          background: rgba(229, 225, 218, 0.08);
          border-color: rgba(229, 225, 218, 0.2);
          transform: translateY(-2px);
        }

        .tool-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #F1F0E8;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          opacity: 0.9;
        }

        .tools-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 40px 20px;
        }

        .placeholder-content {
          text-align: center;
          color: rgba(229, 225, 218, 0.6);
        }

        .placeholder-content p {
          font-size: 16px;
          font-weight: 500;
          margin: 16px 0 8px 0;
          color: rgba(229, 225, 218, 0.8);
        }

        .placeholder-content small {
          font-size: 13px;
          opacity: 0.7;
          line-height: 1.4;
        }

        @media (max-width: 1200px) {
          .right-sidebar-enhanced {
            width: 300px;
          }
          
          .tab-button {
            padding: 10px 6px;
            font-size: 11px;
            min-height: 55px;
          }
          
          .tools-content {
            padding: 16px;
            gap: 16px;
          }
          
          .tool-section {
            padding: 12px;
          }
        }

        @media (max-width: 768px) {
          .right-sidebar-enhanced {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 50vh; 
            top: auto;
            border-left: none;
            border-top: 1px solid rgba(229, 225, 218, 0.2);
            box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.2);
          }
          
          .tools-panel-tabs {
            flex-direction: row;
            justify-content: space-around;
          }
          
          .tab-button {
            min-height: 50px;
            flex-direction: row;
            gap: 6px;
            padding: 8px 12px;
          }
          
          .tab-label {
            display: none;
          }
          
          .tools-content {
            padding: 12px;
            gap: 12px;
          }
          
          .tool-section {
            padding: 10px;
          }
          
          .placeholder-content p {
            font-size: 14px;
          }
          
          .placeholder-content small {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
export default RightSidebar;