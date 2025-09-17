import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import '../study-enhance/studyEnhance.css';

const Sidebar = ({ logoText = "StudySphere", menuItems = [] }) => {
  const [activeView, setActiveView] = useState(menuItems[0]?.key || "");

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          {menuItems.find(item => item.key === activeView)?.icon} {logoText}
        </div>
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map(item => (
              <li key={item.key}>
                <a
                  href="#"
                  className={activeView === item.key ? 'active' : ''}
                  onClick={() => setActiveView(item.key)}
                >
                  {item.icon} {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Render the component tied to the activeView */}
        {menuItems.find(item => item.key === activeView)?.component}

        {/* Extra nested routes */}
        <Outlet />
      </div>
    </div>
  );
};

export default Sidebar;
