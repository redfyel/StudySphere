import React from "react";
import { NavLink, Link } from "react-router-dom";
import "./Header.css";
import logo from "/logo.png";

function Header() {
  return (
    <header className="header">
      {/* Left: Logo + Name */}
      <Link to="/" className="logo">
        <img src={logo} alt="logo" className="logo-icon" />
        <div className="logo-text">
          Study<span>Sphere</span>
        </div>
      </Link>

      {/* Center: Nav Pills */}
      <nav className="header-nav-container">
        <NavLink to="/rooms" className={({ isActive }) => isActive ? "header-nav-link active" : "header-nav-link"}>Collab Rooms</NavLink>
        <NavLink to="/resources" className={({ isActive }) => isActive ? "header-nav-link active" : "header-nav-link"}>Resource Hub</NavLink>
        <NavLink to="/mood-tracker" className={({ isActive }) => isActive ? "header-nav-link active" : "header-nav-link"}>Wellness</NavLink>
        <NavLink to="/study-enhance" className={({ isActive }) => isActive ? "header-nav-link active" : "header-nav-link"}>Smart Learn</NavLink>
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