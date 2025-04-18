import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AppointmentForm from './pages/AppointmentForm';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import PatientProfile from './components/PatientProfile';

// Styles
import './styles/DoctorDashboard.css';
import './styles/Login.css';
import './styles/Register.css';
import './styles/App.css';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DynamicDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doctor/dashboard" 
            element={
              <ProtectedRoute requiredRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/dashboard" 
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/book-appointment" 
            element={
              <ProtectedRoute requiredRole="patient">
                <AppointmentForm />
              </ProtectedRoute>
            } 
          />
          <Route path="/patient/profile" element={
            <ProtectedRoute requiredRole="patient">
              <PatientProfile editable={true} />
            </ProtectedRoute>
          } />
          
          {/* Default route */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

// Dynamic dashboard based on user role
const DynamicDashboard = () => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (currentUser.role === 'doctor') {
    return <Navigate to="/doctor/dashboard" />;
  }
  
  if (currentUser.role === 'patient') {
    return <Navigate to="/patient/dashboard" />;
  }
  
  // Default case (admin, etc.)
  return <div>Dashboard for {currentUser.role}</div>;
};

export default App; 