import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/PatientProfile.css';

const PatientProfile = ({ editable = false }) => {
  const { currentUser, authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    gender: '',
    bloodType: '',
    allergies: '',
    chronicConditions: '',
    medications: '',
    medicalHistory: [],
    emergencyContacts: [
      { name: '', relationship: '', phone: '' }
    ],
    documents: []
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    fetchProfileData();
  }, [currentUser]);

  const fetchProfileData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // In a real app, you would fetch from your API
      const response = await authFetch('/api/patients/profile');
      
      if (response.ok) {
        const data = await response.json();
        setProfileData({
          ...data,
          // Ensure these arrays exist
          medicalHistory: data.medicalHistory || [],
          emergencyContacts: data.emergencyContacts || [{ name: '', relationship: '', phone: '' }],
          documents: data.documents || []
        });
      } else {
        // If API fails, use the data from currentUser as fallback
        setProfileData({
          ...profileData,
          name: currentUser.name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          emergencyContacts: currentUser.emergencyContact ? 
            [{ 
              name: currentUser.emergencyContact.name || '', 
              relationship: currentUser.emergencyContact.relationship || '', 
              phone: currentUser.emergencyContact.phone || '' 
            }] : 
            [{ name: '', relationship: '', phone: '' }],
          medicalHistory: currentUser.medicalHistory || []
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setErrorMessage('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, section, index = null) => {
    const { name, value } = e.target;
    
    if (section === 'basic') {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (section === 'emergencyContacts' && index !== null) {
      const updatedContacts = [...profileData.emergencyContacts];
      updatedContacts[index] = {
        ...updatedContacts[index],
        [name]: value
      };
      
      setProfileData(prev => ({
        ...prev,
        emergencyContacts: updatedContacts
      }));
    }
  };

  const addEmergencyContact = () => {
    setProfileData(prev => ({
      ...prev,
      emergencyContacts: [
        ...prev.emergencyContacts,
        { name: '', relationship: '', phone: '' }
      ]
    }));
  };

  const removeEmergencyContact = (index) => {
    if (profileData.emergencyContacts.length <= 1) return;
    
    const updatedContacts = [...profileData.emergencyContacts];
    updatedContacts.splice(index, 1);
    
    setProfileData(prev => ({
      ...prev,
      emergencyContacts: updatedContacts
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    const updatedFiles = [...uploadedFiles];
    updatedFiles.splice(index, 1);
    setUploadedFiles(updatedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      // Handle file uploads first
      if (uploadedFiles.length > 0) {
        const formData = new FormData();
        uploadedFiles.forEach(file => formData.append('documents', file));
        
        const uploadResponse = await authFetch('/api/patients/documents', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload documents');
        }
        
        const uploadedDocs = await uploadResponse.json();
        // Update documents in profileData with newly uploaded ones
        setProfileData(prev => ({
          ...prev,
          documents: [...prev.documents, ...uploadedDocs.documents]
        }));
      }
      
      // Save profile data
      const response = await authFetch('/api/patients/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      if (response.ok) {
        setSuccessMessage('Profile updated successfully');
        setEditMode(false);
        setUploadedFiles([]);
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
    <div className="patient-profile">
      <div className="profile-header">
        <h2>Patient Profile</h2>
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
                      onChange={(e) => handleInputChange(e, 'basic')}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="dateOfBirth">Date of Birth</label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={profileData.dateOfBirth}
                      onChange={(e) => handleInputChange(e, 'basic')}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange(e, 'basic')}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange(e, 'basic')}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={profileData.address}
                      onChange={(e) => handleInputChange(e, 'basic')}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="gender">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      value={profileData.gender}
                      onChange={(e) => handleInputChange(e, 'basic')}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bloodType">Blood Type</label>
                    <select
                      id="bloodType"
                      name="bloodType"
                      value={profileData.bloodType}
                      onChange={(e) => handleInputChange(e, 'basic')}
                    >
                      <option value="">Select blood type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <div className="profile-info">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{profileData.name || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Date of Birth:</span>
                  <span className="value">
                    {profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                  </span>
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
                  <span className="label">Address:</span>
                  <span className="value">{profileData.address || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Gender:</span>
                  <span className="value">{profileData.gender || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Blood Type:</span>
                  <span className="value">{profileData.bloodType || 'Not provided'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Medical Information</h3>
          <div className="section-content">
            {editMode ? (
              <>
                <div className="form-group">
                  <label htmlFor="allergies">Allergies</label>
                  <textarea
                    id="allergies"
                    name="allergies"
                    value={profileData.allergies}
                    onChange={(e) => handleInputChange(e, 'basic')}
                    placeholder="List any allergies you have"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="chronicConditions">Chronic Conditions</label>
                  <textarea
                    id="chronicConditions"
                    name="chronicConditions"
                    value={profileData.chronicConditions}
                    onChange={(e) => handleInputChange(e, 'basic')}
                    placeholder="List any chronic conditions"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="medications">Current Medications</label>
                  <textarea
                    id="medications"
                    name="medications"
                    value={profileData.medications}
                    onChange={(e) => handleInputChange(e, 'basic')}
                    placeholder="List any medications you're currently taking"
                  />
                </div>
              </>
            ) : (
              <div className="profile-info">
                <div className="info-row">
                  <span className="label">Allergies:</span>
                  <span className="value">{profileData.allergies || 'None reported'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Chronic Conditions:</span>
                  <span className="value">{profileData.chronicConditions || 'None reported'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Current Medications:</span>
                  <span className="value">{profileData.medications || 'None reported'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Medical History</h3>
          <div className="section-content">
            {profileData.medicalHistory && profileData.medicalHistory.length > 0 ? (
              <div className="medical-history-list">
                {profileData.medicalHistory.map((record, index) => (
                  <div key={index} className="medical-record-card">
                    <h4>{record.title}</h4>
                    <p>{record.description}</p>
                    <div className="record-meta">
                      <span className="record-date">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                      <span className="record-doctor">
                        Dr. {record.doctorName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-message">No medical history records available.</p>
            )}
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Emergency Contacts</h3>
          <div className="section-content">
            {editMode ? (
              <div className="emergency-contacts-editor">
                {profileData.emergencyContacts.map((contact, index) => (
                  <div key={index} className="emergency-contact-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`contact-name-${index}`}>Name</label>
                        <input
                          type="text"
                          id={`contact-name-${index}`}
                          name="name"
                          value={contact.name}
                          onChange={(e) => handleInputChange(e, 'emergencyContacts', index)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`contact-relationship-${index}`}>Relationship</label>
                        <input
                          type="text"
                          id={`contact-relationship-${index}`}
                          name="relationship"
                          value={contact.relationship}
                          onChange={(e) => handleInputChange(e, 'emergencyContacts', index)}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`contact-phone-${index}`}>Phone</label>
                        <input
                          type="tel"
                          id={`contact-phone-${index}`}
                          name="phone"
                          value={contact.phone}
                          onChange={(e) => handleInputChange(e, 'emergencyContacts', index)}
                          required
                        />
                      </div>
                      <div className="form-group contact-actions">
                        {profileData.emergencyContacts.length > 1 && (
                          <button 
                            type="button" 
                            className="remove-contact-button"
                            onClick={() => removeEmergencyContact(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  type="button" 
                  className="add-contact-button"
                  onClick={addEmergencyContact}
                >
                  Add Another Contact
                </button>
              </div>
            ) : (
              <div className="emergency-contacts-list">
                {profileData.emergencyContacts && profileData.emergencyContacts.length > 0 ? (
                  profileData.emergencyContacts.map((contact, index) => (
                    <div key={index} className="emergency-contact-card">
                      <div className="contact-name">{contact.name || 'Not provided'}</div>
                      <div className="contact-details">
                        <div className="contact-relationship">{contact.relationship || 'Not provided'}</div>
                        <div className="contact-phone">{contact.phone || 'Not provided'}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data-message">No emergency contacts provided.</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-section">
          <h3>Medical Documents</h3>
          <div className="section-content">
            {editMode && (
              <div className="document-upload">
                <label htmlFor="document-upload" className="upload-label">
                  <span className="upload-icon">
                    <i className="fas fa-cloud-upload-alt"></i>
                  </span>
                  <span className="upload-text">
                    Drop files here or click to upload
                  </span>
                  <input
                    type="file"
                    id="document-upload"
                    className="file-input"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </label>
                
                {uploadedFiles.length > 0 && (
                  <div className="uploaded-files">
                    <h4>Files to Upload:</h4>
                    <ul className="files-list">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="file-item">
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                          <button 
                            type="button"
                            className="remove-file"
                            onClick={() => removeFile(index)}
                          >
                            &times;
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="documents-list">
              <h4>Uploaded Documents</h4>
              {profileData.documents && profileData.documents.length > 0 ? (
                <ul className="files-list">
                  {profileData.documents.map((doc, index) => (
                    <li key={index} className="file-item document">
                      <div className="document-icon">
                        <i className={`fas ${getFileIconClass(doc.fileType)}`}></i>
                      </div>
                      <div className="document-info">
                        <span className="document-name">{doc.fileName}</span>
                        <span className="document-date">
                          Uploaded on {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                      </div>
                      <a href={doc.fileUrl} className="document-download" target="_blank" rel="noopener noreferrer">
                        <i className="fas fa-download"></i>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data-message">No documents uploaded yet.</p>
              )}
            </div>
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

// Helper function to determine file icon based on file type
const getFileIconClass = (fileType) => {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return 'fa-file-pdf';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'fa-file-image';
    case 'doc':
    case 'docx':
      return 'fa-file-word';
    default:
      return 'fa-file';
  }
};

export default PatientProfile; 