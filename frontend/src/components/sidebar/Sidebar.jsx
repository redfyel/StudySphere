import React from "react";
import { NavLink } from "react-router-dom";
import {
  IoDocumentsOutline,
  IoCloudUploadOutline,
  IoBookmarkOutline,
  IoPeopleOutline,
  IoStatsChartOutline,
  IoMenuOutline,
} from "react-icons/io5";
import "./Sidebar.css";
import { CgProfile } from "react-icons/cg";
import { BsFillSunFill } from "react-icons/bs";

export default function Sidebar({ isCollapsed, toggleSidebar }) {
  const resnavItems = [
    { name: "All Resources", path: "/resources", icon: <IoDocumentsOutline /> },
    { name: "Upload Resource", path: "/upload", icon: <IoCloudUploadOutline /> },
    { name: "My Library", path: "/my-library", icon: <IoBookmarkOutline /> },
    { name: "Group Resources", path: "/groups", icon: <IoPeopleOutline /> },
    { name: "Trending", path: "/trending", icon: <IoStatsChartOutline /> },
  ];

  return (
    <div className={`resource-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="resource-sidebar-header"> {/* Corrected class name */}
        <div className="logo">StudySphere</div>
        <button className="toggle-btn" onClick={toggleSidebar}>
          <IoMenuOutline />
        </button>
      </div>
      <nav className="res-nav-menu">
        {resnavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <span className="res-nav-icon">{item.icon}</span>
            <span className="res-nav-name">{!isCollapsed && item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="resource-sidebar-footer"> {/* Corrected class name */}
        <div className="res-footer-item">
          <CgProfile />
          {!isCollapsed && "Profile"}
        </div>
        <div className="res-footer-item">
          <BsFillSunFill />
          {!isCollapsed && "Light Mode"}
        </div>
      </div>
    </div>
  );
}