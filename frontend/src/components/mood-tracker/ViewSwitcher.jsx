import React from 'react';

const ViewSwitcher = ({ selectedView, setSelectedView, views }) => {
  return (
    <div className="view-switcher-container">
      {views.map((view) => (
        <button
          key={view.id}
          className={`view-switcher-button ${selectedView === view.id ? 'active' : ''}`}
          // Use the 'id' for state logic ('week', 'month', 'year')
          onClick={() => setSelectedView(view.id)}
        >
          {view.icon} {/* Render the icon */}
          <span>{view.label}</span> {/* Render the label */}
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;