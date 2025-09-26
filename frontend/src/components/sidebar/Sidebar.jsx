import { NavLink } from "react-router-dom";
import { GoSidebarExpand } from "react-icons/go";
import { GoSidebarCollapse } from "react-icons/go";
import "./Sidebar.css";

export default function Sidebar({ sectionName, isCollapsed, toggleSidebar, items = [] }) {
    return (
        <aside className={`resource-sidebar ${isCollapsed ? "collapsed" : ""}`}>
            {/* Header */}
            <div className="resource-sidebar-header">
                {!isCollapsed && <div className="logo">{sectionName}</div>}
                <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
                    {isCollapsed ? <GoSidebarExpand size={25} /> : <GoSidebarCollapse size={25} />}
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
                            {isSection && !isCollapsead && <h3 className="sidebar-section-title">{item.section}</h3>}
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