import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AppointmentsList = () => {
  const { currentUser, authFetch } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Function to retry fetching with exponential backoff
  const fetchWithRetry = async (url, options = {}, attempt = 0) => {
    try {
      const response = await authFetch(url, options);
      return response;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        // Exponential backoff: wait longer between each retry
        const delay = Math.pow(2, attempt) * 500;
        console.log(`Retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms for ${url}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  };

  // Fetch user appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        if (!currentUser) return;
        
        // Clear previous error if any
        setError('');
        
        const response = await fetchWithRetry('/api/appointments/user');
        
        if (response.ok) {
          try {
            const data = await response.json();
            console.log('Appointments loaded:', data.appointments?.length || 0);
            setAppointments(data.appointments || []);
            setRetryCount(0); // Reset retry count on success
          } catch (parseError) {
            console.error('Error parsing appointments JSON:', parseError);
            setError('Could not process the appointment data. Please try again later.');
          }
        } else {
          try {
            const errorData = await response.json();
            setError(errorData.message || 'Failed to fetch appointments');
          } catch (parseError) {
            setError('Failed to fetch appointments. Server returned an invalid response.');
          }
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Error fetching appointments. Please try again later.');
        
        // If we haven't exceeded retries and this is a network error, try again
        if (retryCount < MAX_RETRIES && (error.name === 'TypeError' || error.message.includes('network'))) {
          setRetryCount(prevCount => prevCount + 1);
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Will retry in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          setTimeout(() => {
            if (currentUser) fetchAppointments();
          }, delay);
        }
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchAppointments();
    } else {
      setLoading(false);
    }
  }, [currentUser, authFetch, retryCount]);

  // Format date
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Cancel appointment
  const cancelAppointment = async (appointmentId) => {
    setActionInProgress(appointmentId);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await fetchWithRetry(`/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        try {
          const data = await response.json();
          
          // Update the appointment in the state
          setAppointments(prevAppointments => 
            prevAppointments.map(appointment => 
              appointment._id === appointmentId 
                ? { ...appointment, status: 'cancelled' } 
                : appointment
            )
          );
          
          setMessage({
            text: data.message || 'Appointment cancelled successfully',
            type: 'success'
          });
        } catch (parseError) {
          console.error('Error parsing cancellation response:', parseError);
          
          // Still update the UI state even if parsing failed
          setAppointments(prevAppointments => 
            prevAppointments.map(appointment => 
              appointment._id === appointmentId 
                ? { ...appointment, status: 'cancelled' } 
                : appointment
            )
          );
          
          setMessage({
            text: 'Appointment cancelled',
            type: 'success'
          });
        }
      } else {
        try {
          const errorData = await response.json();
          setMessage({
            text: errorData.message || 'Failed to cancel appointment',
            type: 'error'
          });
        } catch (parseError) {
          setMessage({
            text: 'Failed to cancel appointment. Server returned an invalid response.',
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setMessage({
        text: 'Error cancelling appointment. Please try again later.',
        type: 'error'
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Group appointments by status and date
  const groupedAppointments = {
    upcoming: appointments.filter(app => 
      ['scheduled', 'rescheduled'].includes(app.status) && 
      new Date(app.date) >= new Date()
    ),
    past: appointments.filter(app => 
      ['completed', 'cancelled'].includes(app.status) || 
      new Date(app.date) < new Date()
    )
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (appointments.length === 0) {
    return <div className="no-appointments">You have no appointments scheduled.</div>;
  }

  return (
    <div className="appointments-list">
      <h2>My Appointments</h2>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="appointments-section">
        <h3>Upcoming Appointments</h3>
        {groupedAppointments.upcoming.length === 0 ? (
          <p>No upcoming appointments</p>
        ) : (
          <div className="appointments-grid">
            {groupedAppointments.upcoming.map(appointment => (
              <div key={appointment._id} className="appointment-card">
                <div className="appointment-status">{appointment.status}</div>
                <div className="appointment-date">{formatDate(appointment.date)}</div>
                <div className="appointment-time">{appointment.timeSlot}</div>
                <div className="appointment-with">
                  <strong>{currentUser.role === 'doctor' ? 'Patient' : 'Doctor'}:</strong> {
                    currentUser.role === 'doctor' 
                      ? (appointment.patientId?.name || 'Unknown Patient') 
                      : (appointment.doctorId?.name || 'Unknown Doctor')
                  }
                </div>
                {currentUser.role === 'patient' && appointment.doctorId?.specialization && (
                  <div className="appointment-specialization">
                    <strong>Specialization:</strong> {appointment.doctorId.specialization}
                  </div>
                )}
                <div className="appointment-reason">
                  <strong>Reason:</strong> {appointment.reason}
                </div>
                
                {['scheduled', 'rescheduled'].includes(appointment.status) && (
                  <button
                    onClick={() => cancelAppointment(appointment._id)}
                    disabled={actionInProgress === appointment._id}
                    className="cancel-button"
                  >
                    {actionInProgress === appointment._id ? 'Cancelling...' : 'Cancel'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="appointments-section">
        <h3>Past Appointments</h3>
        {groupedAppointments.past.length === 0 ? (
          <p>No past appointments</p>
        ) : (
          <div className="appointments-grid">
            {groupedAppointments.past.map(appointment => (
              <div key={appointment._id} className="appointment-card past">
                <div className={`appointment-status ${appointment.status}`}>{appointment.status}</div>
                <div className="appointment-date">{formatDate(appointment.date)}</div>
                <div className="appointment-time">{appointment.timeSlot}</div>
                <div className="appointment-with">
                  <strong>{currentUser.role === 'doctor' ? 'Patient' : 'Doctor'}:</strong> {
                    currentUser.role === 'doctor' 
                      ? (appointment.patientId?.name || 'Unknown Patient')
                      : (appointment.doctorId?.name || 'Unknown Doctor')
                  }
                </div>
                <div className="appointment-reason">
                  <strong>Reason:</strong> {appointment.reason}
                </div>
                {appointment.notes && (
                  <div className="appointment-notes">
                    <strong>Notes:</strong> {appointment.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsList; 