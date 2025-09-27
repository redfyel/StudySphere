import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// FIX: Added .jsx extension to resolve the module not found error.
import { useAuth } from '../../contexts/UserLoginContext'; 
// FIX: Added .css extension to resolve the module not found error.
import './AuthScreen.css'; 
import axios from 'axios';
import Loading from '../loading/Loading';

function AuthScreen() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Use the unified authentication hook
  const { login, isAuthenticated } = useAuth(); 
  
  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    // Redirect immediately if already authenticated
    if (isAuthenticated) {
      navigate('/room', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!password.trim() || !email.trim()) {
      setError('Email and Password are required.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://studysphere-n4up.onrender.com/api/users/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      
      // 2. Extract necessary data from axios response (res.data)
      const { token, userId, username, email: userEmail, isNewUser } = res.data;

      // 3. Call the unified login function to update context and localStorage
      login(token, userId, username, userEmail); 
      
      console.log("Login successful. Redirecting user:", username);

      // 4. Show welcome message for new users (using console.log instead of alert)
      if (isNewUser) {
        console.log(`Welcome to StudySphere, ${username}! Let's get you started.`);
      }

      // 5. Redirect to the protected room
      navigate('/room',{replace:true}); 

    } catch (err) {
      // --- Error Handling ---
      setIsLoading(false);
      if (err.response && err.response.data) {
        const errorMsg = err.response.data.errors 
                         ? err.response.data.errors[0].msg 
                         : err.response.data.msg;
        setError(errorMsg || 'Login failed. Please check your credentials.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="auth-screen-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container">
            {/* Note: This image URL requires /studysphere.svg to exist in your public directory */}
            <img src="/studysphere.svg" alt="StudySphere Logo" className="logo-icon" />
            <h1>StudySphere</h1>
          </div>
          <h2>Welcome!</h2>
          <p>Join collaborative study sessions or create your own focused learning environment.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loading text="Authenticating..." />
              </>
            ) : (
              'Continue to Study Rooms'
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            <strong>Not Registered yet?</strong> <Link to="/register"> Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;
