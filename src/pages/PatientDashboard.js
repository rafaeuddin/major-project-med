import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AppointmentsList from '../components/AppointmentsList';
import PatientProfile from '../components/PatientProfile';
import DoctorChatbot from '../components/DoctorChatbot';
import MedicalDocumentUploader from '../components/MedicalDocumentUploader';
import MedicalDocumentsViewer from '../components/MedicalDocumentsViewer';
import '../styles/PatientDashboard.css';

const PatientDashboard = () => {
  const { currentUser, logout, authFetch } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');
  const [nutritionData, setNutritionData] = useState(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionError, setNutritionError] = useState('');
<<<<<<< HEAD
=======
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4

  // Redirect if user is not logged in or not a patient
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    
    if (currentUser.role !== 'patient') {
      navigate('/');
<<<<<<< HEAD
=======
    } else {
      setIsLoading(false);
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
    }
  }, [currentUser, navigate]);

  // Fetch nutrition data when nutrition tab is active
  useEffect(() => {
    if (activeTab === 'nutrition') {
      fetchNutritionData();
    }
  }, [activeTab]);

  const fetchNutritionData = async () => {
    setNutritionLoading(true);
    setNutritionError('');
    
    try {
<<<<<<< HEAD
      // Get current date and date 30 days ago for summary
=======
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const response = await authFetch(`/api/food/nutrition/summary?startDate=${startDateStr}&endDate=${endDate}`);
      
      if (response.ok) {
        const data = await response.json();
        setNutritionData(data.data);
      } else {
        setNutritionError('Failed to load nutrition data');
      }
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      setNutritionError('Error loading nutrition data. Please try again.');
    } finally {
      setNutritionLoading(false);
    }
  };

<<<<<<< HEAD
  const handleGoBack = () => {
=======
  const handleLogout = () => {
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
    logout();
    navigate('/login');
  };

<<<<<<< HEAD
  if (!currentUser) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (currentUser.role !== 'patient') {
    return <div className="error-message">Only patients can access this dashboard.</div>;
=======
  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'patient') {
    return (
      <div className="dashboard-error">
        <i className="fas fa-exclamation-circle"></i>
        <p>Access Denied</p>
        <p>Only patients can access this dashboard.</p>
        <button className="back-to-login" onClick={handleLogout}>
          Back to Login
        </button>
      </div>
    );
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
  }

  return (
    <div className="patient-dashboard">
<<<<<<< HEAD
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
=======
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Welcome back, {currentUser.name}</h1>
          <p className="header-subtitle">Manage your health and appointments</p>
        </div>
        <div className="header-actions">
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
            Logout
          </button>
        </div>
      </div>
<<<<<<< HEAD
      
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
          <button 
            className={`tab-button ${activeTab === 'nutrition' ? 'active' : ''}`} 
            onClick={() => setActiveTab('nutrition')}
          >
            Nutrition & Diet
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
=======

      <div className="dashboard-section-outerbox">
        {selectedCard ? (
          <div className="dashboard-section-innerbox">
            <button className="back-button" onClick={() => setSelectedCard(null)}>
              <i className="fas fa-arrow-left"></i> Back
          </button>
            <div className="dashboard-card-content">
              {selectedCard === 'appointments' && (
            <div className="appointments-tab">
              <div className="tab-actions">
                <button 
                  className="primary-button"
                  onClick={() => navigate('/book-appointment')}
                >
                  <i className="fas fa-plus"></i>
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
                  Book New Appointment
                </button>
              </div>
              <AppointmentsList />
            </div>
          )}
<<<<<<< HEAD
          
          {activeTab === 'profile' && (
=======
              {selectedCard === 'profile' && (
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
            <div className="profile-tab">
              <PatientProfile editable={true} />
            </div>
          )}
<<<<<<< HEAD
          
          {activeTab === 'medical' && (
            <div className="medical-tab">
              <h2>Medical Records</h2>
              
              <div className="medical-documents-section">
                <div className="documents-uploader">
                  <MedicalDocumentUploader 
                    onUploadComplete={(newDoc) => {
                      // In a real app, you would update the documents list
                      console.log('Document uploaded:', newDoc);
                      // You could fetch updated documents here
                    }} 
                  />
                </div>
                
                <div className="documents-viewer">
                  <MedicalDocumentsViewer 
                    documents={currentUser.documents || []}
                    onDocumentDelete={(docId) => {
                      // In a real app, you would handle document deletion
                      console.log('Delete document:', docId);
                      // You could implement deletion functionality here
=======
              {selectedCard === 'medical' && (
            <div className="medical-tab">
              <div className="medical-documents-section">
                <div className="documents-uploader">
                  <h3>Upload Medical Documents</h3>
                  <MedicalDocumentUploader 
                    onUploadComplete={(newDoc) => {
                      console.log('Document uploaded:', newDoc);
                    }} 
                  />
                </div>
                <div className="documents-viewer">
                  <h3>Your Medical Documents</h3>
                  <MedicalDocumentsViewer 
                    documents={currentUser.documents || []}
                    onDocumentDelete={(docId) => {
                      console.log('Delete document:', docId);
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
                    }} 
                  />
                </div>
              </div>
<<<<<<< HEAD
              
              <h3>Medical History</h3>
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
=======
              <div className="medical-history-section">
                <h3>Medical History</h3>
                {currentUser.medicalHistory && currentUser.medicalHistory.length > 0 ? (
                  <div className="medical-history-list">
                    {currentUser.medicalHistory.map((record, index) => (
                      <div key={index} className="medical-record-card">
                        <div className="record-header">
                          <h4>{record.title}</h4>
                          <span className="record-date">
                            {new Date(record.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="record-description">{record.description}</p>
                        {record.doctorName && (
                          <div className="record-doctor">
                            <i className="fas fa-user-md"></i>
                            Dr. {record.doctorName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-records">
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
                    <i className="fas fa-file-medical"></i>
                    <p>No medical records available.</p>
                    <p>Your doctor will add medical records after your appointments.</p>
                  </div>
<<<<<<< HEAD
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'nutrition' && (
            <div className="nutrition-tab">
              <h2>Nutrition & Diet Tracking</h2>
              <div className="nutrition-actions">
                <button 
                  className="add-food-log-button"
                  onClick={() => navigate('/add-food-log')}
                >
                  Add Food Log
                </button>
                <button 
                  className="view-reports-button"
                  onClick={() => navigate('/nutrition-reports')}
                >
                  View Detailed Reports
                </button>
              </div>
              
=======
                )}
              </div>
            </div>
          )}
              {selectedCard === 'nutrition' && (
            <div className="nutrition-tab">
              <div className="nutrition-actions">
                <button 
                  className="primary-button"
                  onClick={() => navigate('/add-food-log')}
                >
                  <i className="fas fa-plus"></i>
                  Add Food Log
                </button>
                <button 
                  className="secondary-button"
                  onClick={() => navigate('/nutrition-reports')}
                >
                  <i className="fas fa-chart-bar"></i>
                  View Reports
                </button>
              </div>
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
              {nutritionLoading ? (
                <div className="loading-nutrition">
                  <div className="loading-spinner"></div>
                  <p>Loading your nutrition data...</p>
                </div>
              ) : nutritionError ? (
                <div className="nutrition-error">
<<<<<<< HEAD
                  <p>{nutritionError}</p>
                  <button onClick={fetchNutritionData}>Try Again</button>
=======
                  <i className="fas fa-exclamation-circle"></i>
                  <p>{nutritionError}</p>
                  <button className="retry-button" onClick={fetchNutritionData}>
                    Try Again
                  </button>
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
                </div>
              ) : nutritionData ? (
                <div className="nutrition-summary">
                  <div className="nutrition-overview">
                    <h3>30-Day Overview</h3>
<<<<<<< HEAD
                    {nutritionData.overallSummary && (
                      <div className="nutrition-stats">
                        <div className="stat-card">
                          <span className="stat-label">Avg. Calories</span>
                          <span className="stat-value">{Math.round(nutritionData.overallSummary.avgCalories || 0)} kcal</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-label">Avg. Protein</span>
                          <span className="stat-value">{Math.round(nutritionData.overallSummary.avgProteins || 0)}g</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-label">Avg. Carbs</span>
                          <span className="stat-value">{Math.round(nutritionData.overallSummary.avgCarbs || 0)}g</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-label">Avg. Fats</span>
                          <span className="stat-value">{Math.round(nutritionData.overallSummary.avgFats || 0)}g</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-label">Avg. Water</span>
                          <span className="stat-value">{Math.round(nutritionData.overallSummary.avgWaterIntake || 0)} ml</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
=======
                    <div className="nutrition-stats">
                      <div className="stat-card">
                        <i className="fas fa-fire"></i>
                        <span className="stat-label">Avg. Calories</span>
                        <span className="stat-value">{Math.round(nutritionData.overallSummary?.avgCalories || 0)} kcal</span>
                      </div>
                      <div className="stat-card">
                        <i className="fas fa-drumstick-bite"></i>
                        <span className="stat-label">Avg. Protein</span>
                        <span className="stat-value">{Math.round(nutritionData.overallSummary?.avgProteins || 0)}g</span>
                      </div>
                      <div className="stat-card">
                        <i className="fas fa-bread-slice"></i>
                        <span className="stat-label">Avg. Carbs</span>
                        <span className="stat-value">{Math.round(nutritionData.overallSummary?.avgCarbs || 0)}g</span>
                      </div>
                      <div className="stat-card">
                        <i className="fas fa-cheese"></i>
                        <span className="stat-label">Avg. Fats</span>
                        <span className="stat-value">{Math.round(nutritionData.overallSummary?.avgFats || 0)}g</span>
                      </div>
                      <div className="stat-card">
                        <i className="fas fa-tint"></i>
                        <span className="stat-label">Avg. Water</span>
                        <span className="stat-value">{Math.round(nutritionData.overallSummary?.avgWaterIntake || 0)} ml</span>
                      </div>
                    </div>
                  </div>
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
                  <div className="recent-logs">
                    <h3>Recent Nutrition Logs</h3>
                    {nutritionData.dailySummaries && nutritionData.dailySummaries.length > 0 ? (
                      <div className="daily-summaries">
                        {nutritionData.dailySummaries.slice(0, 7).map((day, index) => (
                          <div key={index} className="day-summary">
                            <div className="day-header">
                              <h4>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h4>
                              <span className="total-calories">{Math.round(day.totalCalories || 0)} kcal</span>
                            </div>
                            <div className="macros-breakdown">
                              <div className="macro">
<<<<<<< HEAD
=======
                                <i className="fas fa-drumstick-bite"></i>
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
                                <span className="macro-label">Protein</span>
                                <span className="macro-value">{Math.round(day.totalProteins || 0)}g</span>
                              </div>
                              <div className="macro">
<<<<<<< HEAD
=======
                                <i className="fas fa-bread-slice"></i>
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
                                <span className="macro-label">Carbs</span>
                                <span className="macro-value">{Math.round(day.totalCarbs || 0)}g</span>
                              </div>
                              <div className="macro">
<<<<<<< HEAD
=======
                                <i className="fas fa-cheese"></i>
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
                                <span className="macro-label">Fats</span>
                                <span className="macro-value">{Math.round(day.totalFats || 0)}g</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-nutrition-data">
<<<<<<< HEAD
=======
                        <i className="fas fa-utensils"></i>
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
                        <p>No nutrition logs found for the last 30 days.</p>
                        <p>Start tracking your diet by adding food logs.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="no-nutrition-data">
<<<<<<< HEAD
=======
                  <i className="fas fa-utensils"></i>
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
                  <p>No nutrition data available.</p>
                  <p>Start tracking your diet by adding food logs.</p>
                </div>
              )}
            </div>
          )}
        </div>
<<<<<<< HEAD
=======
          </div>
        ) : (
          <div className="dashboard-section-innerbox dashboard-cards-grid">
            <div className="dashboard-card" onClick={() => setSelectedCard('appointments')}>
              <i className="fas fa-calendar-alt"></i>
              <span>Appointments</span>
            </div>
            <div className="dashboard-card" onClick={() => setSelectedCard('profile')}>
              <i className="fas fa-user"></i>
              <span>Profile</span>
            </div>
            <div className="dashboard-card" onClick={() => setSelectedCard('medical')}>
              <i className="fas fa-file-medical"></i>
              <span>Medical Records</span>
            </div>
            <div className="dashboard-card" onClick={() => setSelectedCard('nutrition')}>
              <i className="fas fa-utensils"></i>
              <span>Nutrition Log</span>
            </div>
          </div>
        )}
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
      </div>

      <DoctorChatbot />
    </div>
  );
};

export default PatientDashboard; 