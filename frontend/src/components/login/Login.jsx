// frontend/src/components/login/Login.jsx

import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { UserLoginContext } from '../../contexts/UserLoginContext'; // Import the context

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
      const res = await axios.post('http://localhost:5000/api/auth/login', {
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
        <h2>Login</h2>
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
      </form>
    </div>
  );
};

export default Login;


// // frontend/src/components/login/Login.jsx

// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import './Login.css';

// const Login = () => {
//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//   });
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const { email, password } = formData;

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(''); // Clear previous errors

//     try {
//       const res = await axios.post('http://localhost:5000/api/auth/login', {
//         email,
//         password,
//       });

//       // --- Success ---
//       // The backend sends back a token, save it
//       localStorage.setItem('token', res.data.token);
      
//       // Redirect to a protected page, like a dashboard
//       navigate('/dashboard'); 

//     } catch (err) {
//       // --- Error ---
//       // The backend sends specific error messages
//       if (err.response && err.response.data) {
//         // Handle validation errors array or a single message
//         const errorMsg = err.response.data.errors ? err.response.data.errors[0].msg : err.response.data.msg;
//         setError(errorMsg || 'Login failed. Please check your credentials.');
//       } else {
//         setError('An unexpected error occurred. Please try again.');
//       }
//     }
//   };

//   return (
//     <div className="auth-container">
//       <form className="auth-form" onSubmit={handleSubmit}>
//         <h2>Login</h2>
//         {error && <p className="error-message">{error}</p>}
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
//             required
//           />
//         </div>
//         <button type="submit" className="auth-button">Login</button>
//       </form>
//     </div>
//   );
// };

// export default Login;


// frontend/src/components/register/Register.jsx
