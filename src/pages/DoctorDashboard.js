import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PrescriptionTemplate from '../components/PrescriptionTemplate';

const DoctorDashboard = () => {
  const { currentUser, authFetch, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notes, setNotes] = useState('');
  const [saveNoteStatus, setSaveNoteStatus] = useState({ loading: false, message: '', type: '' });
  const [showPrescription, setShowPrescription] = useState(false);

  // Redirect if user is not logged in or not a doctor
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    
    if (currentUser.role !== 'doctor') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Fetch doctor's appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!currentUser) return;
      
      try {
        const response = await authFetch('/api/appointments');
        
        if (response.ok) {
          const data = await response.json();
          setAppointments(data.appointments || []);
          
          // Extract unique patients
          const uniquePatients = [];
          const patientIds = new Set();
          
          data.appointments.forEach(appointment => {
            if (appointment.patientId && !patientIds.has(appointment.patientId._id)) {
              patientIds.add(appointment.patientId._id);
              uniquePatients.push(appointment.patientId);
            }
          });
          
          setPatients(uniquePatients);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [currentUser, authFetch]);

  // Group appointments by status
  const groupedAppointments = {
    upcoming: appointments.filter(app => 
      ['scheduled', 'rescheduled'].includes(app.status) && 
      new Date(app.date) >= new Date()
    ),
    past: appointments.filter(app => 
      ['completed', 'cancelled'].includes(app.status) || 
      new Date(app.date) < new Date()
    ),
    all: [...appointments].sort((a, b) => new Date(b.date) - new Date(a.date))
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Complete appointment
  const completeAppointment = async (appointmentId) => {
    try {
      const response = await authFetch(`/api/appointments/complete/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });
      
      if (response.ok) {
        // Update appointment in the state
        setAppointments(prevAppointments => 
          prevAppointments.map(appointment => 
            appointment._id === appointmentId 
              ? { ...appointment, status: 'completed', notes } 
              : appointment
          )
        );
        
        setSaveNoteStatus({
          loading: false,
          message: 'Appointment completed successfully',
          type: 'success'
        });
        
        // Clear selection
        setTimeout(() => {
          setSelectedAppointment(null);
          setNotes('');
          setSaveNoteStatus({ loading: false, message: '', type: '' });
        }, 2000);
      } else {
        setSaveNoteStatus({
          loading: false,
          message: 'Failed to complete appointment',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
      setSaveNoteStatus({
        loading: false,
        message: 'Error completing appointment',
        type: 'error'
      });
    }
  };

  // Save appointment notes
  const saveNotes = async (appointmentId) => {
    setSaveNoteStatus({ loading: true, message: '', type: '' });
    
    try {
      const response = await authFetch(`/api/appointments/${appointmentId}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });
      
      if (response.ok) {
        // Update appointment in the state
        setAppointments(prevAppointments => 
          prevAppointments.map(appointment => 
            appointment._id === appointmentId 
              ? { ...appointment, notes } 
              : appointment
          )
        );
        
        setSaveNoteStatus({
          loading: false,
          message: 'Notes saved successfully',
          type: 'success'
        });
      } else {
        setSaveNoteStatus({
          loading: false,
          message: 'Failed to save notes',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      setSaveNoteStatus({
        loading: false,
        message: 'Error saving notes',
        type: 'error'
      });
    }
  };

  const handleGoBack = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!currentUser || currentUser.role !== 'doctor') {
    return <div className="error-message">Only doctors can access this dashboard.</div>;
  }

  return (
    <div className="doctor-dashboard">
      <div className="back-button-container">
        <button className="back-button" onClick={handleGoBack}>
          ← Back to Login
        </button>
      </div>
      <div className="dashboard-header">
        <h1>Doctor Dashboard</h1>
        <div className="doctor-info">
          <span className="doctor-name">Dr. {currentUser.name}</span>
          <span className="doctor-specialization">{currentUser.specialization}</span>
          <button className="logout-button" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{groupedAppointments.upcoming.length}</div>
          <div className="stat-label">Upcoming Appointments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{patients.length}</div>
          <div className="stat-label">Total Patients</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {appointments.filter(app => app.status === 'completed').length}
          </div>
          <div className="stat-label">Completed Appointments</div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-section">
          <div className="section-tabs">
            <button 
              className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming Appointments
            </button>
            <button 
              className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              Past Appointments
            </button>
            <button 
              className={`tab-button ${activeTab === 'patients' ? 'active' : ''}`}
              onClick={() => setActiveTab('patients')}
            >
              Patients
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'upcoming' && (
              <div className="appointments-section">
                <h3>Upcoming Appointments</h3>
                {groupedAppointments.upcoming.length === 0 ? (
                  <p>No upcoming appointments</p>
                ) : (
                  <div className="appointments-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Patient</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedAppointments.upcoming.map(appointment => (
                          <tr key={appointment._id} className={selectedAppointment?._id === appointment._id ? 'selected' : ''}>
                            <td>{formatDate(appointment.date)}</td>
                            <td>{appointment.timeSlot}</td>
                            <td>{appointment.patientId.name}</td>
                            <td>{appointment.reason}</td>
                            <td>
                              <span className={`status status-${appointment.status}`}>
                                {appointment.status}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="action-button view-button"
                                onClick={() => setSelectedAppointment(appointment)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'past' && (
              <div className="appointments-section">
                <h3>Past Appointments</h3>
                {groupedAppointments.past.length === 0 ? (
                  <p>No past appointments</p>
                ) : (
                  <div className="appointments-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Patient</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedAppointments.past.map(appointment => (
                          <tr key={appointment._id} className={selectedAppointment?._id === appointment._id ? 'selected' : ''}>
                            <td>{formatDate(appointment.date)}</td>
                            <td>{appointment.timeSlot}</td>
                            <td>{appointment.patientId.name}</td>
                            <td>{appointment.reason}</td>
                            <td>
                              <span className={`status status-${appointment.status}`}>
                                {appointment.status}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="action-button view-button"
                                onClick={() => setSelectedAppointment(appointment)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'patients' && (
              <div className="patients-section">
                <h3>Your Patients</h3>
                {patients.length === 0 ? (
                  <p>No patients found</p>
                ) : (
                  <div className="patients-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Appointments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.map(patient => (
                          <tr key={patient._id}>
                            <td>{patient.name}</td>
                            <td>{patient.email}</td>
                            <td>{patient.phone}</td>
                            <td>
                              {appointments.filter(app => 
                                app.patientId._id === patient._id
                              ).length}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {selectedAppointment && (
          <div className="appointment-details">
            <div className="details-header">
              <h3>Appointment Details</h3>
              <button 
                className="close-button"
                onClick={() => setSelectedAppointment(null)}
              >
                ×
              </button>
            </div>
            
            <div className="details-content">
              <div className="details-row">
                <span className="label">Date:</span>
                <span className="value">{formatDate(selectedAppointment.date)}</span>
              </div>
              <div className="details-row">
                <span className="label">Time:</span>
                <span className="value">{selectedAppointment.timeSlot}</span>
              </div>
              <div className="details-row">
                <span className="label">Patient:</span>
                <span className="value">{selectedAppointment.patientId.name}</span>
              </div>
              <div className="details-row">
                <span className="label">Email:</span>
                <span className="value">{selectedAppointment.patientId.email}</span>
              </div>
              <div className="details-row">
                <span className="label">Phone:</span>
                <span className="value">{selectedAppointment.patientId.phone}</span>
              </div>
              <div className="details-row">
                <span className="label">Reason:</span>
                <span className="value">{selectedAppointment.reason}</span>
              </div>
              <div className="details-row">
                <span className="label">Status:</span>
                <span className={`value status status-${selectedAppointment.status}`}>
                  {selectedAppointment.status}
                </span>
              </div>
              
              <div className="doctor-notes">
                <label htmlFor="notes">Medical Notes:</label>
                <textarea 
                  id="notes"
                  value={notes || selectedAppointment.notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add medical notes for this appointment..."
                  disabled={selectedAppointment.status === 'completed'}
                />
                
                {saveNoteStatus.message && (
                  <div className={`message ${saveNoteStatus.type}`}>
                    {saveNoteStatus.message}
                  </div>
                )}
                
                <div className="details-actions">
                  {selectedAppointment.status !== 'completed' && (
                    <>
                      <button 
                        className="action-button save-button"
                        onClick={() => saveNotes(selectedAppointment._id)}
                        disabled={saveNoteStatus.loading}
                      >
                        {saveNoteStatus.loading ? 'Saving...' : 'Save Notes'}
                      </button>
                      
                      <button 
                        className="action-button prescription-button"
                        onClick={() => setShowPrescription(true)}
                      >
                        Write Prescription
                      </button>
                      
                      <button 
                        className="action-button complete-button"
                        onClick={() => completeAppointment(selectedAppointment._id)}
                        disabled={saveNoteStatus.loading}
                      >
                        Mark as Completed
                      </button>
                    </>
                  )}
                  {selectedAppointment.status === 'completed' && (
                    <button 
                      className="action-button prescription-button"
                      onClick={() => setShowPrescription(true)}
                    >
                      Write Prescription
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {showPrescription && selectedAppointment && (
        <PrescriptionTemplate 
          patient={selectedAppointment.patientId} 
          onClose={() => setShowPrescription(false)}
          appointmentDetails={selectedAppointment}
        />
      )}
    </div>
  );
};

export default DoctorDashboard; 