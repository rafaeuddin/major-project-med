import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/DoctorProfile.css';

const DoctorProfile = ({ editable = false }) => {
  const { currentUser, authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    specialization: '',
    subspecialties: [],
    education: [],
    experience: [],
    consultationFees: {
      inPerson: '',
      virtual: ''
    },
    availableTimeSlots: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    },
    hospitalAffiliations: [],
    languages: [],
    awards: [],
    bio: '',
    profilePicture: ''
  });
  
  const [selectedDay, setSelectedDay] = useState('monday');
  const timeOptions = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', 
    '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'
  ];

  useEffect(() => {
    fetchProfileData();
  }, [currentUser]);

  const fetchProfileData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // In a real app, you would fetch from your API
      const response = await authFetch('/api/doctors/profile');
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(prevData => ({
          ...prevData,
          ...data
        }));
      } else {
        // If API fails, use the data from currentUser as fallback
        setProfileData(prevData => ({
          ...prevData,
          name: currentUser.name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          specialization: currentUser.specialization || '',
          licenseNumber: currentUser.licenseNumber || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setErrorMessage('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, section = 'basic') => {
    const { name, value } = e.target;
    
    if (section === 'basic') {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (section === 'consultationFees') {
      setProfileData(prev => ({
        ...prev,
        consultationFees: {
          ...prev.consultationFees,
          [name]: value
        }
      }));
    }
  };

  const handleTimeSlotToggle = (time) => {
    setProfileData(prev => {
      const currentTimeSlots = [...prev.availableTimeSlots[selectedDay]];
      const exists = currentTimeSlots.includes(time);
      
      const updatedTimeSlots = exists
        ? currentTimeSlots.filter(slot => slot !== time)
        : [...currentTimeSlots, time].sort((a, b) => {
            // Sort time slots
            const aHour = parseInt(a.split(':')[0]);
            const bHour = parseInt(b.split(':')[0]);
            const aIsPM = a.includes('PM');
            const bIsPM = b.includes('PM');
            
            if (aIsPM && !bIsPM) return 1;
            if (!aIsPM && bIsPM) return -1;
            return aHour - bHour;
          });
      
      return {
        ...prev,
        availableTimeSlots: {
          ...prev.availableTimeSlots,
          [selectedDay]: updatedTimeSlots
        }
      };
    });
  };

  const handleAddItem = (section, value = '') => {
    if (!value.trim() && section !== 'education' && section !== 'experience' && section !== 'hospitalAffiliations') {
      return;
    }
    
    setProfileData(prev => {
      const updatedItems = [...prev[section]];
      
      if (section === 'subspecialties' || section === 'languages') {
        if (!updatedItems.includes(value)) {
          updatedItems.push(value);
        }
      } else if (section === 'education') {
        updatedItems.push({ 
          institution: '', 
          degree: '', 
          year: '' 
        });
      } else if (section === 'experience') {
        updatedItems.push({ 
          position: '', 
          institution: '', 
          startYear: '', 
          endYear: 'Present' 
        });
      } else if (section === 'hospitalAffiliations') {
        updatedItems.push({ 
          name: '', 
          location: '' 
        });
      } else if (section === 'awards') {
        updatedItems.push({ 
          title: value, 
          year: new Date().getFullYear() 
        });
      }
      
      return {
        ...prev,
        [section]: updatedItems
      };
    });
  };

  const handleRemoveItem = (section, index) => {
    setProfileData(prev => {
      const updatedItems = [...prev[section]];
      updatedItems.splice(index, 1);
      
      return {
        ...prev,
        [section]: updatedItems
      };
    });
  };

  const handleItemChange = (section, index, field, value) => {
    setProfileData(prev => {
      const updatedItems = [...prev[section]];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
      
      return {
        ...prev,
        [section]: updatedItems
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      // In a real app, you would send data to the API
      const response = await authFetch('/api/doctors/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      if (response.ok) {
        setSuccessMessage('Profile updated successfully');
        setEditMode(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage(error.message || 'An error occurred while updating your profile');
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    setSuccessMessage('');
    setErrorMessage('');
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="doctor-profile">
      <div className="profile-header">
        <h2>Doctor Profile</h2>
        {editable && (
          <button 
            className={`edit-button ${editMode ? 'active' : ''}`} 
            onClick={toggleEditMode}
          >
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        )}
      </div>
      
      {successMessage && <div className="success-message">{successMessage}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="profile-section">
          <h3>Personal Information</h3>
          <div className="section-content">
            {editMode ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="licenseNumber">Medical License Number</label>
                    <input
                      type="text"
                      id="licenseNumber"
                      name="licenseNumber"
                      value={profileData.licenseNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="bio">Professional Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    placeholder="Provide a brief professional biography"
                    rows="4"
                  ></textarea>
                </div>
              </>
            ) : (
              <div className="profile-info">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{profileData.name || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{profileData.email || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Phone:</span>
                  <span className="value">{profileData.phone || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">License Number:</span>
                  <span className="value">{profileData.licenseNumber || 'Not provided'}</span>
                </div>
                {profileData.bio && (
                  <div className="bio-section">
                    <h4>Professional Bio</h4>
                    <p>{profileData.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Specialization</h3>
          <div className="section-content">
            {editMode ? (
              <>
                <div className="form-group">
                  <label htmlFor="specialization">Primary Specialization</label>
                  <input
                    type="text"
                    id="specialization"
                    name="specialization"
                    value={profileData.specialization}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Cardiology, Neurology, etc."
                  />
                </div>
                
                <div className="form-group">
                  <label>Subspecialties</label>
                  <div className="tags-input-container">
                    {profileData.subspecialties.map((specialty, index) => (
                      <div key={index} className="tag-item">
                        <span>{specialty}</span>
                        <button 
                          type="button" 
                          className="remove-tag"
                          onClick={() => handleRemoveItem('subspecialties', index)}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      className="tags-input"
                      placeholder="Add subspecialties and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddItem('subspecialties', e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="profile-info">
                <div className="info-row">
                  <span className="label">Primary Specialization:</span>
                  <span className="value">{profileData.specialization || 'Not provided'}</span>
                </div>
                
                {profileData.subspecialties && profileData.subspecialties.length > 0 && (
                  <div className="info-row">
                    <span className="label">Subspecialties:</span>
                    <div className="value">
                      <div className="tags-display">
                        {profileData.subspecialties.map((specialty, index) => (
                          <span key={index} className="tag">{specialty}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Consultation Fees</h3>
          <div className="section-content">
            {editMode ? (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="inPerson">In-Person Consultation Fee</label>
                  <div className="fee-input">
                    <span className="currency-symbol">$</span>
                    <input
                      type="number"
                      id="inPerson"
                      name="inPerson"
                      value={profileData.consultationFees.inPerson}
                      onChange={(e) => handleInputChange(e, 'consultationFees')}
                      min="0"
                      step="5"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="virtual">Virtual Consultation Fee</label>
                  <div className="fee-input">
                    <span className="currency-symbol">$</span>
                    <input
                      type="number"
                      id="virtual"
                      name="virtual"
                      value={profileData.consultationFees.virtual}
                      onChange={(e) => handleInputChange(e, 'consultationFees')}
                      min="0"
                      step="5"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="profile-info">
                <div className="info-row">
                  <span className="label">In-Person Consultation:</span>
                  <span className="value fee">
                    {profileData.consultationFees.inPerson 
                      ? `$${profileData.consultationFees.inPerson}` 
                      : 'Not specified'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Virtual Consultation:</span>
                  <span className="value fee">
                    {profileData.consultationFees.virtual 
                      ? `$${profileData.consultationFees.virtual}` 
                      : 'Not specified'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Available Time Slots</h3>
          <div className="section-content">
            {editMode ? (
              <div className="timeslots-editor">
                <div className="days-selector">
                  {Object.keys(profileData.availableTimeSlots).map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`day-button ${selectedDay === day ? 'active' : ''}`}
                      onClick={() => setSelectedDay(day)}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </button>
                  ))}
                </div>
                
                <div className="time-slots-grid">
                  {timeOptions.map((time) => (
                    <div
                      key={time}
                      className={`time-slot-option ${
                        profileData.availableTimeSlots[selectedDay].includes(time) ? 'selected' : ''
                      }`}
                      onClick={() => handleTimeSlotToggle(time)}
                    >
                      {time}
                    </div>
                  ))}
                </div>
                
                <div className="time-slots-help">
                  <p>Click on time slots to mark them as available for appointments.</p>
                </div>
              </div>
            ) : (
              <div className="available-slots">
                {Object.entries(profileData.availableTimeSlots).map(([day, slots]) => (
                  <div key={day} className="day-slots">
                    <h4>{day.charAt(0).toUpperCase() + day.slice(1)}</h4>
                    {slots.length > 0 ? (
                      <div className="slots-list">
                        {slots.map((slot, index) => (
                          <span key={index} className="time-slot">{slot}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="no-slots">Not available</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Professional Details</h3>
          <div className="section-content">
            {editMode ? (
              <>
                <div className="subsection">
                  <h4>Education</h4>
                  {profileData.education.map((edu, index) => (
                    <div key={index} className="form-item">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Institution</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => handleItemChange('education', index, 'institution', e.target.value)}
                            placeholder="University/Institution name"
                          />
                        </div>
                        <div className="form-group">
                          <label>Degree</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => handleItemChange('education', index, 'degree', e.target.value)}
                            placeholder="e.g. MD, PhD, etc."
                          />
                        </div>
                        <div className="form-group year-input">
                          <label>Year</label>
                          <input
                            type="text"
                            value={edu.year}
                            onChange={(e) => handleItemChange('education', index, 'year', e.target.value)}
                            placeholder="Year of completion"
                          />
                        </div>
                      </div>
                      <button 
                        type="button"
                        className="remove-item-button"
                        onClick={() => handleRemoveItem('education', index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className="add-item-button"
                    onClick={() => handleAddItem('education')}
                  >
                    Add Education
                  </button>
                </div>
                
                <div className="subsection">
                  <h4>Experience</h4>
                  {profileData.experience.map((exp, index) => (
                    <div key={index} className="form-item">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Position</label>
                          <input
                            type="text"
                            value={exp.position}
                            onChange={(e) => handleItemChange('experience', index, 'position', e.target.value)}
                            placeholder="Job title"
                          />
                        </div>
                        <div className="form-group">
                          <label>Institution</label>
                          <input
                            type="text"
                            value={exp.institution}
                            onChange={(e) => handleItemChange('experience', index, 'institution', e.target.value)}
                            placeholder="Hospital/Clinic name"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group year-input">
                          <label>Start Year</label>
                          <input
                            type="text"
                            value={exp.startYear}
                            onChange={(e) => handleItemChange('experience', index, 'startYear', e.target.value)}
                            placeholder="Start year"
                          />
                        </div>
                        <div className="form-group year-input">
                          <label>End Year</label>
                          <input
                            type="text"
                            value={exp.endYear}
                            onChange={(e) => handleItemChange('experience', index, 'endYear', e.target.value)}
                            placeholder="End year or Present"
                          />
                        </div>
                      </div>
                      <button 
                        type="button"
                        className="remove-item-button"
                        onClick={() => handleRemoveItem('experience', index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className="add-item-button"
                    onClick={() => handleAddItem('experience')}
                  >
                    Add Experience
                  </button>
                </div>
                
                <div className="subsection">
                  <h4>Hospital Affiliations</h4>
                  {profileData.hospitalAffiliations.map((affiliation, index) => (
                    <div key={index} className="form-item">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Hospital/Clinic Name</label>
                          <input
                            type="text"
                            value={affiliation.name}
                            onChange={(e) => handleItemChange('hospitalAffiliations', index, 'name', e.target.value)}
                            placeholder="Hospital/Clinic name"
                          />
                        </div>
                        <div className="form-group">
                          <label>Location</label>
                          <input
                            type="text"
                            value={affiliation.location}
                            onChange={(e) => handleItemChange('hospitalAffiliations', index, 'location', e.target.value)}
                            placeholder="City, State"
                          />
                        </div>
                      </div>
                      <button 
                        type="button"
                        className="remove-item-button"
                        onClick={() => handleRemoveItem('hospitalAffiliations', index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className="add-item-button"
                    onClick={() => handleAddItem('hospitalAffiliations')}
                  >
                    Add Affiliation
                  </button>
                </div>
                
                <div className="subsection">
                  <h4>Languages</h4>
                  <div className="tags-input-container">
                    {profileData.languages.map((language, index) => (
                      <div key={index} className="tag-item">
                        <span>{language}</span>
                        <button 
                          type="button" 
                          className="remove-tag"
                          onClick={() => handleRemoveItem('languages', index)}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      className="tags-input"
                      placeholder="Add languages and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddItem('languages', e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="professional-info">
                {profileData.education && profileData.education.length > 0 && (
                  <div className="info-subsection">
                    <h4>Education</h4>
                    <ul className="info-list">
                      {profileData.education.map((edu, index) => (
                        <li key={index}>
                          <strong>{edu.degree}</strong>
                          {edu.institution && <span> - {edu.institution}</span>}
                          {edu.year && <span> ({edu.year})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {profileData.experience && profileData.experience.length > 0 && (
                  <div className="info-subsection">
                    <h4>Experience</h4>
                    <ul className="info-list">
                      {profileData.experience.map((exp, index) => (
                        <li key={index}>
                          <strong>{exp.position}</strong>
                          {exp.institution && <span> at {exp.institution}</span>}
                          <div className="date-range">
                            {exp.startYear} - {exp.endYear}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {profileData.hospitalAffiliations && profileData.hospitalAffiliations.length > 0 && (
                  <div className="info-subsection">
                    <h4>Hospital Affiliations</h4>
                    <ul className="info-list">
                      {profileData.hospitalAffiliations.map((affiliation, index) => (
                        <li key={index}>
                          <strong>{affiliation.name}</strong>
                          {affiliation.location && <span> - {affiliation.location}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {profileData.languages && profileData.languages.length > 0 && (
                  <div className="info-subsection">
                    <h4>Languages</h4>
                    <div className="tags-display">
                      {profileData.languages.map((language, index) => (
                        <span key={index} className="tag">{language}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {(!profileData.education || profileData.education.length === 0) &&
                 (!profileData.experience || profileData.experience.length === 0) &&
                 (!profileData.hospitalAffiliations || profileData.hospitalAffiliations.length === 0) &&
                 (!profileData.languages || profileData.languages.length === 0) && (
                  <p className="no-data-message">No professional details provided yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {editMode && editable && (
          <div className="form-actions">
            <button type="submit" className="save-button">
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default DoctorProfile; 