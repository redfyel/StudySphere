import React from "react";
import { NavLink, Link } from "react-router-dom";
import "./Header.css";
import logo from "/logo.png";

// Correctly import the useAuth hook from your context file
import { useAuth } from './../../contexts/UserLoginContext';

function Header() {
  
  const { isAuthenticated, isLoading, user } = useAuth();

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
      <nav className="nav-container">
        <NavLink to="/room" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Collab Rooms
        </NavLink>
        <NavLink to="/resources" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Resource Hub
        </NavLink>
        <NavLink to="/mood-tracker" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Wellness
        </NavLink>
        <NavLink to="/study-enhance" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Smart Learn
        </NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Leaderboard
        </NavLink>
      </nav>

      {/* Right: Buttons - Conditionally Rendered */}
      <div className="header-buttons">
        {/* 2. Don't render anything while the session is being checked to avoid a UI flash */}
        {isLoading ? null : (
          <>
            {/* 3. Use the 'isAuthenticated' state to decide what to render */}
            {isAuthenticated ? (
              <NavLink
                to="/dashboard"
                className="profile-link"
                title={`View Profile for ${user?.username}`} // Use user data for better UX
              >
                <span className="material-icons profile-icon">
                  account_circle
                </span>
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className="rbtn join"
              >
                Join Now
              </NavLink>
            )}
          </>
        )}
      </div>
    </header>
  );
}

export default Header;