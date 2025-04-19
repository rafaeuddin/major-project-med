import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AppointmentForm from './pages/AppointmentForm';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import PhoneLogin from './pages/PhoneLogin';
import AddFoodLog from './pages/AddFoodLog';
import NutritionReports from './pages/NutritionReports';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import PatientProfile from './components/PatientProfile';
import DoctorChatbot from './components/DoctorChatbot';

// Styles
import './styles/DoctorDashboard.css';
import './styles/Login.css';
import './styles/Register.css';
import './styles/App.css';

const App = () => {
  const { currentUser } = useAuth();
  
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/phone-login" element={<PhoneLogin />} />
        
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
          path="/doctor-dashboard" 
          element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patient-dashboard" 
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
        <Route 
          path="/add-food-log" 
          element={
            <ProtectedRoute requiredRole="patient">
              <AddFoodLog />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/nutrition-reports" 
          element={
            <ProtectedRoute requiredRole="patient">
              <NutritionReports />
            </ProtectedRoute>
          } 
        />
        <Route path="/patient/profile" element={
          <ProtectedRoute requiredRole="patient">
            <PatientProfile editable={true} />
          </ProtectedRoute>
        } />
        
        {/* Legacy route paths for compatibility */}
        <Route path="/doctor/dashboard" element={<Navigate to="/doctor-dashboard" />} />
        <Route path="/patient/dashboard" element={<Navigate to="/patient-dashboard" />} />
        
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
      
      {/* Show chatbot for authenticated users */}
      {currentUser && <DoctorChatbot />}
    </>
  );
};

// Dynamic dashboard based on user role
const DynamicDashboard = () => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (currentUser.role === 'doctor') {
    return <Navigate to="/doctor-dashboard" />;
  }
  
  if (currentUser.role === 'patient') {
    return <Navigate to="/patient-dashboard" />;
  }
  
  // Default case (admin, etc.)
  return <div>Dashboard for {currentUser.role}</div>;
};

export default App; 