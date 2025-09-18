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
  onToggleNotes,      // New prop
  onToggleTimer,      // New prop
  onToggleMusicPlayer, // New prop
}) {
  return (
    <div className="floating-toolbar">
      <button onClick={onToggleMute}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
      <button onClick={onToggleCamera}>
        {isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
      </button>
      <button onClick={onToggleScreenShare}>
        {isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
      </button>
      <div className="background-selector-group">
        <label htmlFor="background-select" className="sr-only">Select Background</label>
        <select
          id="background-select"
          value={selectedBackground || 'none'}
          onChange={(e) => onSelectBackground(e.target.value)}
          className="background-select"
        >
          <option value="none">No Background</option>
          {backgroundImages.map((img, index) => (
            <option key={index} value={img.url}>
              {img.name}
            </option>
          ))}
        </select>
      </div>
      {/* New buttons for toggling overlay panels */}
      <button onClick={onToggleNotes}>Notes</button>
      <button onClick={onToggleTimer}>Timer</button>
      <button onClick={onToggleMusicPlayer}>Music</button>
    </div>
  );
}

export default FloatingToolbar;
