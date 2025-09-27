import React from 'react';
// --- CHANGE #1: Import the useNavigate hook ---
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Library, HeartPulse, Sparkles } from 'lucide-react';
import './Home.css';

const Home = () => {
  // --- CHANGE #2: Initialize the navigate function ---
  const navigate = useNavigate();

  // --- CHANGE #3: Create a handler function to go to the register page ---
  const handleNavigateToRegister = () => {
    navigate('/register'); // Make sure '/register' is the correct path in your router setup
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content-left">
          <h1 className="hero-title">
            Focus. Collaborate. Thrive.
          </h1>
          <p className="hero-subtitle">
            Unite AI-powered learning tools, shared resources, and collaborative study rooms—all while keeping your wellbeing in check.
          </p>
          {/* --- CHANGE #4: Attach the onClick handler to the button --- */}
          <button className="hero-cta-button" onClick={handleNavigateToRegister}>
            Join StudySphere <ArrowRight size={20} />
          </button>
        </div>
        <div className="hero-visual-right">
          <div className="visual-card card-3"></div>
          <div className="visual-card card-2"></div>
          <div className="visual-card card-1">
            <div className="card-ui-element"></div>
            <div className="card-ui-text long"></div>
            <div className="card-ui-text short"></div>
          </div>
        </div>
      </header>

      {/* --- Redesigned Features Section --- */}
      <section className="features-showcase-section" id="features">
        {/* Card 1: Collab Rooms */}
        <div className="feature-showcase-card">
          <div className="card-content">
            <div className="feature-icon-wrapper"><Users size={28} /></div>
            <h3 className="feature-title">Collaborative Rooms</h3>
            <p className="feature-description">Join focused study sessions with group timers, shared task lists, and ambient backgrounds. Beat procrastination, together.</p>
          </div>
          <div className="card-visual visual-collab">
            <div className="collab-avatar" style={{ top: '20%', left: '25%' }}></div>
            <div className="collab-avatar" style={{ top: '55%', left: '15%' }}></div>
            <div className="collab-avatar" style={{ top: '35%', left: '60%' }}></div>
            <div className="collab-avatar" style={{ top: '65%', left: '70%' }}></div>
          </div>
        </div>
        
        {/* Card 2: Smart Learn (AI) */}
        <div className="feature-showcase-card">
          <div className="card-content">
            <div className="feature-icon-wrapper"><Sparkles size={28} /></div>
            <h3 className="feature-title">Smart Learning Tools</h3>
            <p className="feature-description">Enhance your study with AI. Instantly generate interactive flashcards and structured mind maps from your notes.</p>
          </div>
          <div className="card-visual visual-ai">
            <div className="ai-node root"></div>
            <div className="ai-node child-1"></div>
            <div className="ai-node child-2"></div>
            <div className="ai-line line-1"></div>
            <div className="ai-line line-2"></div>
          </div>
        </div>

        {/* Card 3: Resource Hub */}
        <div className="feature-showcase-card">
          <div className="card-content">
            <div className="feature-icon-wrapper"><Library size={28} /></div>
            <h3 className="feature-title">Shared Resource Hub</h3>
            <p className="feature-description">Access a community-driven library of notes and links. Contribute and climb the leaderboard.</p>
          </div>
          <div className="card-visual visual-resources">
            <div className="resource-item item-1">File.pdf</div>
            <div className="resource-item item-2">Notes.docx</div>
            <div className="resource-item item-3">Link</div>
          </div>
        </div>

        {/* Card 4: Track & Compete */}
        <div className="feature-showcase-card">
          <div className="card-content">
            <div className="feature-icon-wrapper"><HeartPulse size={28} /></div>
            <h3 className="feature-title">Track & Compete</h3>
            <p className="feature-description">Log your study moods to prevent burnout while building your study streak to compete on the weekly leaderboard.</p>
          </div>
          <div className="card-visual visual-gamify">
            <div className="gamify-streak">
              <span className="streak-fire">🔥</span>
              <span className="streak-number">7</span> Day Streak
            </div>
            <div className="gamify-leaderboard">
              <span className="leaderboard-icon">🏆</span> Top 10
            </div>
          </div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="final-cta-section">
        <h2 className="final-cta-title">Ready to Transform Your Study Habits?</h2>
        {/* --- CHANGE #5: Attach the same handler to this button --- */}
        <button className="hero-cta-button" onClick={handleNavigateToRegister}>
          Join StudySphere <ArrowRight size={20} />
        </button>
      </section>
    </div>
  );
};

export default Home;