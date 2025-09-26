import React, { useState, useEffect } from 'react';

function FloatingToolbar({
  isMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  backgroundVideos,
  selectedBackground,
  onSelectBackground,
  onToggleNotes,
  onToggleTimer,
  onToggleMusicPlayer,
  onToggleChat,
  onToggleParticipants,
  onLeaveRoom,
  participantCount,
  unreadMessages,
  isCreator,
  isRoomLocked,
  onToggleRoomLock,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.floating-toolbar-container')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemClick = (callback) => {
    callback();
    setIsMenuOpen(false);
  };

  const menuItems = [
    {
      id: 'chat',
      icon: 'forum',
      title: 'Chat',
      onClick: () => handleMenuItemClick(onToggleChat),
      badge: unreadMessages > 0 ? (unreadMessages > 99 ? '99+' : unreadMessages) : null,
      gradient: 'from-sage-500 to-sage-600'
    },
    {
      id: 'participants',
      icon: 'people',
      title: 'Participants',
      onClick: () => handleMenuItemClick(onToggleParticipants),
      badge: participantCount,
      gradient: 'from-teal-500 to-teal-600'
    },
    {
      id: 'music',
      icon: 'library_music',
      title: 'Music',
      onClick: () => handleMenuItemClick(onToggleMusicPlayer),
      gradient: 'from-lavender-500 to-lavender-600'
    },
    {
      id: 'notes',
      icon: 'sticky_note_2',
      title: 'Notes',
      onClick: () => handleMenuItemClick(onToggleNotes),
      gradient: 'from-cream-500 to-cream-600'
    },
    {
      id: 'timer',
      icon: 'schedule',
      title: 'Timer',
      onClick: () => handleMenuItemClick(onToggleTimer),
      gradient: 'from-sage-400 to-sage-500'
    }
  ];

  return (
    <>
      <div className="floating-toolbar-container">
        <div className={`floating-toolbar ${isMenuOpen ? 'expanded' : ''}`}>
          {/* Primary Controls */}
          <div className="primary-controls">
            <button
              onClick={onToggleMute}
              className={`control-btn ${isMuted ? 'danger-state' : 'default-state'}`}
              title={isMuted ? 'Unmute' : 'Mute'}
              onMouseEnter={() => setHoveredButton('mute')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <div className="btn-inner">
                <span className="material-icons-round">
                  {isMuted ? 'mic_off' : 'mic'}
                </span>
                <div className={`glow-effect ${hoveredButton === 'mute' ? 'active' : ''}`}></div>
              </div>
            </button>

            <button
              onClick={onToggleCamera}
              className={`control-btn ${isCameraOff ? 'danger-state' : 'default-state'}`}
              title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              onMouseEnter={() => setHoveredButton('camera')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <div className="btn-inner">
                <span className="material-icons-round">
                  {isCameraOff ? 'videocam_off' : 'videocam'}
                </span>
                <div className={`glow-effect ${hoveredButton === 'camera' ? 'active' : ''}`}></div>
              </div>
            </button>

            <button
              onClick={onToggleScreenShare}
              className={`control-btn ${isScreenSharing ? 'active-state' : 'default-state'}`}
              title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
              onMouseEnter={() => setHoveredButton('screen')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <div className="btn-inner">
                <span className="material-icons-round">present_to_all</span>
                <div className={`glow-effect ${hoveredButton === 'screen' ? 'active' : ''}`}></div>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="control-divider"></div>

          {/* Menu Toggle */}
          <button
            onClick={toggleMenu}
            className={`control-btn menu-toggle ${isMenuOpen ? 'menu-active' : 'default-state'}`}
            title="More Options"
            onMouseEnter={() => setHoveredButton('menu')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <div className="btn-inner">
              <span className="material-icons-round menu-icon">
                {isMenuOpen ? 'close' : 'apps'}
              </span>
              <div className={`glow-effect ${hoveredButton === 'menu' ? 'active' : ''}`}></div>
            </div>
          </button>

          {/* Divider */}
          <div className="control-divider"></div>

          {/* End Call */}
          <button
            onClick={onLeaveRoom}
            className="control-btn end-call-state"
            title="End Call"
            onMouseEnter={() => setHoveredButton('leave')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <div className="btn-inner">
              <span className="material-icons-round">call_end</span>
              <div className={`glow-effect ${hoveredButton === 'leave' ? 'active' : ''}`}></div>
            </div>
          </button>
        </div>

        {/* Expanded Menu */}
        <div className={`expanded-menu ${isMenuOpen ? 'visible' : ''}`}>
          <div className="menu-header">
            <span className="material-icons-round">apps</span>
            <h3>Quick Actions</h3>
          </div>
          
          <div className="menu-grid">
            {menuItems.map((item, index) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`menu-item ${item.gradient}`}
                title={item.title}
                style={{ '--delay': `${index * 80}ms` }}
                onMouseEnter={() => setHoveredButton(item.id)}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <div className="menu-item-inner">
                  <span className="material-icons-round">{item.icon}</span>
                  {item.badge && (
                    <div className="notification-badge">
                      {item.badge}
                    </div>
                  )}
                  <div className={`item-glow ${hoveredButton === item.id ? 'active' : ''}`}></div>
                </div>
                <span className="item-label">{item.title}</span>
              </button>
            ))}
          </div>

          <div className="menu-divider"></div>

          {/* Background Selector */}
          <div className="background-section">
            <div className="section-header">
              <span className="material-icons-round">wallpaper</span>
              <span>Background</span>
            </div>
            <select
              value={selectedBackground || 'none'}
              onChange={(e) => onSelectBackground(e.target.value)}
              className="background-selector"
            >
              <option value="none">None</option>
              {(backgroundVideos || []).map((video) => (
                <option key={video.url} value={video.url}>
                  {video.name}
                </option>
              ))}
            </select>
          </div>

          {/* Room Lock (Creator only) */}
          {isCreator && (
            <>
              <div className="menu-divider"></div>
              <button
                onClick={() => handleMenuItemClick(onToggleRoomLock)}
                className={`lock-button ${isRoomLocked ? 'locked' : 'unlocked'}`}
                title={isRoomLocked ? 'Unlock Room' : 'Lock Room'}
                onMouseEnter={() => setHoveredButton('lock')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <div className="lock-content">
                  <span className="material-icons-round">
                    {isRoomLocked ? 'lock' : 'lock_open'}
                  </span>
                  <span className="lock-text">
                    {isRoomLocked ? 'Room Locked' : 'Lock Room'}
                  </span>
                </div>
                <div className={`item-glow ${hoveredButton === 'lock' ? 'active' : ''}`}></div>
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');

        .floating-toolbar-container {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .floating-toolbar {
          background: linear-gradient(135deg, 
            rgba(137, 168, 178, 0.95) 0%,
            rgba(179, 200, 207, 0.95) 100%);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(229, 225, 218, 0.3);
          border-radius: 28px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 
            0 20px 25px -5px rgba(137, 168, 178, 0.3),
            0 10px 10px -5px rgba(137, 168, 178, 0.2),
            inset 0 1px 0 rgba(241, 240, 232, 0.2);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 64px;
        }

        .floating-toolbar.expanded {
          box-shadow: 
            0 25px 50px -12px rgba(137, 168, 178, 0.4),
            0 0 0 1px rgba(179, 200, 207, 0.5);
        }

        .primary-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .control-btn {
          position: relative;
          width: 52px;
          height: 52px;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .btn-inner {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }

        .control-btn.default-state {
          background: linear-gradient(135deg, #89a8b2, #b3c8cf);
          color: #2c3e50;
        }

        .control-btn.default-state:hover {
          background: linear-gradient(135deg, #b3c8cf, #e5e1da);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(137, 168, 178, 0.4);
        }

        .control-btn.danger-state {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: #f1f0e8;
          animation: pulse-red 2s infinite;
        }

        .control-btn.danger-state:hover {
          background: linear-gradient(135deg, #ec7063, #e74c3c);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(231, 76, 60, 0.5);
        }

        .control-btn.active-state {
          background: linear-gradient(135deg, #27ae60, #229954);
          color: #f1f0e8;
        }

        .control-btn.active-state:hover {
          background: linear-gradient(135deg, #58d68d, #27ae60);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(39, 174, 96, 0.5);
        }

        .control-btn.menu-active {
          background: linear-gradient(135deg, #89a8b2, #7d9ba6);
          color: #2c3e50;
        }

        .control-btn.menu-active:hover {
          background: linear-gradient(135deg, #b3c8cf, #89a8b2);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(137, 168, 178, 0.5);
        }

        .control-btn.end-call-state {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: #f1f0e8;
        }

        .control-btn.end-call-state:hover {
          background: linear-gradient(135deg, #ec7063, #e74c3c);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 12px 30px rgba(231, 76, 60, 0.6);
        }

        .menu-icon {
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .menu-active .menu-icon {
          transform: rotate(180deg);
        }

        .control-divider {
          width: 1px;
          height: 32px;
          background: linear-gradient(to bottom, transparent, rgba(229, 225, 218, 0.4), transparent);
        }

        .material-icons-round {
          font-size: 24px;
          font-weight: 400;
          transition: all 0.3s ease;
        }

        .glow-effect {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: inherit;
          background: radial-gradient(circle, rgba(241, 240, 232, 0.2) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .glow-effect.active {
          opacity: 1;
        }

        .expanded-menu {
          background: linear-gradient(135deg, 
            rgba(229, 225, 218, 0.98) 0%,
            rgba(241, 240, 232, 0.98) 100%);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(179, 200, 207, 0.3);
          border-radius: 24px;
          padding: 24px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-20px) scale(0.95);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 20px 25px -5px rgba(137, 168, 178, 0.3),
            0 10px 10px -5px rgba(137, 168, 178, 0.2);
          min-width: 360px;
          max-width: 400px;
          max-height: 480px;
          overflow-y: auto;
        }

        .expanded-menu.visible {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
        }

        .menu-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(137, 168, 178, 0.2);
        }

        .menu-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
        }

        .menu-header .material-icons-round {
          color: #89a8b2;
          font-size: 20px;
        }

        .menu-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .menu-item {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 18px 12px;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          background: linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to));
          color: #2c3e50;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          animation: menuItemIn 0.5s ease-out forwards;
          animation-delay: var(--delay);
          box-shadow: 0 4px 12px rgba(137, 168, 178, 0.2);
        }

        .menu-item:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 12px 30px rgba(137, 168, 178, 0.3);
        }

        .menu-item-inner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #2c3e50;
        }

        .notification-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: #f1f0e8;
          border-radius: 50%;
          min-width: 20px;
          height: 20px;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(241, 240, 232, 0.8);
          animation: bounce 2s infinite;
        }

        .item-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: inherit;
          background: radial-gradient(circle, rgba(241, 240, 232, 0.3) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .item-glow.active {
          opacity: 1;
        }

        .menu-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(137, 168, 178, 0.3), transparent);
          margin: 16px 0;
        }

        .background-section {
          padding: 16px;
          border-radius: 12px;
          background: rgba(179, 200, 207, 0.3);
          border: 1px solid rgba(137, 168, 178, 0.2);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #2c3e50;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .background-selector {
          width: 100%;
          background: linear-gradient(135deg, #89a8b2, #b3c8cf);
          border: 1px solid rgba(137, 168, 178, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          color: #2c3e50;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .background-selector:hover {
          background: linear-gradient(135deg, #b3c8cf, #e5e1da);
          border-color: rgba(137, 168, 178, 0.5);
        }

        .background-selector option {
          background: #e5e1da;
          color: #2c3e50;
          padding: 12px;
        }

        .lock-button {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          font-weight: 600;
        }

        .lock-button.locked {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: #f1f0e8;
        }

        .lock-button.unlocked {
          background: linear-gradient(135deg, #27ae60, #229954);
          color: #f1f0e8;
        }

        .lock-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(137, 168, 178, 0.4);
        }

        .lock-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lock-text {
          font-size: 14px;
          font-weight: 600;
        }

        @keyframes menuItemIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-red {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(231, 76, 60, 0);
          }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: scale(1);
          }
          40%, 43% {
            transform: scale(1.1);
          }
          70% {
            transform: scale(1.05);
          }
          90% {
            transform: scale(1.02);
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .floating-toolbar-container {
            bottom: 20px;
          }

          .floating-toolbar {
            padding: 10px 16px;
            gap: 12px;
            min-height: 56px;
          }

          .control-btn {
            width: 48px;
            height: 48px;
            border-radius: 14px;
          }

          .primary-controls {
            gap: 10px;
          }

          .material-icons-round {
            font-size: 22px;
          }

          .expanded-menu {
            min-width: 320px;
            max-width: 360px;
            padding: 20px;
          }

          .menu-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .menu-item {
            padding: 16px 10px;
          }
        }

        @media (max-width: 480px) {
          .floating-toolbar {
            padding: 8px 12px;
            gap: 8px;
            min-height: 52px;
          }

          .control-btn {
            width: 44px;
            height: 44px;
            border-radius: 12px;
          }

          .material-icons-round {
            font-size: 20px;
          }

          .expanded-menu {
            min-width: 280px;
            max-width: 320px;
            padding: 16px;
          }

          .menu-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .menu-item {
            padding: 14px 8px;
          }

          .item-label {
            font-size: 11px;
          }
        }

        /* Color palette gradient classes */
        .from-sage-400 { --tw-gradient-from: #a5bac0; }
        .to-sage-500 { --tw-gradient-to: #89a8b2; }
        .from-sage-500 { --tw-gradient-from: #89a8b2; }
        .to-sage-600 { --tw-gradient-to: #7d9ba6; }
        .from-teal-500 { --tw-gradient-from: #b3c8cf; }
        .to-teal-600 { --tw-gradient-to: #9fb8c1; }
        .from-lavender-500 { --tw-gradient-from: #c8b3cf; }
        .to-lavender-600 { --tw-gradient-to: #b89fc7; }
        .from-cream-500 { --tw-gradient-from: #e5e1da; }
        .to-cream-600 { --tw-gradient-to: #ddd9d0; }
      `}</style>
    </>
  );
}

export default FloatingToolbar;