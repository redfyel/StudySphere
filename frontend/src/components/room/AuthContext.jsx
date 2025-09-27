import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app start
    const checkExistingSession = async () => {
      const storedToken = localStorage.getItem('studyRoomSessionToken');
      const storedUserId = localStorage.getItem('studyRoomUserId');
      const storedUsername = localStorage.getItem('studyRoomUsername');
      const storedUserEmail = localStorage.getItem('studyRoomUserEmail');

      if (storedToken && storedUserId && storedUsername && storedUserEmail) {
        try {
          // Validate session with backend
          const response = await fetch('https://studysphere-n4up.onrender.com//api/users/validate-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionToken: storedToken }),
          });

          if (response.ok) {
            const userData = await response.json();
            setUser({
              userId: userData.userId,
              username: userData.username,
              email: userData.email,
            });
            setSessionToken(userData.sessionToken);
            console.log('Session validated for user:', userData.username);
          } else {
            // Invalid session, clear storage
            clearUserData();
          }
        } catch (error) {
          console.error('Session validation error:', error);
          clearUserData();
        }
      }
      setIsLoading(false);
    };

    checkExistingSession();
  }, []);

  const handleAuthSuccess = (userId, username, email, token) => {
    const userData = { userId, username, email };
    setUser(userData);
    setSessionToken(token);
    
    // Store in localStorage for persistence
    localStorage.setItem('studyRoomUserId', userId);
    localStorage.setItem('studyRoomUsername', username);
    localStorage.setItem('studyRoomUserEmail', email);
    localStorage.setItem('studyRoomSessionToken', token);
    
    console.log('User authenticated:', username);
  };

  const clearUserData = () => {
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem('studyRoomUserId');
    localStorage.removeItem('studyRoomUsername');
    localStorage.removeItem('studyRoomUserEmail');
    localStorage.removeItem('studyRoomSessionToken');
  };

  const logout = () => {
    clearUserData();
    console.log('User logged out');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        sessionToken, 
        isLoading, 
        handleAuthSuccess, 
        logout,
        isAuthenticated: !!user && !!sessionToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
