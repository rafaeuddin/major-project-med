const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

/**
 * @desc    Get all medical records for a patient
 * @route   GET /api/medical-records/patient/:id
 * @access  Private (doctors and the patient themselves)
 */
exports.getPatientMedicalRecords = async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Check if user is authorized to view these records
    // Only the patient themselves or doctors can view records
    if (req.user.role !== 'doctor' && req.user.id !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these medical records'
      });
    }

    const medicalRecords = await MedicalRecord.find({ patientId })
      .sort({ recordDate: -1 })
      .populate('createdBy', 'name role specialization');
    
    return res.json({
      success: true,
      data: medicalRecords
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not retrieve medical records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get a specific medical record by ID
 * @route   GET /api/medical-records/:id
 * @access  Private (doctors and the patient themselves)
 */
exports.getMedicalRecord = async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id)
      .populate('createdBy', 'name role specialization')
      .populate('patientId', 'name');
    
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }
    
    // Check if user is authorized to view this record
    if (req.user.role !== 'doctor' && req.user.id !== medicalRecord.patientId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this medical record'
      });
    }
    
    return res.json({
      success: true,
      data: medicalRecord
    });
  } catch (error) {
    console.error('Error fetching medical record:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not retrieve medical record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Create a new medical record
 * @route   POST /api/medical-records
 * @access  Private (doctors only)
 */
exports.createMedicalRecord = async (req, res) => {
  try {
    // Check if user is authorized to create records (only doctors)
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create medical records'
      });
    }
    
    // Create the record
    const medicalRecord = await MedicalRecord.create({
      ...req.body,
      createdBy: req.user.id
    });
    
    return res.status(201).json({
      success: true,
      data: medicalRecord
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not create medical record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update a medical record
 * @route   PUT /api/medical-records/:id
 * @access  Private (doctors only)
 */
exports.updateMedicalRecord = async (req, res) => {
  try {
    // Check if user is authorized to update records (only doctors)
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update medical records'
      });
    }
    
    const medicalRecord = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }
    
    return res.json({
      success: true,
      data: medicalRecord
    });
  } catch (error) {
    console.error('Error updating medical record:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not update medical record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete a medical record
 * @route   DELETE /api/medical-records/:id
 * @access  Private (doctors only)
 */
exports.deleteMedicalRecord = async (req, res) => {
  try {
    // Check if user is authorized to delete records (only doctors)
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete medical records'
      });
    }
    
    const medicalRecord = await MedicalRecord.findByIdAndDelete(req.params.id);
    
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }
    
    return res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not delete medical record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get medical summary for a patient (for chatbot use)
 * @route   GET /api/medical-records/summary/:id
 * @access  Private (patient themselves, doctors, and system)
 */
exports.getPatientMedicalSummary = async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Security check
    if (req.user.role !== 'doctor' && req.user.id !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this medical summary'
      });
    }

    // Get the patient details
    const patient = await User.findById(patientId).select('-password');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get all medical records
    const medicalRecords = await MedicalRecord.find({ patientId })
      .sort({ recordDate: -1 })
      .populate('createdBy', 'name specialization');
    
    // Get recent appointments
    const recentAppointments = await Appointment.find({ 
      patientId,
      status: { $in: ['completed', 'scheduled'] } 
    })
      .sort({ date: -1 })
      .limit(5)
      .populate('doctorId', 'name specialization');

    // Analyze records to create summary
    const activeConditions = medicalRecords.filter(
      record => record.recordType === 'diagnosis' && 
                record.diagnosisDetails?.status === 'active'
    );
    
    const allergies = medicalRecords.filter(
      record => record.recordType === 'allergy' && 
                record.allergyDetails?.status === 'active'
    );
    
    const medications = medicalRecords.filter(
      record => record.recordType === 'prescription' && 
                record.medicationDetails?.endDate > new Date()
    );

    // Create a comprehensive summary
    const summary = {
      patient: {
        name: patient.name,
        age: calculateAge(patient.dateOfBirth), // This would need the DOB field added to User schema
        emergencyContact: patient.emergencyContact
      },
      activeConditions: activeConditions.map(c => ({
        condition: c.diagnosisDetails?.condition,
        severity: c.diagnosisDetails?.severity,
        dateIdentified: c.recordDate
      })),
      allergies: allergies.map(a => ({
        allergen: a.allergyDetails?.allergen,
        reaction: a.allergyDetails?.reaction,
        severity: a.allergyDetails?.severity
      })),
      currentMedications: medications.map(m => ({
        name: m.medicationDetails?.name,
        dosage: m.medicationDetails?.dosage,
        frequency: m.medicationDetails?.frequency
      })),
      recentAppointments: recentAppointments.map(a => ({
        date: a.date,
        doctor: a.doctorId?.name,
        specialization: a.doctorId?.specialization,
        reason: a.reason,
        status: a.status,
        notes: a.notes
      }))
    };
    
    return res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching medical summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not retrieve medical summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to calculate age from DOB
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}; 