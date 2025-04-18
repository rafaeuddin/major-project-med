import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CalendarComponent from './CalendarComponent';

const AppointmentBookingForm = () => {
  const { currentUser, authFetch } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [reason, setReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch('/api/users/doctors');
        if (response.ok) {
          const data = await response.json();
          setDoctors(data);
        } else {
          console.error('Failed to fetch doctors');
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleDoctorChange = (e) => {
    setSelectedDoctor(e.target.value);
    // Reset time slot when doctor changes
    setSelectedTimeSlot('');
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Reset time slot when date changes
    setSelectedTimeSlot('');
  };

  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDoctor || !selectedDate || !selectedTimeSlot || !reason) {
      setMessage({ 
        text: 'Please fill in all required fields', 
        type: 'error' 
      });
      return;
    }

    setSubmitLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const appointmentData = {
        doctorId: selectedDoctor,
        date: selectedDate.toISOString(),
        timeSlot: selectedTimeSlot,
        reason
      };

      const response = await authFetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          text: 'Appointment booked successfully!',
          type: 'success'
        });
        
        // Reset form
        setReason('');
        setSelectedTimeSlot('');
      } else {
        setMessage({
          text: data.message || 'Failed to book appointment',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setMessage({
        text: error.message || 'An error occurred while booking the appointment',
        type: 'error'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading doctors...</div>;
  }

  return (
    <div className="appointment-booking-form">
      <h2>Book an Appointment</h2>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="doctor">Select Doctor</label>
          <select
            id="doctor"
            value={selectedDoctor}
            onChange={handleDoctorChange}
            required
          >
            <option value="">-- Select a Doctor --</option>
            {doctors.map(doctor => (
              <option key={doctor._id} value={doctor._id}>
                Dr. {doctor.name} - {doctor.specialization}
              </option>
            ))}
          </select>
        </div>

        {selectedDoctor && (
          <div className="calendar-container">
            <CalendarComponent
              doctorId={selectedDoctor}
              onDateSelect={handleDateSelect}
              onTimeSlotSelect={handleTimeSlotSelect}
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="reason">Reason for Visit</label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please describe the reason for your appointment"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!selectedDoctor || !selectedDate || !selectedTimeSlot || !reason || submitLoading}
          className={submitLoading ? 'loading' : ''}
        >
          {submitLoading ? 'Booking...' : 'Book Appointment'}
        </button>
      </form>
    </div>
  );
};

export default AppointmentBookingForm; 