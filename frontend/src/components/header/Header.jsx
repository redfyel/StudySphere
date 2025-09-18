import { useState, useEffect } from 'react';
import { NavLink } from "react-router-dom";
import logo from '/logo.png';
import './Header.css';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = () => {
    if (window.scrollY > 50) {  // Adjust this value for how much scrolling triggers the effect
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={scrolled ? "header-container scrolled" : "header-container"}>
      <div className="logo-container">
        <img src={logo} alt="StudySphere Logo" className="logo-icon" />
        <NavLink to="/" className="logo-title-link">
          <h1 className="logo-title">StudySphere</h1>
        </NavLink>
      </div>
      <nav className="main-nav">
        <NavLink 
          to="/rooms" 
          className={({isActive}) => isActive ? "nav-link active" : "nav-link"} 
          end
        >
          Rooms
        </NavLink>

        <NavLink 
          to="/resources" 
          className={({isActive}) => isActive ? "nav-link active" : "nav-link"} 
          end
        >
          Resource Hub
        </NavLink>

        <NavLink 
          to="/mood-tracker" 
          className={({isActive}) => isActive ? "nav-link active" : "nav-link"} 
          end
        >
          Mood
        </NavLink>
        <NavLink 
          to="/study-enhance" 
          className={({isActive}) => isActive ? "nav-link active" : "nav-link"}
        >
          Study Enhancement
        </NavLink>
      </nav>
    </header>
  );
};

export default Header;
