import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { TrendingUp } from 'lucide-react';
import { UserLoginContext } from '../../contexts/UserLoginContext';
// We don't need the full page Loading component anymore for this page
// import Loading from '../loading/Loading'; 
import ErrorMessage from '../errormessage/ErrorMessage';
import PrimaryNavTabs from '../tabs/PrimaryNavTabs';
import './Leaderboard.css';

import gold from '../../assets/badges/gold.png';
import silver from '../../assets/badges/silver.png';
import bronze from '../../assets/badges/bronze.png';

// Helper function (unchanged)
const formatStudyTime = (totalSeconds) => { /* ... */ };

// RankBadge component (unchanged)
const RankBadge = ({ rank }) => { /* ... */ };

const TABS = {
  time: "Study Hours",
  streak: "Study Streaks",
};

// --- NEW SKELETON COMPONENT ---
// A simple component to show while data is loading
const SkeletonRow = () => (
  <li className="skeleton-item">
    <div className="skeleton-rank"></div>
    <div className="skeleton-name"></div>
    <div className="skeleton-score"></div>
  </li>
);


const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('time'); 
  const { token } = useContext(UserLoginContext);

  useEffect(() => {
    // This data fetching logic remains exactly the same
    const fetchLeaderboard = async () => {
      if (!token) {
        setIsLoading(false); // Make sure to stop loading if there's no token
        return;
      };
      setIsLoading(true);
      setError(null);
      try {
        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.get(`https://studysphere-n4up.onrender.com/api/leaderboard/${activeTab}`, config);
        setLeaders(res.data);
      } catch (err) {
        setError({
          message: `Failed to load ${activeTab} leaderboard.`,
          details: err.response?.data || { error: err.message },
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [activeTab, token]);

  const handleTabClick = (tabLabel) => {
    const newActiveTabId = Object.keys(TABS).find(key => TABS[key] === tabLabel);
    if (newActiveTabId) {
      setActiveTab(newActiveTabId);
    }
  };

  const topThree = leaders.slice(0, 3);
  const restOfLeaders = leaders.slice(3);

  return (
    // --- CHANGE #1: The main container is ALWAYS rendered now ---
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <TrendingUp size={28} />
        <h2 className="leaderboard-title">Weekly Leaders</h2>
      </div>

      <PrimaryNavTabs
        tabs={Object.values(TABS)}
        activeTab={TABS[activeTab]}
        onTabClick={handleTabClick}
      />
      
      {/* --- CHANGE #2: The loading/error logic is moved INSIDE the content area --- */}
      {error ? (
        <ErrorMessage message={error.message} />
      ) : (
        <>
          {/* Always render the podium and list structure */}
          <div className="leaderboard-podium">
            {isLoading ? (
              // Show skeleton placeholders for the podium
              [...Array(3)].map((_, i) => <div key={i} className="podium-member skeleton-podium"></div>)
            ) : (
              topThree.map((user, index) => (
                <div key={user._id} className={`podium-member rank-${index + 1}`}>
                  <div className="podium-rank"><RankBadge rank={index + 1} /></div>
                  <div className="podium-name">{user.name}</div>
                  <div className="podium-score">
                    {activeTab === 'time' ? formatStudyTime(user.totalStudyTime) : `${user.studyStreak || 0} days`}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="leaderboard-list">
            <ol start="4">
              {isLoading ? (
                // Show 5 skeleton rows while loading
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : (
                restOfLeaders.map((user, index) => (
                  <li key={user._id} className="leaderboard-item">
                    <div className="leaderboard-rank"><RankBadge rank={index + 4} /></div>
                    <span className="leaderboard-name">{user.name}</span>
                    <span className="leaderboard-score">
                      {activeTab === 'time' ? formatStudyTime(user.totalStudyTime) : `${user.studyStreak || 0} days`}
                    </span>
                  </li>
                ))
              )}
            </ol>
             {/* Show this message only if loading is finished AND there's no data */}
            {!isLoading && leaders.length === 0 && (
                <p className="no-data-message">The leaderboard is empty. Be the first to start a study session!</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;