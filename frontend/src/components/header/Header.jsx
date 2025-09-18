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
      <nav className="header-nav-container">
        <NavLink to="/rooms" className={({ isActive }) => isActive ? "header-nav-link active" : "header-nav-link"}>Rooms</NavLink>
        <NavLink to="/resources" className={({ isActive }) => isActive ? "header-nav-link active" : "header-nav-link"}>Resource Hub</NavLink>
        <NavLink to="/mood-tracker" className={({ isActive }) => isActive ? "header-nav-link active" : "header-nav-link"}>Mood</NavLink>
        <NavLink to="/study-enhance" className={({ isActive }) => isActive ? "header-nav-link active" : "header-nav-link"}>Enhance</NavLink>
      </nav>

      {/* Right: Buttons */}
      <div className="header-buttons">
        <button className="rbtn">Dashboard</button>
        <button className="rbtn join">Join Now</button>
      </div>
    </header>
  );
}

export default Header;