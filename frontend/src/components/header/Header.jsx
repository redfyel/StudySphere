import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import "./Header.css";
import logo from "/logo.png";

// Correctly import the useAuth hook from your context file
// Make sure your context exports a 'logout' function
import { useAuth } from "./../../contexts/UserLoginContext";

function Header() {
  // 1. Destructure the logout function from the context
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    // Close the mobile menu if it's open
    setIsMenuOpen(false);
    // Call the logout function from your context
    logout();
  };

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
      <nav className={`nav-container ${isMenuOpen ? "active" : ""}`}>
        <NavLink
          to="/room"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          onClick={() => setIsMenuOpen(false)}
        >
          Collab Rooms
        </NavLink>
        <NavLink
          to="/resources"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          onClick={() => setIsMenuOpen(false)}
        >
          Resource Hub
        </NavLink>
        <NavLink
          to="/mood-tracker"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          onClick={() => setIsMenuOpen(false)}
        >
          Wellness
        </NavLink>
        <NavLink
          to="/study-enhance"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          onClick={() => setIsMenuOpen(false)}
        >
          Smart Learn
        </NavLink>
        <NavLink
          to="/leaderboard"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          onClick={() => setIsMenuOpen(false)}
        >
          Leaderboard
        </NavLink>
      </nav>

      {/* Right: Buttons - Conditionally Rendered */}
      <div className="header-buttons">
        {isLoading ? null : (
          <>
            {isAuthenticated ? (
              // 2. Use a fragment to group the profile and logout icons
              <>
                <NavLink
                  to="/dashboard"
                  className="profile-link"
                  title={`View Profile for ${user?.username}`}
                >
                  <span className="material-icons profile-icon">
                    account_circle
                  </span>
                </NavLink>

                {/* 3. Add the logout button */}
                <button
                  onClick={handleLogout}
                  className="logout-button"
                  title="Logout"
                >
                  <span className="material-icons logout-icon">logout</span>
                </button>
              </>
            ) : (
              <NavLink to="/login" className="rbtn join">
                Join Now
              </NavLink>
            )}
          </>
        )}
      </div>

      {/* Hamburger Menu Icon */}
      <div
        className={`hamburger-menu ${isMenuOpen ? "active" : ""}`}
        onClick={toggleMenu}
      >
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>
    </header>
  );
}

export default Header;