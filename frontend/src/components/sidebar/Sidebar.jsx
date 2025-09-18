import { NavLink } from "react-router-dom";
import { IoMenuOutline } from "react-icons/io5";
import "./Sidebar.css";
import { IoDocumentsOutline, IoCloudUploadOutline, IoBookmarkOutline, IoPeopleOutline, IoStatsChartOutline } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
import { BsFillSunFill } from "react-icons/bs";

const navItems = [
    { name: "All Resources", path: "/resources", icon: <IoDocumentsOutline /> },
    { name: "Upload Resource", path: "/upload", icon: <IoCloudUploadOutline /> },
    { name: "My Library", path: "/my-library", icon: <IoBookmarkOutline /> },
    { name: "Group Resources", path: "/groups", icon: <IoPeopleOutline /> },
    { name: "Trending", path: "/trending", icon: <IoStatsChartOutline /> },
  ];

export default function Sidebar({ sectionName, isCollapsed, toggleSidebar, items = navItems }) {
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
                        end={item.path === "/resources"}
                    >
                        <span className="res-nav-icon">{item.icon}</span>
                        {!isCollapsed && <span className="res-nav-name">{item.name}</span>}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}