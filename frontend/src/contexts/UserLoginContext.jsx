// frontend/src/context/UserLoginContext.js

import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the context
export const UserLoginContext = createContext();

// Create the context provider component
export const UserLoginStore = ({ children }) => {
    // State to hold the authentication token and user data
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Function to load the user and set the state
    const loadUser = async () => {
        if (token) {
            axios.defaults.headers.common['x-auth-token'] = token;
            try {
                // Fetch the user data from the backend
                const res = await axios.get('http://localhost:5000/api/auth');
                setUser(res.data);
                setIsAuthenticated(true);
            } catch (err) {
                // Token is invalid, remove it from localStorage
                console.error("Token is not valid");
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
            }
        }
        setIsLoading(false);
    };

    // Load the user when the component mounts or the token changes
    useEffect(() => {
        loadUser();
    }, [token]);

    // Function to handle login
    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        // The useEffect will trigger and load the user after the token is set
    };

    // Function to handle logout
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    // Provide the state and functions to the children components
    return (
        <UserLoginContext.Provider value={{ token, user, isAuthenticated, isLoading, login, logout, loadUser }}>
            {children}
        </UserLoginContext.Provider>
    );
};