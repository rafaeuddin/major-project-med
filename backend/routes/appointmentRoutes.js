const express = require('express');
const router = express.Router();
const { isAuthenticated, authorize } = require('../middleware/auth');
const appointmentController = require('../controllers/appointment.controller');

/**
 * @route   GET /api/appointments/available-slots
 * @desc    Get available time slots for a doctor on a specific date
 * @access  Public
 */
router.get('/available-slots', appointmentController.getAvailableTimeSlots);

/**
 * @route   POST /api/appointments
 * @desc    Book a new appointment
 * @access  Private (Patient only)
 */
router.post(
  '/',
  isAuthenticated,
  authorize('patient'),
  appointmentController.bookAppointment
);

/**
 * @route   PUT /api/appointments/:id/reschedule
 * @desc    Reschedule an existing appointment
 * @access  Private (Patient or Doctor)
 */
router.put(
  '/:id/reschedule',
  isAuthenticated,
  appointmentController.rescheduleAppointment
);

/**
 * @route   GET /api/appointments/user
 * @desc    Get user's appointments (for both patients and doctors)
 * @access  Private
 */
router.get(
  '/user',
  isAuthenticated,
  appointmentController.getUserAppointments
);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Cancel an appointment
 * @access  Private (Patient or Doctor)
 */
router.delete(
  '/:id',
  isAuthenticated,
  appointmentController.cancelAppointment
);

/**
 * @route   PUT /api/appointments/:id/complete
 * @desc    Mark appointment as completed (only doctors can do this)
 * @access  Private (Doctor only)
 */
router.put(
  '/:id/complete',
  isAuthenticated,
  authorize('doctor'),
  appointmentController.completeAppointment
);

/**
 * @route   PUT /api/appointments/:id/notes
 * @desc    Add/update notes to an appointment (only doctors can do this)
 * @access  Private (Doctor only)
 */
router.put(
  '/:id/notes',
  isAuthenticated,
  authorize('doctor'),
  appointmentController.updateAppointmentNotes
);

module.exports = router; 