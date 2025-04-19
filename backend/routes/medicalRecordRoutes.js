const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getPatientMedicalRecords,
  getMedicalRecord,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getPatientMedicalSummary
} = require('../controllers/medicalRecord.controller');

// All routes require authentication
router.use(protect);

// Get all medical records for a patient
router.get('/patient/:id', getPatientMedicalRecords);

// Get medical summary for a patient (used by chatbot)
router.get('/summary/:id', getPatientMedicalSummary);

// CRUD operations for individual records
router.get('/:id', getMedicalRecord);
router.post('/', createMedicalRecord);
router.put('/:id', updateMedicalRecord);
router.delete('/:id', deleteMedicalRecord);

module.exports = router; 