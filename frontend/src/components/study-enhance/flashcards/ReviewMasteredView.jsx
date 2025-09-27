// frontend/src/components/review-mastered/ReviewMasteredView.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../sidebar/Sidebar';
// ✅ Cleaned up unused imports for tidiness
import { BsCollectionFill, BsLightningFill } from 'react-icons/bs';
import { FaUserFriends, FaLayerGroup, FaChartBar, FaCog, FaStar, FaRedoAlt, FaRocket } from 'react-icons/fa';
import './ReviewMasteredView.css';

const ReviewMasteredView = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navigate = useNavigate();
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  
  const sidebarItems = [
     {
       section: 'Study',
       items: [
         { name: 'Start Studying', path: '/study-enhance/flashcards/session', icon: <BsLightningFill /> },
         { name: 'Review Mastered', path: '/study-enhance/flashcards/review', icon: <FaStar /> },
       ],
     },
     {
       section: 'Library',
       items: [
         { name: 'All Decks', path: '/study-enhance/decks', icon: <BsCollectionFill /> },
         { name: 'Shared Flashcards', path: '/study-enhance/flashcards/shared', icon: <FaUserFriends /> },
       ],
     },
     {
       section: 'Create',
       items: [
         { name: 'Generate with AI', path: '/study-enhance/generate', icon: <FaRocket /> },
         { name: 'Mind Maps', path: '/study-enhance/mindmaps', icon: <FaLayerGroup /> },
       ],
     },
     {
       section: 'Analytics',
       items: [
         { name: 'Statistics', path: '/study-enhance/stats', icon: <FaChartBar /> },
         { name: 'Settings', path: '/study-enhance/settings', icon: <FaCog /> },
       ],
     },
   ];

  useEffect(() => {
    const fetchLatestSessions = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      try {
        const res = await axios.get('https://studysphere-n4up.onrender.com//api/flashcards/sessions/latest', config);
        
        if (Array.isArray(res.data)) {
          setSessions(res.data);
        } else {
          console.error("API response is not an array:", res.data);
          setSessions([]); 
        }
      } catch (err) {
        setError('Could not load your review sessions. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestSessions();
  }, []);
const handleStudyDeck = async (deckId) => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
      // Use the NEW backend route to get the full deck content
      const res = await axios.get(`https://studysphere-n4up.onrender.com//api/flashcards/decks/${deckId}`, config);
      const fullDeck = res.data;

      if (fullDeck && fullDeck.flashcards) {
        // Navigate to the study view, passing the flashcards in the state
        // This reuses your existing FlashcardsView component perfectly
        navigate('/study-enhance/flashcards', { 
          state: { generatedFlashcards: fullDeck.flashcards } 
        });
      }
    } catch (err) {
      setError(`Failed to load deck: ${err.response?.data?.msg || 'Server error'}`);
    }
  };
  // This function is correctly implemented. No changes are needed.
  const handleReviewDeck = async (deckId) => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
      const res = await axios.get(`https://studysphere-n4up.onrender.com//api/flashcards/decks/${deckId}`, config);
      if (res.data?.flashcards) {
        navigate('/study-enhance/flashcards/session', { 
          state: { 
            generatedFlashcards: res.data.flashcards, 
            deckId: deckId, 
            deckTitle: res.data.title 
          } 
        });
      }
    } catch (err) {
      setError(`Failed to load deck for review.`);
    }
  };

  const renderContent = () => {
    if (loading) return <div className="loading-spinner"></div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!sessions || sessions.length === 0) {
      return (
        <div className="no-sessions-container">
          <div className="icon-wrapper"><FaStar /></div>
          <h2>No Study History</h2>
          <p>Complete a study session for a deck, and your results will appear here ready for review.</p>
        </div>
      );
    }
    return (
      <div className="sessions-grid">
        {sessions.map(session => (
          <div key={session.deckId} className="session-card">
            <h3 className="session-deck-title">{session.deckTitle}</h3>
            <p className="last-studied-date">
              Last studied on {new Date(session.lastStudied).toLocaleDateString()}
            </p>
            <div className="session-card-stats">
              <div className="stat">
                <span className="stat-value mastered">{session.masteredCount}</span>
                <span className="stat-label">Mastered</span>
              </div>
              <div className="stat">
                <span className="stat-value forgot">{session.forgotCount}</span>
                <span className="stat-label">Needs Review</span>
              </div>
            </div>
            <button className="review-deck-button" onClick={() => handleStudyDeck(session.deckId)}>
              <FaRedoAlt /> Review Deck
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="sidebar-page-layout">
      <Sidebar sectionName={"Smart Flashcards"} isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} items={sidebarItems} />
      <div className={`sidebar-page-content ${isCollapsed ? "collapsed" : ""}`}>
        <div className="review-container">
          <div className="study-session-header">
            <h1>Review Mastered</h1>
            <p>Revisit your decks to solidify your knowledge and track your progress over time.</p>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ReviewMasteredView;