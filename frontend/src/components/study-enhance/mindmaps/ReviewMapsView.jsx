import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../sidebar/Sidebar';
import { BsLightningFill, BsCollectionFill } from 'react-icons/bs';
import { FaUserFriends, FaRocket } from 'react-icons/fa';

import { FaStar, FaRedoAlt, FaSitemap } from 'react-icons/fa';
import './ReviewMapsView.css';

const ReviewMapsView = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navigate = useNavigate();
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  
   const sidebarItems = [
     { section: "Study", items: [ { name: "Start Studying", path: "/study-enhance/mindmaps/session", icon: <BsLightningFill /> }, { name: "Review Maps", path: "/study-enhance/mindmaps/review", icon: <FaStar /> }, ] },
     { section: "Library", items: [ { name: "All Mind Maps", path: "/study-enhance/mindmaps/all", icon: <FaSitemap /> }, { name: "Shared Mind Maps", path: "/study-enhance/mindmaps/shared", icon: <FaUserFriends /> }, ] },
     { section: "Create", items: [ { name: "Generate with AI", path: "/study-enhance/generate", icon: <FaRocket /> }, { name: "Flashcards", path: "/study-enhance/decks", icon: <BsCollectionFill /> }, ] },
   ];

  useEffect(() => {
    const fetchLatestSessions = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      try {
        const res = await axios.get('https://studysphere-n4up.onrender.com/api/mindmaps/sessions/latest', config);
        if (Array.isArray(res.data)) {
          setSessions(res.data);
        }
      } catch (err) {
        setError('Could not load your review history.');
      } finally {
        setLoading(false);
      }
    };
    fetchLatestSessions();
  }, []);

  const handleReviewMap = async (mapId) => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
      const res = await axios.get(`https://studysphere-n4up.onrender.com/api/mindmaps/${mapId}`, config);
      navigate('/study-enhance/mindmaps/view', { state: { mindMapData: res.data } });
    } catch (err) {
      setError('Failed to load the selected mind map.');
    }
  };

  const renderContent = () => {
    if (loading) return <div className="loading-spinner"></div>;
    if (error) return <div className="error-message">{error}</div>;
    if (sessions.length === 0) {
      return (
        <div className="no-content-container">
          <div className="no-content-icon"><FaStar /></div>
          <h2>No Review History</h2>
          <p>Review a mind map from your library, and it will appear here to help you track your progress.</p>
        </div>
      );
    }
    return (
      <div className="sessions-grid">
        {sessions.map(session => (
          <div key={session.mapId} className="session-card">
            <div className="session-card-content">
                <FaSitemap className="session-card-icon" />
                <div>
                    <h3 className="session-map-title">{session.title}</h3>
                    <p className="last-reviewed-date">
                    Last Reviewed: {new Date(session.lastReviewed).toLocaleString()}
                    </p>
                </div>
            </div>
            <button className="review-map-button" onClick={() => handleReviewMap(session.mapId)}>
              <FaRedoAlt /> Review Again
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="sidebar-page-layout">
      <Sidebar sectionName={"Smart Mind Maps"} isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} items={sidebarItems} />
      <div className={`sidebar-page-content ${isCollapsed ? "collapsed" : ""}`}>
        <div className="page-container">
          <div className="study-session-header">
            <h1>Review Maps</h1>
            <p>Revisit your mind maps based on your recent study history to reinforce your learning.</p>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ReviewMapsView