import React from 'react';
import './PrimaryNavTabs.css'; // We'll create this CSS file next

/**
 * A reusable tab navigation component.
 * @param {object} props - The component props.
 * @param {Array<string>} props.tabs - An array of strings representing the tab labels.
 * @param {string} props.activeTab - The label of the currently active tab.
 * @param {function(string): void} props.onTabClick - The function to call when a tab is clicked.
 */
const PrimaryNavTabs = ({ tabs, activeTab, onTabClick }) => {
  return (
    <div className="primary-nav-menu">
      {tabs.map((tabLabel) => (
        <button
          key={tabLabel}
          className={`primary-nav-button ${activeTab === tabLabel ? 'active' : ''}`}
          onClick={() => onTabClick(tabLabel)}
        >
          {/* Capitalize the first letter for display */}
          {tabLabel.charAt(0).toUpperCase() + tabLabel.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default PrimaryNavTabs;