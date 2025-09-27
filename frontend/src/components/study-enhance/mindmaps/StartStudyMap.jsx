import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../sidebar/Sidebar';
import { FaSitemap, FaPlus, FaStar, FaUserFriends, FaRocket } from 'react-icons/fa';
import { BsLightningFill, BsCollectionFill } from 'react-icons/bs';
import './StartStudyMaps.css';
import Loading from '../../loading/Loading';
import ErrorMessage from '../../errormessage/ErrorMessage';


const AllMindMapsView = () => {
  const [maps, setMaps] = useState([]);
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
    const fetchMaps = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      try {
        const res = await axios.get('https://studysphere-n4up.onrender.com/api/mindmaps', config);
        if (Array.isArray(res.data)) {
            setMaps(res.data);
        }
      } catch (err) {
        setError('Failed to load your mind maps. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchMaps();
  }, []);

  const handleSelectMap = async (mapId) => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
      const res = await axios.get(`https://studysphere-n4up.onrender.com/api/mindmaps/${mapId}`, config);
      // Navigate to the existing MindMapView, passing the full data
      navigate('/study-enhance/mindmaps/view', { state: { mindMapData: res.data } });
    } catch (err) {
      setError('Could not load the selected mind map.');
    }
  };

  const renderContent = () => {

    if (loading) return <Loading text="Loading your Study Session..." />
    if (error) return <ErrorMessage message={"There was an error loading your maps."}/>;
    if (maps.length === 0) {
      return (
        <div className="no-content-container">
          <div className="no-content-icon"><FaSitemap /></div>
          <h2>Your Canvas is Blank</h2>
          <p>Create your first mind map to start visualizing your ideas.</p>
          <Link to="/study-enhance/generate" className="action-button">
            <FaPlus /> Create New Map
          </Link>
        </div>
      );
    }
    return (
      <div className="maps-grid">
        {maps.map(map => (
          <div key={map._id} className="map-card" onClick={() => handleSelectMap(map._id)}>
            <div className="map-card-icon"><FaSitemap /></div>
            <div className="map-card-info">
              <h3>{map.title}</h3>
              <p>Created: {new Date(map.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="sidebar-page-layout">
      <Sidebar sectionName={"Smart Mind Maps"} isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} items={sidebarItems} />
      <div className={`sidebar-page-content ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="page-container">
          <div className="study-session-header">
            <h1>Start a Study Session</h1>
            <p>Select a mind map from your library to begin.</p>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AllMindMapsView;