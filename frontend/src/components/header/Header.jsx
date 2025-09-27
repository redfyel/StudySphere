import React from "react";
import { NavLink } from "react-router-dom";
import "./Header.css";
import logo from "/logo.png";

function Header() {
  return (
    <header className="header">
      {/* Left: Logo + Name */}
      <div className="logo">
        <img src={logo} alt="logo" className="logo-icon" />
        <div className="logo-text">
          Study<span>Sphere</span>
        </div>
      </div>

      {/* Center: Nav Pills */}
      <nav className="nav-container">
        <NavLink
          to="/room"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Collab Rooms
        </NavLink>
        <NavLink
          to="/resources"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Resource Hub
        </NavLink>
        <NavLink
          to="/mood-tracker"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Wellness
        </NavLink>
        <NavLink
          to="/study-enhance"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Smart Learn
        </NavLink>
      </nav>

      {/* Right: Buttons */}
      <div className="header-buttons">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "nav-link active" : "rbtn")}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/login"
          className={({ isActive }) => (isActive ? "nav-link active" : "rbtn join ")}
        >
          Join Now
        </NavLink>
      </div>
    </header>
  );
}

export default Header;
