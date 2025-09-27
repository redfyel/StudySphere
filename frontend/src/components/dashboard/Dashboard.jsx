import React, { useState, useEffect, useContext } from 'react';
// --- CHANGE #1: Import Link from react-router-dom ---
import { Link } from 'react-router-dom';
import { UserLoginContext } from '../../contexts/UserLoginContext';

// --- CHANGE #2: Import new, more specific icons ---
import { 
  Flame, Clock, TrendingUp, HeartPulse, 
  Layers, GitFork, Library, Users, BarChart2 
} from 'lucide-react';
import './Dashboard.css';

// Helper to format time (unchanged)
const formatStudyTime = (totalSeconds) => {
  if (!totalSeconds) return "0h 0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const Dashboard = () => {
  const { user } = useContext(UserLoginContext);

  // Mock data (unchanged)
  const [stats, setStats] = useState({ streak: 7, totalTime: 12600 });
  const [leaderboard, setLeaderboard] = useState([
    { name: 'Alex R.', rank: 1 },
    { name: 'Sarah J.', rank: 2 },
    { name: 'You', rank: 3 },
  ]);
  const [wellness, setWellness] = useState({ lastMood: 'Focused' });

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome back, {user ? user.username : 'Student'}!</h1>
        <p>What's your main focus today?</p>
      </header>

      <main className="dashboard-grid">
        {/* -- STATS BAR (Unchanged) -- */}
        <section className="dashboard-card stats-bar">
          <div className="stat-item">
            <div className="stat-icon-wrapper streak"><Flame size={24} /></div>
            <div className="stat-content">
              <span className="stat-value">{stats.streak} Days</span>
              <span className="stat-label">Study Streak</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon-wrapper time"><Clock size={24} /></div>
            <div className="stat-content">
              <span className="stat-value">{formatStudyTime(stats.totalTime)}</span>
              <span className="stat-label">Total Study Time</span>
            </div>
          </div>
        </section>

        {/* --- CHANGE #3: Updated QUICK ACTIONS card --- */}
        <section className="dashboard-card quick-actions">
          <h3 className="card-title">My Hub</h3>
          <div className="action-buttons">
            {/* Each button is now a Link component pointing to a specific route */}
            <Link to="/flashcards" className="action-btn">
              <Layers size={18} /> My Flashcards
            </Link>
            <Link to="/mind-maps" className="action-btn">
              <GitFork size={18} /> My Mind Maps
            </Link>
            <Link to="/resources" className="action-btn">
              <Library size={18} /> My Resources
            </Link>
            <Link to="/rooms" className="action-btn">
              <Users size={18} /> My Rooms
            </Link>
            <Link to="/wellness/analysis" className="action-btn">
              <BarChart2 size={18} /> My Mood Analysis
            </Link>
          </div>
        </section>

        {/* -- LEADERBOARD SNAPSHOT (Unchanged) -- */}
        <section className="dashboard-card leaderboard-snapshot">
          <h3 className="card-title"><TrendingUp size={18} /> Leaderboard</h3>
          <ol className="leaderboard-mini-list">
            {leaderboard.map(person => (
              <li key={person.rank} className={person.name === 'You' ? 'is-user' : ''}>
                <span>{person.rank}. {person.name}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* -- WELLNESS SNAPSHOT (Unchanged) -- */}
        <section className="dashboard-card wellness-snapshot">
          <h3 className="card-title"><HeartPulse size={18} /> My Wellness</h3>
          <p className="wellness-status">Your last logged mood was: <strong>{wellness.lastMood}</strong></p>
          <button className="wellness-btn">Log Today's Vibe</button>
        </section>
      </main>
    </div>
  );
};

export  default Dashboard;