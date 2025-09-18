// ViewSwitcher.js
import React from 'react';
import './MoodTracker.css'; // Make sure the CSS is available, adjust path as needed

const ViewSwitcher = ({ selectedView, setSelectedView }) => { // <--- Removed 'styles' prop
  return (
    <div className="view-switcher-container"> {/* <--- Using className */}
      {['Day', 'Week', 'Month'].map((view) => (
        <button
          key={view}
          onClick={() => setSelectedView(view.toLowerCase())}
          className={`view-switcher-button ${selectedView === view.toLowerCase() ? 'active' : ''}`} // <--- Using className and 'active' class
        >
          {view}
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;