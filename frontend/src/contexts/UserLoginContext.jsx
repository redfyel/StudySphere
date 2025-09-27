import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// 1. Create the context
export const UserLoginContext = createContext();

// Local storage keys for consistency
const TOKEN_KEY = 'studyRoomSessionToken';
const USER_ID_KEY = 'studyRoomUserId';
const USER_NAME_KEY = 'studyRoomUsername';
const USER_EMAIL_KEY = 'studyRoomUserEmail';

/**
 * Custom hook to access the authentication context easily.
 * This hook retains the name 'useAuth' for simplicity across the application.
 * @returns {object} The authentication context value.
 */
export const useAuth = () => {
  const context = useContext(UserLoginContext);
  if (!context) {
    throw new Error('useAuth must be used within a UserLoginStore');
  }
  return context;
};

/**
 * Provider component to manage global authentication state.
 */
export const UserLoginStore = ({ children }) => {
  const [sessionToken, setSessionToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Initialized to true, as we always verify on mount

  /**
   * Clears all session data from state and localStorage.
   * Wrapped in useCallback for memoization, though not strictly necessary here.
   */
  const clearUserData = useCallback(() => {
    setUser(null);
    setSessionToken(null); // This will trigger the useEffect, leading to loadSession with no token

    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token'); // Cleanup old keys

    // Remove default auth header for axios
    delete axios.defaults.headers.common['x-auth-token'];
    console.log('User data cleared.');
  }, []);

  /**
   * Attempts to load and validate user data using the stored saession token.
   * Wrapped in useCallback to prevent unnecessary re-creation and potential re-renders.
   */
  const loadSession = useCallback(async (tokenOverride = sessionToken) => {
    setIsLoading(true); // Always set loading to true at the start of any validation attempt

    if (!tokenOverride) {
      // If no token, clear any existing user data and stop loading
      clearUserData();
      setIsLoading(false);
      return;
    }

    // Set the token for axios headers for subsequent requests
    axios.defaults.headers.common['x-auth-token'] = tokenOverride;

    try {
      // Use your backend's endpoint to fetch user details (validating the token)
      const res = await axios.get('http://localhost:5000/api/auth');

      const { userId, username, email } = res.data;

      // Update state if validation is successful
      setUser({ userId, username, email });
      setSessionToken(tokenOverride); // Ensure the state reflects the current valid token

      console.log('Session validated for user:', username);
    } catch (err) {
      console.error("Session validation failed or token is invalid:", err.response ? err.response.data : err.message);
      clearUserData(); // Clear data if validation fails
    } finally {
      setIsLoading(false); // Always set loading to false when the session check is complete
    }
  }, [sessionToken, clearUserData]); // Dependencies: sessionToken, clearUserData (because it's useCallback)

  // Effect to load the session on initial mount or when the `sessionToken` state changes
  // This is the single source of truth for loading the session.
  useEffect(() => {
    loadSession();
  }, [loadSession]); // Dependency on loadSession (which is now memoized by useCallback)

  /**
   * Unified login handler.
   * @param {string} token - The JWT or session token received from the backend.
   * @param {string} userId - The user's ID.
   * @param {string} username - The user's name.
   * @param {string} email - The user's email.
   */
  const login = useCallback((token, userId, username, email) => {
    const userData = { userId, username, email };

    // 1. Store data in localStorage for persistence
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_ID_KEY, userId);
    localStorage.setItem(USER_NAME_KEY, username);
    localStorage.setItem(USER_EMAIL_KEY, email);

    // 2. Update state. This will automatically trigger the `useEffect` and `loadSession`
    // to set axios header and validate the token against the backend.
    setSessionToken(token);
    setUser(userData); // Update user immediately for faster UI feedback
    console.log('User authenticated and data stored locally:', username);
  }, []);

  /**
   * Unified logout handler.
   */
  const logout = useCallback(() => {
    clearUserData();
    console.log('User logged out successfully.');
  }, [clearUserData]);

  // Computed property for easy access to authentication status
  const isAuthenticated = !!user && !!sessionToken;

  return (
    <UserLoginContext.Provider
      value={{
        user,
        sessionToken,
        isLoading, // Provide isLoading for consumers
        isAuthenticated,
        login,
        logout,
        loadSession, // Still expose if needed for manual re-validation, though useEffect handles most
      }}
    >
      {children}
    </UserLoginContext.Provider>
  );
};