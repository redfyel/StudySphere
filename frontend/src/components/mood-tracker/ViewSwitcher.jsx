// ViewSwitcher.js
import React from 'react';
import './MoodTracker.css'; 

const ViewSwitcher = ({ selectedView, setSelectedView }) => { 
  return (
    <div className="view-switcher-container"> 
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