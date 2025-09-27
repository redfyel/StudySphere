
// AuthScreen.js - Updated with session token handling
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './AuthScreen.css';

function AuthScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { handleAuthSuccess, isAuthenticated } = useAuth();

  useEffect(() => {
    // If already authenticated, redirect to rooms
    if (isAuthenticated) {
      navigate('/room', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name.trim() || !email.trim()) {
      setError('Name and Email are required.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://studysphere-n4up.onrender.com/api/users/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed.');
      }

      const data = await response.json();
      
      // Use context to handle authentication
      handleAuthSuccess(data.userId, data.username, data.email, data.sessionToken);

      // Show welcome message for new users
      if (data.isNewUser) {
        alert(`Welcome to StudySphere, ${data.username}! Let's get you started.`);
      }

      navigate('/room', { replace: true });
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-screen-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container">
            <img src="/studysphere.svg" alt="StudyVerse Logo" className="logo-icon" />
            <h1>StudySphere</h1>
          </div>
          <h2>Welcome!</h2>
          <p>Join collaborative study sessions or create your own focused learning environment.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Your Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Doe"
              required
              autoFocus
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Your Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., john.doe@example.com"
              required
              disabled={isLoading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Authenticating...
              </>
            ) : (
              'Continue to Study Rooms'
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            <strong>New users:</strong> Create an account automatically<br/>
            <strong>Returning users:</strong> Access your existing account
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;