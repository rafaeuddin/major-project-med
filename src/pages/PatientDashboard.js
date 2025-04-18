import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AppointmentsList from '../components/AppointmentsList';
import PatientProfile from '../components/PatientProfile';

const PatientDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');

  // Redirect if user is not logged in or not a patient
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    
    if (currentUser.role !== 'patient') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleGoBack = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (currentUser.role !== 'patient') {
    return <div className="error-message">Only patients can access this dashboard.</div>;
  }

  return (
    <div className="patient-dashboard">
      <div className="back-button-container">
        <button className="back-button" onClick={handleGoBack}>
          ← Back to Login
        </button>
      </div>
      <div className="dashboard-header">
        <h1>Patient Dashboard</h1>
        <div className="patient-info">
          <span className="patient-name">{currentUser.name}</span>
          <button className="logout-button" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'appointments' ? 'active' : ''}`} 
            onClick={() => setActiveTab('appointments')}
          >
            My Appointments
          </button>
          <button 
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`} 
            onClick={() => setActiveTab('profile')}
          >
            My Profile
          </button>
          <button 
            className={`tab-button ${activeTab === 'medical' ? 'active' : ''}`} 
            onClick={() => setActiveTab('medical')}
          >
            Medical Records
          </button>
        </div>
        
        <div className="dashboard-tab-content">
          {activeTab === 'appointments' && (
            <div className="appointments-tab">
              <div className="tab-actions">
                <button 
                  className="book-appointment-button"
                  onClick={() => navigate('/book-appointment')}
                >
                  Book New Appointment
                </button>
              </div>
              <AppointmentsList />
            </div>
          )}
          
          {activeTab === 'profile' && (
            <div className="profile-tab">
              <PatientProfile editable={true} />
            </div>
          )}
          
          {activeTab === 'medical' && (
            <div className="medical-tab">
              <h2>Medical Records</h2>
              {currentUser.medicalHistory && currentUser.medicalHistory.length > 0 ? (
                <div className="medical-history-list">
                  {currentUser.medicalHistory.map((record, index) => (
                    <div key={index} className="medical-record-card">
                      <h3>{record.title}</h3>
                      <p>{record.description}</p>
                      <div className="record-meta">
                        <span className="record-date">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                        {record.doctorName && (
                          <span className="record-doctor">
                            Dr. {record.doctorName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-records">
                  <div className="no-data-message">
                    <i className="fas fa-file-medical"></i>
                    <p>No medical records available.</p>
                    <p>Your doctor will add medical records after your appointments.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard; 