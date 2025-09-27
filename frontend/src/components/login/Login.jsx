// frontend/src/components/login/Login.jsx

import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { UserLoginContext } from '../../contexts/UserLoginContext'; // Import the context
import logo from "/logo.png";
import { Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  // Use the useContext hook to access the context's functions
  const { login } = useContext(UserLoginContext);

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('https://studysphere-n4up.onrender.com/api/auth/login', {
        email,
        password,
      });

      // --- Success ---
      // Call the login function from the context
      login(res.data.token);
      
      // Redirect to a protected page, like a dashboard
      navigate('/dashboard'); 

    } catch (err) {
      // --- Error ---
      if (err.response && err.response.data) {
        const errorMsg = err.response.data.errors ? err.response.data.errors[0].msg : err.response.data.msg;
        setError(errorMsg || 'Login failed. Please check your credentials.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="logo-container"> 
                            <img src={logo} alt="StudySphere Logo" width="50" height="50" />
                        </div>
        <h2>StudySphere</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            required
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
          />
        </div>
        <button type="submit" className="auth-button">Login</button>
        <div className="login-link">Not yet registered? <Link to="/register">Register here</Link></div>
      </form>
    </div>
  );
};

export default Login;
