import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import '../room/AuthScreen.css'
import { UserLoginContext } from "../../contexts/UserLoginContext"; // Import context
import Loading from "../loading/Loading";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useContext(UserLoginContext);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { username, email, password } = formData;

  // --- Handle input change ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Handle form submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        "https://studysphere-n4up.onrender.com/api/auth/register",
        { username, email, password }
      );

      // Save token via context
      login(data.token);

      // Redirect to login (or dashboard if auto-login is preferred)
      navigate("/dashboard");
    } catch (err) {
      const errorMsg =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.msg ||
        "Registration failed. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen-container">
      <div className="auth-card"> 
        <div className="auth-header">
          <div className="logo-container">
            <img
              src="/studysphere.svg"
              alt="StudySphere Logo"
              className="logo-icon"
            />
            <h1>StudySphere</h1>
          </div>
          <h2>Welcome!</h2>
          <p>
            Join collaborative study sessions or create your own focused
            learning environment.
          </p>
        </div>
         <form className="auth-form" onSubmit={handleSubmit}>
        {/* Header */}
       

        {/* Error Message */}
        {error && <p className="error-message">{error}</p>}

        {/* Username */}
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={handleChange}
            required
          />
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handleChange}
            minLength="6"
            required
          />
        </div>

        {/* Submit */}
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? <Loading text="Registering..." /> : "Register"}
        </button>

        
        <div className="auth-footer">
          <p>
           <strong>Already have an account?</strong>
            <Link to="/login">Login here</Link>
          </p>
        </div>
      </form>
        </div>
     
    </div>
  );
};

export default Register;
