import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarComponent from '../components/CalendarComponent';
import '../styles/AppointmentForm.css';

const AppointmentForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    reason: '',
    selectedDate: new Date(),
    selectedTimeSlot: null,
    doctor: '',
    insurance: '',
    isNewPatient: false,
    previousVisit: '',
    emergencyContact: '',
    symptoms: [],
    files: [],
    termsAccepted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);

  const availableDoctors = [
    { id: 1, name: 'Dr. Sarah Johnson', specialization: 'General Physician' },
    { id: 2, name: 'Dr. Michael Chen', specialization: 'Cardiologist' },
    { id: 3, name: 'Dr. Emily Rodriguez', specialization: 'Pediatrician' },
    { id: 4, name: 'Dr. David Kim', specialization: 'Dermatologist' },
    { id: 5, name: 'Dr. Patricia Moore', specialization: 'Neurologist' }
  ];

  const symptomsList = [
    'Fever', 'Cough', 'Headache', 'Sore Throat', 'Fatigue', 
    'Shortness of Breath', 'Nausea', 'Dizziness', 'Joint Pain', 'Rash'
  ];

  const handleGoBack = () => {
    navigate('/patient/dashboard');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'checkbox' && name === 'isNewPatient') {
      setFormData(prevState => ({
        ...prevState,
        [name]: checked
      }));
    } else if (type === 'checkbox' && name === 'termsAccepted') {
      setFormData(prevState => ({
        ...prevState,
        [name]: checked
      }));
    } else if (type === 'file') {
      setFormData(prevState => ({
        ...prevState,
        files: Array.from(files)
      }));
    } else if (name === 'symptoms') {
      const updatedSymptoms = [...formData.symptoms];
      
      if (checked) {
        updatedSymptoms.push(value);
      } else {
        const index = updatedSymptoms.indexOf(value);
        if (index > -1) {
          updatedSymptoms.splice(index, 1);
        }
      }
      
      setFormData(prevState => ({
        ...prevState,
        symptoms: updatedSymptoms
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const handleDateSelect = (date) => {
    setFormData(prevState => ({
      ...prevState,
      selectedDate: date,
      selectedTimeSlot: null
    }));
  };

  const handleTimeSlotSelect = (timeSlot) => {
    setFormData(prevState => ({
      ...prevState,
      selectedTimeSlot: timeSlot
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.selectedDate) newErrors.selectedDate = 'Please select a date';
      if (!formData.selectedTimeSlot) newErrors.selectedTimeSlot = 'Please select a time slot';
      if (!formData.doctor) newErrors.doctor = 'Please select a doctor';
    }
    
    if (step === 2) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Phone number is invalid';
      }
    }
    
    if (step === 3) {
      if (!formData.reason.trim()) newErrors.reason = 'Reason for visit is required';
      if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prevStep => prevStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prevStep => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);

    try {
      // Simulate API call to book appointment
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show confirmation on success
      setShowConfirmation(true);
    } catch (error) {
      alert('Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showConfirmation) {
    const doctor = availableDoctors.find(doc => doc.id === parseInt(formData.doctor, 10));
    
    const handleAddToCalendar = () => {
      try {
        setIsAddingToCalendar(true);
        
        // Create calendar event title and description
        const eventTitle = `Medical Appointment with ${doctor ? doctor.name : 'Doctor'}`;
        const eventDescription = `Reason for visit: ${formData.reason}\nContact: ${formData.email}, ${formData.phone}`;
        
        // Format date and time for calendar
        const appointmentDate = formData.selectedDate;
        const timeString = formData.selectedTimeSlot;
        
        // Handle case where timeSlot might be empty/null
        if (!timeString) {
          alert("Cannot add to calendar: Missing appointment time");
          return;
        }
        
        // Parse the time string (e.g., "10:00 AM" or "2:30 PM")
        const timeParts = timeString.match(/(\d+):?(\d+)?\s*(AM|PM)/i);
        
        if (!timeParts) {
          alert("Cannot add to calendar: Invalid time format");
          return;
        }
        
        let hour = parseInt(timeParts[1]);
        const minute = timeParts[2] ? parseInt(timeParts[2]) : 0;
        const period = timeParts[3].toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hour < 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        // Set start and end time (1 hour appointment)
        const startDate = new Date(appointmentDate);
        startDate.setHours(hour);
        startDate.setMinutes(minute);
        startDate.setSeconds(0);
        
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 1);
        
        // Format for Google Calendar URL
        const startISOString = startDate.toISOString().replace(/-|:|\.\d+/g, '');
        const endISOString = endDate.toISOString().replace(/-|:|\.\d+/g, '');
        
        // Create Google Calendar URL
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startISOString}/${endISOString}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent('Medical Clinic')}&sf=true&output=xml`;
        
        // Open in a new window
        window.open(googleCalendarUrl, '_blank');
        
        // Show success message
        setTimeout(() => {
          setIsAddingToCalendar(false);
        }, 1000);
      } catch (error) {
        console.error("Error adding to calendar:", error);
        alert("Failed to add to calendar. Please try again.");
        setIsAddingToCalendar(false);
      }
    };
    
    return (
      <div className="confirmation-page">
        <div className="back-button-container">
          <button className="back-button" onClick={handleGoBack}>
            ← Back to Dashboard
          </button>
        </div>
        <div className="confirmation-header">
          <i className="fas fa-check-circle confirmation-icon"></i>
          <h2>Appointment Confirmed!</h2>
          <p>Your appointment has been booked successfully. We have sent a confirmation to your email.</p>
        </div>
        
        <div className="confirmation-details">
          <div className="confirmation-row">
            <span>Patient:</span>
            <strong>{formData.name}</strong>
          </div>
          <div className="confirmation-row">
            <span>Doctor:</span>
            <strong>{doctor ? doctor.name : 'Not selected'}</strong>
          </div>
          <div className="confirmation-row">
            <span>Date:</span>
            <strong>{formData.selectedDate.toDateString()}</strong>
          </div>
          <div className="confirmation-row">
            <span>Time:</span>
            <strong>{formData.selectedTimeSlot}</strong>
          </div>
          <div className="confirmation-row">
            <span>Purpose:</span>
            <strong>{formData.reason}</strong>
          </div>
          <div className="confirmation-contact">
            <p>A confirmation email has been sent to <strong>{formData.email}</strong></p>
            <p>We will also send you a reminder 24 hours before your appointment.</p>
          </div>
        </div>
        
        <div className="confirmation-actions">
          <button className="btn-primary" onClick={() => setShowConfirmation(false)}>
            Book Another Appointment
          </button>
          <button className="btn-secondary" onClick={handleAddToCalendar} disabled={isAddingToCalendar}>
            {isAddingToCalendar ? (
              <>
                <span className="button-spinner"></span> Adding...
              </>
            ) : (
              <>
                <i className="fas fa-calendar-alt"></i> Add to Calendar
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-form">
      <div className="back-button-container">
        <button className="back-button" onClick={handleGoBack}>
          ← Back to Dashboard
        </button>
      </div>
      <h1>Book your Medical Appointment</h1>
      
      <div className="form-progress">
        <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Choose Date & Doctor</div>
        </div>
        <div className="progress-bar"></div>
        <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Personal Information</div>
        </div>
        <div className="progress-bar"></div>
        <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Medical Details</div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <div className="form-step">
            <h2>Select Appointment Date and Doctor</h2>
            
            <div className="form-group">
              <label htmlFor="doctor">Select Doctor</label>
              <select
                id="doctor"
                name="doctor"
                value={formData.doctor}
                onChange={handleInputChange}
                className={errors.doctor ? 'error' : ''}
              >
                <option value="">-- Select a Doctor --</option>
                {availableDoctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} ({doctor.specialization})
                  </option>
                ))}
              </select>
              {errors.doctor && <span className="error-message">{errors.doctor}</span>}
            </div>
            
            <CalendarComponent 
              onDateSelect={handleDateSelect}
              onTimeSlotSelect={handleTimeSlotSelect}
              selectedDate={formData.selectedDate}
              selectedTimeSlot={formData.selectedTimeSlot}
            />
            
            {errors.selectedTimeSlot && <span className="error-message">{errors.selectedTimeSlot}</span>}
            
            <div className="form-navigation">
              <button 
                type="button" 
                className="btn-next" 
                onClick={nextStep}
              >
                Continue <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 2 && (
          <div className="form-step">
            <h2>Personal Information</h2>
            
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="Enter your full name" 
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                placeholder="Enter your email address" 
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                value={formData.phone} 
                onChange={handleInputChange} 
                placeholder="Enter your phone number" 
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="emergencyContact">Emergency Contact</label>
              <input 
                type="text" 
                id="emergencyContact" 
                name="emergencyContact" 
                value={formData.emergencyContact} 
                onChange={handleInputChange} 
                placeholder="Name and phone number of emergency contact" 
              />
            </div>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  name="isNewPatient" 
                  checked={formData.isNewPatient} 
                  onChange={handleInputChange} 
                />
                <span className="checkmark"></span>
                I am a new patient
              </label>
            </div>
            
            {!formData.isNewPatient && (
              <div className="form-group">
                <label htmlFor="previousVisit">Date of Last Visit (if applicable)</label>
                <input 
                  type="date" 
                  id="previousVisit" 
                  name="previousVisit" 
                  value={formData.previousVisit} 
                  onChange={handleInputChange} 
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="insurance">Insurance Information (if applicable)</label>
              <input 
                type="text" 
                id="insurance" 
                name="insurance" 
                value={formData.insurance} 
                onChange={handleInputChange} 
                placeholder="Insurance provider and policy number" 
              />
            </div>
            
            <div className="form-navigation">
              <button 
                type="button" 
                className="btn-back" 
                onClick={prevStep}
              >
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button 
                type="button" 
                className="btn-next" 
                onClick={nextStep}
              >
                Continue <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="form-step">
            <h2>Medical Details</h2>
            
            <div className="form-group">
              <label htmlFor="reason">Reason for Visit</label>
              <textarea 
                id="reason" 
                name="reason" 
                value={formData.reason} 
                onChange={handleInputChange} 
                placeholder="Please describe your symptoms or reason for the appointment" 
                className={errors.reason ? 'error' : ''}
              />
              {errors.reason && <span className="error-message">{errors.reason}</span>}
            </div>
            
            <div className="form-group">
              <label>Common Symptoms (Check all that apply)</label>
              <div className="symptoms-grid">
                {symptomsList.map(symptom => (
                  <label key={symptom} className="checkbox-container">
                    <input 
                      type="checkbox" 
                      name="symptoms" 
                      value={symptom} 
                      checked={formData.symptoms.includes(symptom)} 
                      onChange={handleInputChange} 
                    />
                    <span className="checkmark"></span>
                    {symptom}
                  </label>
                ))}
              </div>
            </div>
            
            <div className="form-group file-upload">
              <label htmlFor="files">
                <i className="fas fa-cloud-upload-alt"></i> Upload Medical Records (optional)
              </label>
              <input 
                type="file" 
                id="files" 
                name="files" 
                onChange={handleInputChange} 
                multiple 
                accept=".pdf,.jpg,.jpeg,.png" 
              />
              {formData.files.length > 0 && (
                <div className="file-list">
                  <p>{formData.files.length} file(s) selected</p>
                  <ul>
                    {formData.files.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  name="termsAccepted" 
                  checked={formData.termsAccepted} 
                  onChange={handleInputChange} 
                  className={errors.termsAccepted ? 'error' : ''}
                />
                <span className="checkmark"></span>
                I agree to the terms and conditions, including the privacy policy and consent for treatment
              </label>
              {errors.termsAccepted && <span className="error-message">{errors.termsAccepted}</span>}
            </div>
            
            <div className="form-navigation">
              <button 
                type="button" 
                className="btn-back" 
                onClick={prevStep}
              >
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button 
                type="submit" 
                className="btn-submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span>Booking Appointment</span>
                    <div className="spinner"></div>
                  </>
                ) : (
                  <>
                    <span>Book Appointment</span>
                    <i className="fas fa-calendar-check"></i>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default AppointmentForm; 