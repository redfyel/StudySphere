import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { UserLoginContext } from '../../contexts/UserLoginContext';
import '../room/AuthScreen.css'; // 🔥 Reuse the card styles you already have
import Loading from '../loading/Loading';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(UserLoginContext);
  const navigate = useNavigate();
  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post(
        'https://studysphere-n4up.onrender.com/api/auth/login',
        { email, password }
      );

      // save token in context
      login(res.data.token);

      // redirect to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.response && err.response.data) {
        const errorMsg = err.response.data.errors
          ? err.response.data.errors[0].msg
          : err.response.data.msg;
        setError(errorMsg || 'Login failed. Please check your credentials.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-screen-container">
      <div className="auth-card">
        {/* ---- Header ---- */}
        <div className="auth-header">
          <div className="logo-container">
            <img src="/studysphere.svg" alt="StudySphere Logo" className="logo-icon" />
            <h1>StudySphere</h1>
          </div>
          <h2>Welcome back!</h2>
          <p>Join collaborative study sessions or create your own focused learning environment.</p>
        </div>

        {/* ---- Form ---- */}
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
            {isLoading ? <Loading text="Logging in..." /> : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <strong>Not yet registered?</strong> 
            <Link to="/register"> Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
