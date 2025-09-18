import React from 'react';

function FloatingToolbar({
  isMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  backgroundImages,
  selectedBackground,
  onSelectBackground,
  onToggleNotes,
  onToggleTimer,
  onToggleMusicPlayer,
}) {
  return (
    <div className="floating-toolbar">
      {/* Media Controls */}
      <div className="toolbar-section">
        <button 
          onClick={onToggleMute}
          className={`toolbar-btn ${isMuted ? 'btn-danger' : 'btn-default'}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
            {isMuted ? (
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            ) : (
              <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm5.3 6c0 3-2.54 5.1-5.3 5.1S6.7 11 6.7 8H5c0 3.41 2.72 6.23 6 6.72V17h-2v2h6v-2h-2v-2.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
            )}
          </svg>
        </button>
        
        <button 
          onClick={onToggleCamera}
          className={`toolbar-btn ${isCameraOff ? 'btn-danger' : 'btn-default'}`}
          title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
            {isCameraOff ? (
              <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2zM5 16V8h1.73l8 8H5z"/>
            ) : (
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            )}
          </svg>
        </button>
        
        <button 
          onClick={onToggleScreenShare}
          className={`toolbar-btn ${isScreenSharing ? 'btn-active' : 'btn-default'}`}
          title={isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
        >
          <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
          </svg>
        </button>
      </div>

      {/* Background Selector */}
      <div className="toolbar-section">
        <select
          value={selectedBackground || 'none'}
          onChange={(e) => onSelectBackground(e.target.value)}
          className="background-select"
        >
          <option value="none">No Background</option>
          {(backgroundImages || []).map((img, index) => (
            <option key={index} value={img.url}>
              {img.name}
            </option>
          ))}
        </select>
      </div>

      {/* Panel Toggles */}
      <div className="toolbar-section">
        <button 
          onClick={onToggleNotes}
          className="toolbar-btn btn-default"
          title="Toggle Notes Panel"
        >
          <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </button>
        
        <button 
          onClick={onToggleTimer}
          className="toolbar-btn btn-default"
          title="Toggle Timer Panel"
        >
          <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
          </svg>
        </button>
        
        <button 
          onClick={onToggleMusicPlayer}
          className="toolbar-btn btn-default"
          title="Toggle Music Panel"
        >
          <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A3,3 0 0,0 7,16A3,3 0 0,0 10,19A3,3 0 0,0 13,16V7H17V5H12V3Z"/>
          </svg>
        </button>
      </div>

      <style jsx>{`
        .floating-toolbar {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #F1F0E8;
          border: 2px solid #E5E1DA;
          border-radius: 50px;
          padding: 4px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(10px);
          z-index: 1000;
          height: 48px;
        }

        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .toolbar-section:not(:last-child) {
          border-right: 1px solid #E5E1DA;
          padding-right: 8px;
        }

        .toolbar-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
          padding: 0;
        }

        .toolbar-btn.btn-default {
          background: #89A8B2;
          color: white;
        }

        .toolbar-btn.btn-default:hover {
          background: #B3C8CF;
          transform: scale(1.05);
        }

        .toolbar-btn.btn-danger {
          background: #dc3545;
          color: white;
        }

        .toolbar-btn.btn-danger:hover {
          background: #c82333;
          transform: scale(1.05);
        }

        .toolbar-btn.btn-active {
          background: #28a745;
          color: white;
        }

        .toolbar-btn.btn-active:hover {
          background: #218838;
          transform: scale(1.05);
        }

        .background-select {
          background: #89A8B2;
          border: 1px solid #B3C8CF;
          border-radius: 20px;
          padding: 8px 12px;
          font-size: 13px;
          color: white;
          cursor: pointer;
          outline: none;
          min-width: 120px;
        }

        .background-select:hover {
          background: #B3C8CF;
        }

        .background-select:focus {
          border-color: #E5E1DA;
        }

        .icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .floating-toolbar {
            padding: 3px 8px;
            gap: 6px;
            height: 42px;
          }

          .toolbar-btn {
            width: 36px;
            height: 36px;
          }

          .toolbar-section {
            gap: 4px;
          }

          .toolbar-section:not(:last-child) {
            padding-right: 6px;
          }

          .background-select {
            min-width: 100px;
            font-size: 12px;
            padding: 6px 10px;
          }

          .icon {
            width: 22px;
            height: 22px;
          }
        }
      `}</style>
    </div>
  );
}

export default FloatingToolbar;