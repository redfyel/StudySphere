// WelcomePage.js - Full page welcome experience for new users
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/UserLoginContext';
import { useNavigate } from 'react-router-dom';
import './WelcomePopUp.css';

const WelcomePopUp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    // Sequential animation stages
    const timers = [
      setTimeout(() => setAnimationStage(1), 300),
      setTimeout(() => setAnimationStage(2), 800),
      setTimeout(() => setAnimationStage(3), 1300)
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  const handleGetStarted = () => {
    // Mark user as having seen welcome
    if (user?.userId) {
      localStorage.setItem(`welcome_seen_${user.userId}`, 'true');
    }
    // Navigate to rooms page
    navigate('/room', { replace: true });
  };

  const features = [
    {
      icon: '🏠',
      title: 'Create Study Rooms',
      description: 'Set up focused learning environments tailored to your subjects and study goals'
    },
    {
      icon: '👥',
      title: 'Join Others',
      description: 'Collaborate with fellow learners, share knowledge, and study together'
    },
    {
      icon: '📚',
      title: 'Stay Productive',
      description: 'Track your progress, set goals, and maintain focus in your learning journey'
    },
    {
      icon: '⚡',
      title: 'Real-time Collaboration',
      description: 'Chat, share resources, and work together in real-time study sessions'
    },
    {
      icon: '🎯',
      title: 'Organized Learning',
      description: 'Filter, search, and organize rooms by topics, difficulty, and more'
    },
    {
      icon: '🔒',
      title: 'Privacy Control',
      description: 'Create public or private rooms with full control over who can join'
    }
  ];

  return (
    <div className="welcome-page">
      {/* Animated Background */}
      <div className="welcome-background">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
      </div>

      <div className="welcome-container">
        {/* Main Welcome Section */}
        <div className={`welcome-hero ${animationStage >= 1 ? 'animate-in' : ''}`}>
          <div className="welcome-icon-large">🎉</div>
          <h1 className="welcome-title">
            Welcome to <span className="brand-highlight">CollabRooms</span>!
          </h1>
          <p className="welcome-subtitle">
            Hello <strong>{user?.username || 'there'}</strong>! Ready to transform your learning experience with collaborative study rooms?
          </p>
        </div>

        {/* Features Grid */}
        <div className={`features-section ${animationStage >= 2 ? 'animate-in' : ''}`}>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card"
                style={{ 
                  animationDelay: animationStage >= 2 ? `${index * 0.1}s` : '0s' 
                }}
              >
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">{feature.icon}</div>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Section */}
        <div className={`welcome-actions ${animationStage >= 3 ? 'animate-in' : ''}`}>
          <h2 className="actions-title">Ready to Get Started?</h2>
          <p className="actions-subtitle">
            Create your first study room or explore existing ones to begin your collaborative learning journey
          </p>
          <button 
            className="get-started-btn"
            onClick={handleGetStarted}
          >
            <span className="btn-text">Let's Go!</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>

        {/* Quick Tips */}
        <div className={`tips-section ${animationStage >= 3 ? 'animate-in' : ''}`}>
          <div className="tip-card">
            <div className="tip-icon">💡</div>
            <div className="tip-content">
              <strong>Pro Tip:</strong> Start by creating a room for your current subject, or browse existing rooms to find study partners!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopUp;