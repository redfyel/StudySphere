import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { TrendingUp } from 'lucide-react';
import { UserLoginContext } from '../../contexts/UserLoginContext';
import Loading from '../loading/Loading';
import ErrorMessage from '../errormessage/ErrorMessage';
// --- CHANGE #1: Import your reusable Tab component ---
import PrimaryNavTabs from '../tabs/PrimaryNavTabs'; // Adjust path if needed
import './Leaderboard.css';

import gold from '../../assets/badges/gold.png';
import silver from '../../assets/badges/silver.png';
import bronze from '../../assets/badges/bronze.png';

// Helper function to format seconds into "Xh Ym"
const formatStudyTime = (totalSeconds) => {
  if (!totalSeconds) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// RankBadge component remains the same
const RankBadge = ({ rank }) => {
  if (rank === 1) return <img src={gold} alt="Gold Badge" className="badge-image" />;
  if (rank === 2) return <img src={silver} alt="Silver Badge" className="badge-image" />;
  if (rank === 3) return <img src={bronze} alt="Bronze Badge" className="badge-image" />;
  return <span className="leaderboard-rank-number">{rank}</span>;
};

// --- CHANGE #2: Create a mapping between internal state and display labels ---
const TABS = {
  time: "Study Hours",
  streak: "Study Streaks",
};

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // State remains the same, using 'time' and 'streak' for API calls
  const [activeTab, setActiveTab] = useState('time'); 
  const { token } = useContext(UserLoginContext);

  useEffect(() => {
    // This useEffect hook works perfectly with no changes needed!
    // 'activeTab' is still 'time' or 'streak', which is what the API expects.
    const fetchLeaderboard = async () => {
      if (!token) return;
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

  // --- CHANGE #3: Create a handler to translate the clicked label back to an ID ---
  const handleTabClick = (tabLabel) => {
    // Find the key ('time' or 'streak') that corresponds to the clicked label
    const newActiveTabId = Object.keys(TABS).find(key => TABS[key] === tabLabel);
    if (newActiveTabId) {
      setActiveTab(newActiveTabId);
    }
  };

  const loadingMessage = activeTab === 'time'
    ? "Ranking by Study Hours..."
    : "Ranking by Study Streaks...";

  const topThree = leaders.slice(0, 3);
  const restOfLeaders = leaders.slice(3);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <TrendingUp size={28} />
        <h2 className="leaderboard-title">Weekly Leaders</h2>
      </div>

      {/* --- CHANGE #4: Replace the old buttons with the PrimaryNavTabs component --- */}
      <PrimaryNavTabs
        tabs={Object.values(TABS)} // Pass the display labels: ["Study Hours", "Study Streaks"]
        activeTab={TABS[activeTab]} // Pass the active display label: "Study Hours" or "Study Streaks"
        onTabClick={handleTabClick} // Pass the handler function
      />
      
      {isLoading ? (
        <div className="leaderboard-loading-state">
          <Loading text={loadingMessage} />
        </div>
      ) : error ? (
        <ErrorMessage message={error.message} />
      ) : (
        <>
          {leaders.length > 0 ? (
            <>
              <div className="leaderboard-podium">
                {topThree.map((user, index) => (
                  <div key={user._id} className={`podium-member rank-${index + 1}`}>
                    <div className="podium-rank"><RankBadge rank={index + 1} /></div>
                    <div className="podium-name">{user.name}</div>
                    <div className='podium-number'><span>{index + 1}</span></div>
                    <div className="podium-score">
                      {activeTab === 'time'
                        ? formatStudyTime(user.totalStudyTime)
                        : `${user.studyStreak || 0} days`}
                    </div>
                  </div>
                ))}
              </div>
              <div className="leaderboard-list">
                <ol start="4">
                  {restOfLeaders.map((user, index) => (
                    <li key={user._id} className="leaderboard-item">
                      <div className="leaderboard-rank">
                        <RankBadge rank={index + 4} />
                      </div>
                      <span className="leaderboard-name">{user.name}</span>
                      <span className="leaderboard-score">
                        {activeTab === 'time'
                          ? formatStudyTime(user.totalStudyTime)
                          : `${user.studyStreak || 0} days`}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          ) : (
            <p className="no-data-message">The leaderboard is empty. Be the first to start a study session!</p>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;