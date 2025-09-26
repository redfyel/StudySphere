import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import "./Header.css";
import logo from "/logo.png";

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  // Effect to handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      // Set scrolled state if user scrolls down more than 50px
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    // Add the "scrolled" class based on the state
    <header className={isScrolled ? "header scrolled" : "header"}>
      {/* Left: Logo + Name */}
      <Link to="/" className="logo">
        <img src={logo} alt="logo" className="logo-icon" />
        <div className="logo-text">
          Study<span>Sphere</span>
        </div>
      </Link>

      {/* Center: Nav Pills */}
      <nav className="header-nav-container">
        <NavLink to="/rooms" className={({ isActive }) => (isActive ? "header-nav-link active" : "header-nav-link")}>
          Collab Rooms
        </NavLink>
        <NavLink to="/resources" className={({ isActive }) => (isActive ? "header-nav-link active" : "header-nav-link")}>
          Resource Hub
        </NavLink>
        <NavLink to="/mood-tracker" className={({ isActive }) => (isActive ? "header-nav-link active" : "header-nav-link")}>
          Wellness
        </NavLink>
        <NavLink to="/study-enhance" className={({ isActive }) => (isActive ? "header-nav-link active" : "header-nav-link")}>
          Smart Learn
        </NavLink>
      </nav>

      {/* Right: Buttons */}
      <div className="header-buttons">
        <NavLink to="/dashboard" className="rbtn">Dashboard</NavLink>
        <NavLink to="/register" className="rbtn join">
          Join Now
        </NavLink>
        
      </div>
    </header>
  );
}

export default Header;