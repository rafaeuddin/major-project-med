import React from 'react';
import CalendarComponent from '../components/CalendarComponent';

const AppointmentBooking = () => {
  return (
    <div>
      <h1>Book an Appointment</h1>
      <CalendarComponent />
      {/* Additional components or logic for time slot selection and booking confirmation can be added here */}
    </div>
  );
};

export default AppointmentBooking; 