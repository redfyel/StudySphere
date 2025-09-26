import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, sessionToken, handleLogout } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      if (!sessionToken) {
        setIsValidSession(false);
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/users/validate-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionToken }),
        });

        if (response.ok) {
          // Session is valid, no need to update AuthContext as it's already populated
          setIsValidSession(true);
        } else {
          // Session invalid or expired
          console.warn('Session validation failed:', response.status);
          handleLogout(); // Clear local storage and context
          setIsValidSession(false);
        }
      } catch (error) {
        console.error('Error validating session:', error);
        handleLogout(); // Clear local storage and context on network error
        setIsValidSession(false);
      } finally {
        setIsVerifying(false);
      }
    };

    validateSession();
  }, [sessionToken, handleLogout]);

  if (isVerifying) {
    // Optionally render a loading spinner or message while verifying session
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1a1a2e', color: '#e0e0e0' }}>
        <h2>Verifying session...</h2>
      </div>
    );
  }

  // If not authenticated or session is invalid, redirect to auth page
  if (!isAuthenticated || !isValidSession) {
    return <Navigate to="/auth" replace />;
  }

  // If authenticated and session is valid, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
