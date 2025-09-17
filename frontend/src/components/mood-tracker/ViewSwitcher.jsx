import React from 'react';

const ViewSwitcher = ({ selectedView, setSelectedView, styles }) => {
  return (
    <div style={styles.viewSwitcher}>
      {['Day', 'Week', 'Month'].map((view) => (
        <button
          key={view}
          onClick={() => setSelectedView(view.toLowerCase())}
          style={{ ...styles.viewButton, ...(selectedView === view.toLowerCase() ? styles.viewButtonActive : {}) }}
        >
          {view}
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;