const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordType: {
    type: String,
    enum: ['diagnosis', 'prescription', 'labResult', 'allergy', 'surgery', 'vaccination', 'chronicCondition', 'consultation'],
    required: true
  },
  recordDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: Object,
    default: {}
  },
  // Additional fields for specific record types
  diagnosisDetails: {
    condition: String,
    symptoms: [String],
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'chronic', 'recurring']
    }
  },
  medicationDetails: {
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    prescribedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  allergyDetails: {
    allergen: String,
    reaction: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'life-threatening']
    },
    status: {
      type: String,
      enum: ['active', 'inactive']
    }
  },
  // Track who created this record
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
medicalRecordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create model
const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

module.exports = MedicalRecord; 