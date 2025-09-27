// frontend/src/components/study-enhance/flashcards/StartStudyPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../sidebar/Sidebar'; // Adjust path if necessary
import './StartStudyPage.css'; // We will create this CSS file next
import { FaBookOpen, FaPlus } from 'react-icons/fa';
import { BsCollectionFill, BsLightningFill } from 'react-icons/bs';
import { FaStar, FaUserFriends, FaRocket, FaLayerGroup, FaChartBar, FaCog } from 'react-icons/fa';

const StartStudyPage = () => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
   const sidebarItems = [
      {
        section: "Study",
        items: [
          {
            name: "Start Studying",
            path: "/study-enhance/flashcards/session",
            icon: <BsLightningFill />,
          },
          {
            name: "Review Mastered",
            path: "/study-enhance/flashcards/review",
            icon: <FaStar />,
          },
        ],
      },
      {
        section: "Library",
        items: [
          {
            name: "All Decks",
            path: "/study-enhance/decks",
            icon: <BsCollectionFill />,
          },
  
          {
            name: "Shared Flashcards",
            path: "/study-enhance/flashcards/shared",
            icon: <FaUserFriends />,
          },
        ],
      },
      {
        section: "Create",
        items: [
          {
            name: "Generate with AI",
            path: "/study-enhance/generate",
            icon: <FaRocket />,
          },
          {
            name: "Mind Maps",
            path: "/study-enhance/mindmaps",
            icon: <FaLayerGroup />,
          },
        ],
      },
      {
        section: "Analytics",
        items: [
          {
            name: "Statistics",
            path: "/study-enhance/stats",
            icon: <FaChartBar />,
          },
          {
            name: "Settings",
            path: "/study-enhance/settings",
            icon: <FaCog />,
          },
        ],
      },
    ];

  // Fetch the list of available decks
  useEffect(() => {
    const fetchDecks = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to start a study session.');
        setLoading(false);
        return;
      }
      const config = { headers: { 'x-auth-token': token } };
      try {
        const res = await axios.get('https://studysphere-n4up.onrender.com/api/flashcards/decks', config);
        setDecks(res.data);
      } catch (err) {
        setError('Could not load your decks. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDecks();
  }, []);

  // Handle what happens when a user clicks "Study"
  const handleStudyDeck = async (deckId) => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
      // Use the NEW backend route to get the full deck content
      const res = await axios.get(`https://studysphere-n4up.onrender.com/api/flashcards/decks/${deckId}`, config);
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

  const renderContent = () => {
    if (loading) return <div className="loading-spinner"></div>;
    if (error) return <div className="error-message">{error}</div>;
    if (decks.length === 0) {
      return (
        <div className="no-decks-container">
          <h2>No Decks to Study</h2>
          <p>Create a new deck with AI to get started!</p>
          <button onClick={() => navigate('/study-enhance/generate')} className="create-deck-button">
            <FaPlus /> Create a Deck
          </button>
        </div>
      );
    }
    return (
      <div className="deck-selection-list">
        {decks.map((deck) => (
          <div key={deck._id} className="deck-selection-item">
            <div className="deck-info">
              <h3>{deck.title}</h3>
              <span>{deck.cardCount} cards</span>
            </div>
            <button className="study-deck-button" onClick={() => handleStudyDeck(deck._id)}>
              <FaBookOpen /> Study
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="sidebar-page-layout">
      <Sidebar sectionName={"Smart Flashcards"} isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} items={sidebarItems} />
      <div className={`sidebar-page-content ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="study-session-container">
          <div className="study-session-header">
            <h1>Start a Study Session</h1>
            <p>Select a deck from your library to begin.</p>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default StartStudyPage;