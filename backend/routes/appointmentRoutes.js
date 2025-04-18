const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { isAuthenticated, authorize } = require('../middleware/auth');

// Get available time slots
router.get('/slots', async (req, res) => {
  try {
    const { date, doctorId } = req.query;
    
    if (!date || !doctorId) {
      return res.status(400).json({ message: 'Date and doctor ID are required' });
    }

    // Convert the date string to a Date object
    const selectedDate = new Date(date);
    
    // Find all appointments for the specified doctor and date
    const existingAppointments = await Appointment.find({
      doctorId,
      date: {
        $gte: new Date(selectedDate.setHours(0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59))
      }
    });

    // Get the time slots of existing appointments
    const bookedTimeSlots = existingAppointments.map(appointment => appointment.timeSlot);
    
    // Define all available time slots
    const allTimeSlots = [
      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
    ];
    
    // Filter out the booked time slots
    const availableTimeSlots = allTimeSlots.filter(slot => !bookedTimeSlots.includes(slot));
    
    res.status(200).json({ availableTimeSlots });
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Book an appointment
router.post('/book', isAuthenticated, async (req, res) => {
  try {
    const { doctorId, date, timeSlot, reason } = req.body;
    const patientId = req.user._id; // Retrieved from auth middleware
    
    if (!doctorId || !date || !timeSlot || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if the time slot is available
    const selectedDate = new Date(date);
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: {
        $gte: new Date(selectedDate.setHours(0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59))
      },
      timeSlot
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    // Create and save the new appointment
    const newAppointment = new Appointment({
      patientId,
      doctorId,
      date: selectedDate,
      timeSlot,
      reason
    });

    await newAppointment.save();

    // Send notification (email/SMS) - implementation depends on your notification system
    // sendAppointmentConfirmation(patientId, doctorId, date, timeSlot);

    res.status(201).json({ 
      message: 'Appointment booked successfully',
      appointment: newAppointment 
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reschedule an appointment
router.put('/reschedule/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, timeSlot } = req.body;
    const userId = req.user._id;
    
    if (!date || !timeSlot) {
      return res.status(400).json({ message: 'New date and time slot are required' });
    }

    // Find the appointment
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if the user is the patient or the doctor
    if (!appointment.patientId.equals(userId) && !appointment.doctorId.equals(userId)) {
      return res.status(403).json({ message: 'Not authorized to reschedule this appointment' });
    }

    // Check if the new time slot is available
    const selectedDate = new Date(date);
    const existingAppointment = await Appointment.findOne({
      _id: { $ne: id }, // Exclude the current appointment
      doctorId: appointment.doctorId,
      date: {
        $gte: new Date(selectedDate.setHours(0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59))
      },
      timeSlot
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    // Update the appointment
    appointment.date = selectedDate;
    appointment.timeSlot = timeSlot;
    appointment.status = 'rescheduled';
    
    await appointment.save();

    // Send notification about the rescheduled appointment
    // sendRescheduledAppointmentNotification(appointment);

    res.status(200).json({ 
      message: 'Appointment rescheduled successfully',
      appointment 
    });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's appointments (for both patients and doctors)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const { role } = req.user;
    
    // Define query based on user role
    const query = role === 'doctor' 
      ? { doctorId: userId } 
      : { patientId: userId };
    
    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .sort({ date: 1 });
    
    res.status(200).json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel an appointment
router.put('/cancel/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the appointment
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if the user is the patient or the doctor
    if (!appointment.patientId.equals(userId) && !appointment.doctorId.equals(userId)) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    // Update the appointment status
    appointment.status = 'cancelled';
    await appointment.save();

    // Send notification about the cancelled appointment
    // sendCancelledAppointmentNotification(appointment);

    res.status(200).json({ 
      message: 'Appointment cancelled successfully',
      appointment 
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark appointment as completed (only doctors can do this)
router.put('/complete/:id', isAuthenticated, authorize('doctor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    // Find the appointment
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if doctor is authorized for this appointment
    if (!appointment.doctorId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to complete this appointment' });
    }

    // Update appointment
    appointment.status = 'completed';
    if (notes) {
      appointment.notes = notes;
    }
    
    await appointment.save();

    res.status(200).json({
      message: 'Appointment marked as completed',
      appointment
    });
  } catch (error) {
    console.error('Error completing appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add/update notes to an appointment (only doctors can do this)
router.put('/:id/notes', isAuthenticated, authorize('doctor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    if (!notes) {
      return res.status(400).json({ message: 'Notes are required' });
    }
    
    // Find the appointment
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if doctor is authorized for this appointment
    if (!appointment.doctorId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to add notes to this appointment' });
    }

    // Update appointment notes
    appointment.notes = notes;
    await appointment.save();

    res.status(200).json({
      message: 'Appointment notes updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Error updating appointment notes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 