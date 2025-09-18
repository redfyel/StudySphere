import { NavLink } from "react-router-dom";
import { IoMenuOutline } from "react-icons/io5";
import "./Sidebar.css";

export default function Sidebar({ sectionName, isCollapsed, toggleSidebar, items = [] }) {
  return (
    <aside className={`resource-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Header */}
      <div className="resource-sidebar-header">
        <div className="logo">{!isCollapsed && sectionName}</div>
        <button className="toggle-btn" onClick={toggleSidebar}>
          <IoMenuOutline />
        </button>
      </div>

      {/* Nav */}
      <nav className="res-nav-menu">
        {items.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "sidebar-nav-link active" : "sidebar-nav-link"
            }
          >
            <span className="res-nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="res-nav-name">{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
