import { NavLink } from "react-router-dom";
import { IoMenuOutline } from "react-icons/io5";
import "./Sidebar.css";

export default function Sidebar({ sectionName, isCollapsed, toggleSidebar, items = [] }) {
    return (
        <aside className={`resource-sidebar ${isCollapsed ? "collapsed" : ""}`}>
            {/* Header */}
            <div className="resource-sidebar-header">
                {!isCollapsed && <div className="logo">{sectionName}</div>}
                <button className="toggle-btn" onClick={toggleSidebar}>
                    <IoMenuOutline />
                </button>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                {items.map((item, index) => {
                    // This allows for both flat arrays and sectioned arrays
                    const isSection = item.section && Array.isArray(item.items);
                    const navItems = isSection ? item.items : [item];

                    return (
                        <div key={index} className="sidebar-section">
                            {isSection && !isCollapsed && <h3 className="sidebar-section-title">{item.section}</h3>}
                            {navItems.map((navItem, itemIndex) => (
                                <NavLink key={itemIndex} to={navItem.path} className={({ isActive }) => isActive ? "sidebar-nav-link active" : "sidebar-nav-link"} end={navItem.path === "/resources"}>
                                    <span className="res-nav-icon">{navItem.icon}</span>
                                    {!isCollapsed && <span className="res-nav-name">{navItem.name}</span>}
                                </NavLink>
                            ))}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}