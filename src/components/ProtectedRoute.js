import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, loading } = useAuth();
  
  // Show loading indicator while checking authentication
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  // Redirect to login if user is not authenticated
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // Check for role access if required
  if (requiredRole && currentUser.role !== requiredRole) {
    // Redirect based on actual role
    if (currentUser.role === 'doctor') {
      return <Navigate to="/doctor/dashboard" />;
    } else if (currentUser.role === 'patient') {
      return <Navigate to="/patient/dashboard" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }
  
  // User is authenticated and has the required role (if any)
  return children;
};

export default ProtectedRoute; 