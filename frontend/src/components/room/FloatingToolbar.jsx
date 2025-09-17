import React from 'react';

function FloatingToolbar({
  isMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
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
    </div>
  );
}

export default FloatingToolbar;