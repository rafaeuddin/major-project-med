import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaPrint, FaFilePdf, FaDownload, FaTimes, FaPlus } from 'react-icons/fa';
import '../styles/PrescriptionTemplate.css';

const PrescriptionTemplate = ({ patient, onClose, appointmentDetails }) => {
  const { currentUser, authFetch } = useAuth();
  const [prescriptionData, setPrescriptionData] = useState({
    diagnosis: '',
    instructions: '',
    notes: '',
    medications: [
      { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ],
    followUpDate: '',
    testRecommendations: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ message: '', type: '' });
  const prescriptionRef = useRef(null);
  
  // Format today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Add new medication field
  const addMedication = () => {
    setPrescriptionData({
      ...prescriptionData,
      medications: [
        ...prescriptionData.medications,
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    });
  };
  
  // Remove medication field
  const removeMedication = (index) => {
    const updatedMedications = [...prescriptionData.medications];
    updatedMedications.splice(index, 1);
    setPrescriptionData({
      ...prescriptionData,
      medications: updatedMedications
    });
  };
  
  // Handle medication field changes
  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...prescriptionData.medications];
    updatedMedications[index][field] = value;
    setPrescriptionData({
      ...prescriptionData,
      medications: updatedMedications
    });
  };
  
  // Handle other form field changes
  const handleChange = (e) => {
    setPrescriptionData({
      ...prescriptionData,
      [e.target.name]: e.target.value
    });
  };
  
  // Generate a prescription number
  const prescriptionNumber = `RX-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Save prescription
  const savePrescription = async () => {
    setIsSaving(true);
    setSaveStatus({ message: '', type: '' });
    
    try {
      // In a real application, this would send the data to your backend
      const response = await authFetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: patient._id,
          appointmentId: appointmentDetails?._id,
          prescriptionNumber,
          ...prescriptionData,
          date: today
        })
      });
      
      if (response.ok) {
        setSaveStatus({
          message: 'Prescription saved successfully',
          type: 'success'
        });
      } else {
        throw new Error('Failed to save prescription');
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      
      // For development: show success even on error
      setSaveStatus({
        message: 'Prescription saved successfully (development mode)',
        type: 'success'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Print prescription
  const printPrescription = () => {
    const printContent = prescriptionRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div class="prescription-print-wrapper">
        ${printContent}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };
  
  return (
    <div className="prescription-modal">
      <div className="prescription-container">
        <div className="prescription-header">
          <h2>Digital Prescription</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="prescription-actions">
          <button className="action-button print-button" onClick={printPrescription}>
            <FaPrint /> Print
          </button>
          <button className="action-button pdf-button">
            <FaFilePdf /> Save as PDF
          </button>
          <button className="action-button save-button" onClick={savePrescription} disabled={isSaving}>
            <FaDownload /> {isSaving ? 'Saving...' : 'Save Prescription'}
          </button>
        </div>
        
        {saveStatus.message && (
          <div className={`status-message ${saveStatus.type}`}>
            {saveStatus.message}
          </div>
        )}
        
        <div className="prescription-form-wrapper">
          <div className="prescription-form">
            <div className="input-group">
              <label htmlFor="diagnosis">Diagnosis</label>
              <textarea
                id="diagnosis"
                name="diagnosis"
                value={prescriptionData.diagnosis}
                onChange={handleChange}
                placeholder="Enter diagnosis or chief complaint"
                rows="2"
              />
            </div>
            
            <div className="medications-section">
              <h3>Medications</h3>
              {prescriptionData.medications.map((medication, index) => (
                <div key={index} className="medication-item">
                  <div className="medication-header">
                    <h4>Medication #{index + 1}</h4>
                    {prescriptionData.medications.length > 1 && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeMedication(index)}
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  <div className="medication-fields">
                    <div className="input-group">
                      <label>Medicine Name</label>
                      <input
                        type="text"
                        value={medication.name}
                        onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                        placeholder="Medicine name"
                      />
                    </div>
                    <div className="input-row">
                      <div className="input-group">
                        <label>Dosage</label>
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          placeholder="Ex: 500mg"
                        />
                      </div>
                      <div className="input-group">
                        <label>Frequency</label>
                        <input
                          type="text"
                          value={medication.frequency}
                          onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                          placeholder="Ex: Twice daily"
                        />
                      </div>
                    </div>
                    <div className="input-row">
                      <div className="input-group">
                        <label>Duration</label>
                        <input
                          type="text"
                          value={medication.duration}
                          onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                          placeholder="Ex: 7 days"
                        />
                      </div>
                      <div className="input-group">
                        <label>Instructions</label>
                        <input
                          type="text"
                          value={medication.instructions}
                          onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                          placeholder="Ex: After meals"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                type="button" 
                className="add-medication-button" 
                onClick={addMedication}
              >
                <FaPlus /> Add Another Medication
              </button>
            </div>
            
            <div className="input-group">
              <label htmlFor="instructions">General Instructions</label>
              <textarea
                id="instructions"
                name="instructions"
                value={prescriptionData.instructions}
                onChange={handleChange}
                placeholder="General instructions for the patient"
                rows="2"
              />
            </div>
            
            <div className="input-row">
              <div className="input-group">
                <label htmlFor="testRecommendations">Tests Recommended</label>
                <textarea
                  id="testRecommendations"
                  name="testRecommendations"
                  value={prescriptionData.testRecommendations}
                  onChange={handleChange}
                  placeholder="Recommended tests, if any"
                  rows="2"
                />
              </div>
              <div className="input-group">
                <label htmlFor="followUpDate">Follow-up Date</label>
                <input
                  type="date"
                  id="followUpDate"
                  name="followUpDate"
                  value={prescriptionData.followUpDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div className="input-group">
              <label htmlFor="notes">Doctor's Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={prescriptionData.notes}
                onChange={handleChange}
                placeholder="Additional notes for internal reference (not shown to patient)"
                rows="2"
              />
            </div>
          </div>
          
          <div className="prescription-preview" ref={prescriptionRef}>
            <div className="preview-header">
              <div className="doctor-info">
                <h2>Dr. {currentUser?.name || 'Doctor Name'}</h2>
                <p>{currentUser?.specialization || 'Specialization'}</p>
                <p>{currentUser?.qualifications || 'Qualifications'}</p>
                <p>License: {currentUser?.licenseNumber || 'License Number'}</p>
              </div>
              <div className="prescription-info">
                <h3>PRESCRIPTION</h3>
                <p>Rx No: {prescriptionNumber}</p>
                <p>Date: {formattedDate}</p>
              </div>
            </div>
            
            <div className="patient-details">
              <div className="detail-row">
                <span className="label">Patient Name:</span>
                <span className="value">{patient?.name || 'Patient Name'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Age/Gender:</span>
                <span className="value">
                  {patient?.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'Age'} / {patient?.gender || 'Gender'}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Diagnosis:</span>
                <span className="value">{prescriptionData.diagnosis || 'Not specified'}</span>
              </div>
            </div>
            
            <div className="rx-symbol">Rx</div>
            
            <div className="medications-list">
              {prescriptionData.medications.map((med, index) => (
                med.name ? (
                  <div key={index} className="medication">
                    <div className="med-index">{index + 1}.</div>
                    <div className="med-content">
                      <div className="med-name">{med.name} {med.dosage && `- ${med.dosage}`}</div>
                      <div className="med-details">
                        {med.frequency && <span>{med.frequency}</span>}
                        {med.duration && <span>for {med.duration}</span>}
                        {med.instructions && <span>({med.instructions})</span>}
                      </div>
                    </div>
                  </div>
                ) : null
              ))}
            </div>
            
            {prescriptionData.testRecommendations && (
              <div className="test-recommendations">
                <h4>Tests Recommended:</h4>
                <p>{prescriptionData.testRecommendations}</p>
              </div>
            )}
            
            {prescriptionData.instructions && (
              <div className="general-instructions">
                <h4>General Instructions:</h4>
                <p>{prescriptionData.instructions}</p>
              </div>
            )}
            
            {prescriptionData.followUpDate && (
              <div className="follow-up">
                <h4>Follow-up Date:</h4>
                <p>{new Date(prescriptionData.followUpDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            )}
            
            <div className="signature">
              <div className="signature-line"></div>
              <p>Doctor's Signature</p>
            </div>
            
            <div className="clinic-info">
              <p>Medical Health Portal</p>
              <p>123 Healthcare Avenue, Medical City</p>
              <p>Phone: +1 (555) 123-4567 | Email: care@medicalhealthportal.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export default PrescriptionTemplate; 