import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserLoginContext } from '../../contexts/UserLoginContext'; // Adjust path if needed
import Loading from '../loading/Loading';
import ErrorMessage from '../errormessage/ErrorMessage';
import './Leaderboard.css';

// Helper function to format seconds into "Xh Ym"
const formatStudyTime = (totalSeconds) => {
  if (!totalSeconds) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('time'); // 'time' or 'streak'
  const { token } = useContext(UserLoginContext);

  useEffect(() => {
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
  }, [activeTab, token]); // Refetch when the tab or token changes

  const getRankClass = (index) => {
    if (index === 0) return 'rank-1'; // Gold
    if (index === 1) return 'rank-2'; // Silver
    if (index === 2) return 'rank-3'; // Bronze
    return '';
  };

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">Weekly Leaderboard</h2>
      <div className="leaderboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'time' ? 'active' : ''}`}
          onClick={() => setActiveTab('time')}
        >
          Study Hours
        </button>
        <button
          className={`tab-btn ${activeTab === 'streak' ? 'active' : ''}`}
          onClick={() => setActiveTab('streak')}
        >
          Study Streaks
        </button>
      </div>
      <div className="leaderboard-list">
        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorMessage message={error.message} details={error.details} />
        ) : (
          <ol>
            {leaders.length > 0 ? (
              leaders.map((user, index) => (
                <li key={user._id} className={`leaderboard-item ${getRankClass(index)}`}>
                  <span className="leaderboard-rank">{index + 1}</span>
                  <span className="leaderboard-name">{user.name}</span>
                  <span className="leaderboard-score">
                    {activeTab === 'time'
                      ? formatStudyTime(user.totalStudyTime)
                      : `${user.studyStreak || 0} days`}
                  </span>
                </li>
              ))
            ) : (
              <p className="no-data-message">No data available yet. Start a study session to appear here!</p>
            )}
          </ol>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;