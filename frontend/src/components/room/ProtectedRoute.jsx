// ProtectedRoute.jsx (Revised)
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/UserLoginContext';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // If the authentication context is still loading the user session, show a loading message
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1a1a2e', color: '#e0e0e0' }}>
        <h2>Loading session...</h2> {/* More accurate message */}
      </div>
    );
  }

  // If context has finished loading AND the user is not authenticated, redirect
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If context has finished loading AND the user IS authenticated, render children
  return <Outlet />;
};

export default ProtectedRoute;