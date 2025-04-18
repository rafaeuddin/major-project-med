import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '../context/AuthContext';

const CalendarComponent = ({ onDateSelect, onTimeSlotSelect, selectedDate, selectedTimeSlot, doctorId }) => {
  const [date, setDate] = useState(selectedDate || new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [localSelectedTimeSlot, setLocalSelectedTimeSlot] = useState(selectedTimeSlot);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const auth = useAuth();
  const authFetch = auth?.authFetch;

  useEffect(() => {
    // Fetch time slots from the API
    const fetchTimeSlots = async () => {
      setIsLoading(true);
      try {
        // If doctorId is provided, fetch real data from API
        if (doctorId) {
          const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          const response = await fetch(`/api/appointments/slots?date=${formattedDate}&doctorId=${doctorId}`);
          
          if (response.ok) {
            const data = await response.json();
            setTimeSlots(data.availableTimeSlots);
          } else {
            console.error('Error fetching time slots');
            setTimeSlots([]);
          }
        } else {
          // Fallback to the demo data if no doctorId is provided
          await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay
          const availableSlots = generateRandomAvailability(date);
          setTimeSlots(availableSlots);
        }
      } catch (error) {
        console.error('Error fetching time slots:', error);
        setTimeSlots([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [date, doctorId]);

  useEffect(() => {
    setDate(selectedDate || new Date());
  }, [selectedDate]);

  useEffect(() => {
    setLocalSelectedTimeSlot(selectedTimeSlot);
  }, [selectedTimeSlot]);

  // Generate doctor availability randomly for demo purposes
  const generateRandomAvailability = (date) => {
    // Seed the random generator with the date to make it consistent for the same date
    const baseSeed = date.getDate() + date.getMonth() * 100 + date.getFullYear() * 10000;
    let seedValue = baseSeed;
    
    const randomGen = () => {
      seedValue += 1;
      const x = Math.sin(seedValue) * 10000;
      return x - Math.floor(x);
    };

    // Generate between 3 and 7 slots based on weekday (fewer on weekends)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const numSlots = isWeekend ? 
      Math.floor(randomGen() * 3) + 2 : // 2-4 slots on weekends
      Math.floor(randomGen() * 5) + 3;  // 3-7 slots on weekdays

    const allPossibleSlots = [
      '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
      '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', 
      '04:00 PM', '05:00 PM'
    ];

    // Shuffle array and take the first numSlots elements
    const shuffledSlots = [...allPossibleSlots].sort(() => 0.5 - randomGen());
    return shuffledSlots.slice(0, numSlots);
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setLocalSelectedTimeSlot(null);
    
    if (onDateSelect) {
      onDateSelect(newDate);
    }
  };

  const handleTimeSlotSelection = (slot) => {
    setLocalSelectedTimeSlot(slot);
    
    if (onTimeSlotSelect) {
      onTimeSlotSelect(slot);
    }
  };

  // Customize the tile content to show availability indicators
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return (
        <div className="tile-content tile-past">
          <span className="dot"></span>
        </div>
      );
    }
    
    // Simplified availability indicator based on weekday
    // In a real app, this would come from actual availability data
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const availabilityClass = isWeekend ? 'low' : 
      (date.getDay() % 2 === 0 ? 'medium' : 'high');
    
    return (
      <div className={`tile-content availability-${availabilityClass}`}>
        <span className="dot"></span>
      </div>
    );
  };

  // Add custom class for date tile to indicate if it's past, today, or future
  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return 'past-date';
    } else if (date.getTime() === today.getTime()) {
      return 'today-date';
    }
    
    return 'future-date';
  };

  // Track month changes for animation purposes
  const handleActiveStartDateChange = ({ activeStartDate }) => {
    const newMonth = activeStartDate.getMonth();
    setCurrentMonth(newMonth);
  };

  return (
    <div className="calendar-component">
      <div className="calendar-header">
        <h2>Select an Appointment Date</h2>
        <div className="calendar-subtitle">
          <span className="availability-indicator high"></span> High Availability
          <span className="availability-indicator medium"></span> Medium
          <span className="availability-indicator low"></span> Low
        </div>
      </div>

      <div className="calendar-wrapper" key={`calendar-${currentMonth}`}>
        <Calendar
          onChange={handleDateChange}
          value={date}
          tileContent={tileContent}
          tileClassName={tileClassName}
          minDate={new Date()}
          onActiveStartDateChange={handleActiveStartDateChange}
          prevLabel={<i className="fas fa-chevron-left"></i>}
          nextLabel={<i className="fas fa-chevron-right"></i>}
        />
      </div>

      <div className="date-selection-info">
        <p>Selected date: <strong>{date.toDateString()}</strong></p>
      </div>

      <h3>Select a Time Slot</h3>
      
      {isLoading ? (
        <div className="time-slots-loading">
          <div className="loading-animation">
            <div></div><div></div><div></div><div></div>
          </div>
          <p>Checking doctor's availability...</p>
        </div>
      ) : timeSlots.length > 0 ? (
        <div className="time-slots">
          {timeSlots.map((slot, index) => (
            <button
              key={index}
              onClick={() => handleTimeSlotSelection(slot)}
              className={localSelectedTimeSlot === slot ? 'selected' : ''}
              style={{
                animationDelay: `${index * 0.05}s`
              }}
            >
              {slot}
            </button>
          ))}
        </div>
      ) : (
        <div className="no-slots-available">
          <p>No time slots available for this date. Please select another day.</p>
        </div>
      )}

      {localSelectedTimeSlot && (
        <div className="selected-slot-info">
          <p>You've selected: <strong>{localSelectedTimeSlot}</strong> on <strong>{date.toDateString()}</strong></p>
        </div>
      )}
    </div>
  );
};

export default CalendarComponent; 