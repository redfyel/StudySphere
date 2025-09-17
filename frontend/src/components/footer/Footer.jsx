import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-logo">
          Study<span>Sphere</span>
        </div>
        <nav className="footer-nav">
          <NavLink to="/mood-tracker">Mood Tracker</NavLink>
          <NavLink to="/study-enhance">Study Enhance</NavLink>
          <NavLink to="/rooms">Rooms</NavLink>
          <NavLink to="/resource-hub">Resource Hub</NavLink>
        </nav>
        <div className="footer-socials">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub /></a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} StudySphere | All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;