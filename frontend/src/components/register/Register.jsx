// frontend/src/components/register/Register.jsx

// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import './Register.css'; // We'll create this file next
// import { Link } from 'react-router-dom';
// const Register = () => {
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     password: '',
//   });
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const { username, email, password } = formData;

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');

//     try {
//       const res = await axios.post('http://localhost:5000/api/auth/register', {
//         username,
//         email,
//         password,
//       });

//       // --- Success ---
//       localStorage.setItem('token', res.data.token);
//       navigate('/login'); // Redirect after successful registration

//     } catch (err) {
//       // --- Error ---
//       if (err.response && err.response.data) {
//         const errorMsg = err.response.data.errors ? err.response.data.errors[0].msg : err.response.data.msg;
//         setError(errorMsg || 'Registration failed. Please try again.');
//       } else {
//         setError('An unexpected error occurred. Please try again.');
//       }
//     }
//   };

//   return (
//     <div className="auth-container">
//       <form className="auth-form" onSubmit={handleSubmit}>
//         <h2>Create Account</h2>
//         {error && <p className="error-message">{error}</p>}
//         <div className="form-group">
//           <label htmlFor="username">Username</label>
//           <input
//             type="text"
//             id="username"
//             name="username"
//             value={username}
//             onChange={handleChange}
//             required
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="email">Email</label>
//           <input
//             type="email"
//             id="email"
//             name="email"
//             value={email}
//             onChange={handleChange}
//             required
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="password">Password</label>
//           <input
//             type="password"
//             id="password"
//             name="password"
//             value={password}
//             onChange={handleChange}
//             minLength="6"
//             required
//           />
//         </div>
        
//         <button type="submit" className="auth-button">Register</button>
//         <div className="login-link">Already registered? <Link to="/login">Login here</Link></div>
//       </form>
      
//     </div>
//   );
// };

// export default Register;




import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import { Link } from 'react-router-dom';
import { UserLoginContext } from '../../contexts/UserLoginContext'; // Import the context

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  // Use the useContext hook to access the context's functions
  const { login } = useContext(UserLoginContext); 

  const { username, email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        username,
        email,
        password,
      });

      // --- Success ---
      // Call the login function from the context
      login(res.data.token); 
      navigate('/dashboard'); // Redirect to a protected route after successful registration

    } catch (err) {
      // --- Error ---
      if (err.response && err.response.data) {
        const errorMsg = err.response.data.errors ? err.response.data.errors[0].msg : err.response.data.msg;
        setError(errorMsg || 'Registration failed. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        {error && <p className="error-message">{error}</p>}
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
            minLength="6"
            required
          />
        </div>
        
        <button type="submit" className="auth-button">Register</button>
        <div className="login-link">Already registered? <Link to="/login">Login here</Link></div>
      </form>
      
    </div>
  );
};

export default Register;