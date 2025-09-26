// frontend/src/components/all-decks/AllDecksView.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../sidebar/Sidebar';
import './AllDecksView.css';
import { FaPlus, FaBookOpen, FaTag, FaChevronDown } from 'react-icons/fa';
import { BsCollectionFill, BsLightningFill } from 'react-icons/bs';
import { FaStar, FaUserFriends, FaRocket, FaLayerGroup, FaChartBar, FaCog } from 'react-icons/fa';

const AllDecksView = () => {
  const [allDecks, setAllDecks] = useState([]);
  const [filteredDecks, setFilteredDecks] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  
  // ✅ NEW: State to manage expansion for each card's tags individually
  const [expandedCardTags, setExpandedCardTags] = useState({});

  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    const fetchDecks = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in. Please log in to see your decks.');
        setLoading(false);
        return;
      }
      const config = { headers: { 'x-auth-token': token } };
      try {
        const res = await axios.get('http://localhost:5000/api/flashcards/decks', config);
        setAllDecks(res.data);
        setFilteredDecks(res.data);

        const tags = res.data.flatMap(deck => deck.tags || []);
        const uniqueTags = [...new Set(tags)].sort();
        setAllTags(uniqueTags);
      } catch (err) {
        setError('Failed to load your decks. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchDecks();
  }, []);

  const handleTagClick = (tag) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
      setFilteredDecks(allDecks);
    } else {
      setSelectedTag(tag);
      setFilteredDecks(allDecks.filter(deck => deck.tags?.includes(tag)));
    }
  };
  
  // ✅ NEW: Handler to toggle the tag visibility for a specific card
  const toggleCardTags = (deckId) => {
    setExpandedCardTags(prev => ({
      ...prev,
      [deckId]: !prev[deckId] // Sets the value to true if it was falsy, or false if it was truthy
    }));
  };

  const handleStudyDeck = async (deckId) => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
      const res = await axios.get(`http://localhost:5000/api/flashcards/decks/${deckId}`, config);
      if (res.data?.flashcards) {
       navigate('/study-enhance/flashcards', { state: { generatedFlashcards: res.data.flashcards, deckId: deckId, deckTitle: res.data.title } });
      }
    } catch (err) {
      setError(`Failed to load deck: ${err.response?.data?.msg || 'Server error'}`);
    }
  };

  const renderContent = () => {
    if (loading) return <div className="loading-spinner"></div>;
    if (error) return <div className="error-message">{error}</div>;
    if (allDecks.length === 0) {
      return (
        <div className="no-decks-container">
          <h2>No Decks Found</h2>
          <p>You haven't created any flashcard decks yet.</p>
          <Link to="/study-enhance/generate" className="create-deck-button"><FaPlus /> Create Your First Deck</Link>
        </div>
      );
    }
    return (
      <>
        <div className="tag-filter-wrapper">
          <button className="tag-filter-header" onClick={() => setIsTagsExpanded(!isTagsExpanded)}>
            <span><FaTag /> Filter by Tag</span>
            <FaChevronDown className={`chevron-icon ${isTagsExpanded ? 'expanded' : ''}`} />
          </button>
          <div className={`tags-collapsible-content ${isTagsExpanded ? 'expanded' : ''}`}>
            <div className="tag-buttons-container">
              <button className={`tag-button ${!selectedTag ? 'active' : ''}`} onClick={() => handleTagClick(null)}>All Decks</button>
              {allTags.map(tag => (
                <button key={tag} className={`tag-button ${selectedTag === tag ? 'active' : ''}`} onClick={() => handleTagClick(tag)}>{tag}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="decks-grid">
          {filteredDecks.length > 0 ? (
            filteredDecks.map((deck) => (
              <div key={deck._id} className="deck-card">
                <div className="deck-card-info">
                  <h3>{deck.title}</h3>
                  <p>{deck.cardCount} Cards</p>
                  <p className="deck-card-date">Created on: {new Date(deck.createdAt).toLocaleDateString()}</p>

                  {/* ✅ CHANGED: Tags section is now a collapsible component */}
                  {deck.tags && deck.tags.length > 0 && (
                    <div className="deck-card-tags-container">
                      <button className="deck-card-tags-header" onClick={() => toggleCardTags(deck._id)}>
                        <span>Tags ({deck.tags.length})</span>
                        <FaChevronDown className={`card-chevron-icon ${expandedCardTags[deck._id] ? 'expanded' : ''}`} />
                      </button>
                      <div className={`deck-card-tags-content ${expandedCardTags[deck._id] ? 'expanded' : ''}`}>
                        {deck.tags.map(tag => (
                          <span key={tag} className="tag-pill">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="deck-card-actions">
                  <button className="study-button" onClick={() => handleStudyDeck(deck._id)}><FaBookOpen /> Study</button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-results-message">No decks found for the selected tag.</p>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="sidebar-page-layout">
      <Sidebar sectionName={"Smart Flashcards"} isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} items={sidebarItems} />
      <div className={`sidebar-page-content ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="decks-container">
          <div className="decks-header">
            <h1>My Flashcard Decks</h1>
            <Link to="/study-enhance/generate" className="create-deck-button-header"><FaPlus /> Create New Deck</Link>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AllDecksView;