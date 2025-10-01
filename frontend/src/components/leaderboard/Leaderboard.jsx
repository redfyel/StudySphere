import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { TrendingUp } from 'lucide-react';
import { UserLoginContext } from '../../contexts/UserLoginContext';
import ErrorMessage from '../errormessage/ErrorMessage';
import PrimaryNavTabs from '../tabs/PrimaryNavTabs';
import './Leaderboard.css';

import gold from '../../assets/badges/gold.png';
import silver from '../../assets/badges/silver.png';
import bronze from '../../assets/badges/bronze.png';

// ✅ Helper: format seconds into "Xh Ym"
const formatStudyTime = (totalSeconds) => {
  if (!totalSeconds) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// ✅ Show badge images or rank number
const RankBadge = ({ rank }) => {
  if (rank === 1) return <img src={gold} alt="Gold Badge" className="badge-image" />;
  if (rank === 2) return <img src={silver} alt="Silver Badge" className="badge-image" />;
  if (rank === 3) return <img src={bronze} alt="Bronze Badge" className="badge-image" />;
  return <span className="leaderboard-rank-number">{rank}</span>;
};

// Tabs mapping
const TABS = {
  time: "Study Hours",
  streak: "Study Streaks",
};

// ✅ Skeleton Row for loading state
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
    const fetchLeaderboard = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
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
      
      {error ? (
        <ErrorMessage message={error.message} />
      ) : (
        <>
          {isLoading ? (
            // ✅ Show skeletons while loading
            <div className="leaderboard-list">
              <ol>
                {[...Array(5)].map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </ol>
            </div>
          ) : leaders.length > 0 ? (
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
            <p className="no-data-message">
              The leaderboard is empty. Be the first to start a study session!
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;
