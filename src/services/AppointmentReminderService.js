import { differenceInHours, differenceInMinutes, addDays } from 'date-fns';
import notificationService from './NotificationService';

class AppointmentReminderService {
  constructor() {
    this.reminders = new Map();
    this.reminderIntervals = [];
    this.initialized = false;
  }

  /**
   * Initialize the reminder service for the current user
   * @param {Object} currentUser - The logged in user
   * @param {Array} appointments - List of user's appointments
   */
  initialize(currentUser, appointments) {
    if (!currentUser || !appointments || !appointments.length) return;
    
    this.clearAllReminders(); // Clear any existing reminders
    
    // Schedule reminders for all upcoming appointments
    appointments.forEach(appointment => {
      if (this.isUpcomingAppointment(appointment)) {
        this.scheduleReminders(appointment, currentUser.role);
      }
    });
    
    this.initialized = true;
    console.log(`Initialized appointment reminders for ${currentUser.role}: ${currentUser.name}`);
    
    // Setup periodic check (every 5 minutes) to ensure reminders are still active
    const periodicCheck = setInterval(() => {
      if (appointments.some(apt => this.isUpcomingAppointment(apt))) {
        console.log('Periodic check: Reminders active');
      } else {
        console.log('Periodic check: No upcoming appointments, clearing reminders');
        this.clearAllReminders();
        clearInterval(periodicCheck);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    this.reminderIntervals.push(periodicCheck);
  }

  /**
   * Check if an appointment is in the future
   * @param {Object} appointment - Appointment to check
   * @returns {Boolean} True if appointment is upcoming
   */
  isUpcomingAppointment(appointment) {
    if (!appointment || !appointment.date || !appointment.timeSlot) return false;
    
    // Check if appointment is active/scheduled (not cancelled)
    if (appointment.status === 'cancelled') return false;
    
    const appointmentDateTime = this.parseAppointmentDateTime(appointment);
    const now = new Date();
    
    return appointmentDateTime > now;
  }

  /**
   * Parse appointment date and time into a Date object
   * @param {Object} appointment - Appointment object with date and timeSlot
   * @returns {Date} Combined date and time as Date object
   */
  parseAppointmentDateTime(appointment) {
    const appointmentDate = new Date(appointment.date);
    const timeSlot = appointment.timeSlot;
    
    // Parse timeSlot (format example: "10:00 AM")
    const [time, period] = timeSlot.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    // Convert to 24-hour format
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    appointmentDate.setHours(hours, minutes, 0, 0);
    return appointmentDate;
  }

  /**
   * Schedule reminders for an appointment
   * @param {Object} appointment - The appointment to schedule reminders for
   * @param {String} userRole - The role of the current user (doctor or patient)
   */
  scheduleReminders(appointment, userRole) {
    if (!appointment || !userRole) return;
    
    const appointmentId = appointment._id;
    const appointmentDateTime = this.parseAppointmentDateTime(appointment);
    const now = new Date();
    
    // Define reminder times (hours before appointment)
    const reminderTimes = [
      { hours: 24, message: '24 hours' },   // 1 day before
      { hours: 2, message: '2 hours' },     // 2 hours before
      { hours: 0.5, message: '30 minutes' } // 30 minutes before
    ];
    
    // Schedule each reminder
    reminderTimes.forEach(({ hours, message }) => {
      const reminderTime = new Date(appointmentDateTime.getTime() - (hours * 60 * 60 * 1000));
      
      // Skip if reminder time is in the past
      if (reminderTime <= now) return;
      
      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      
      // Create a unique ID for each reminder
      const reminderId = `${appointmentId}-${hours}`;
      
      // Schedule the reminder
      const timerId = setTimeout(() => {
        // Create and display the notification
        const reminderNotification = notificationService.createAppointmentReminder(
          appointment, 
          userRole
        );
        
        // Add custom message about how much time is left
        reminderNotification.message += ` (${message} from now)`;
        
        notificationService.addNotification(reminderNotification);
        
        // Remove from tracked reminders
        this.reminders.delete(reminderId);
      }, timeUntilReminder);
      
      // Store the reminder
      this.reminders.set(reminderId, {
        timerId,
        appointmentId,
        reminderTime,
        appointment
      });
      
      console.log(`Scheduled ${message} reminder for appointment on ${appointmentDateTime.toLocaleString()}`);
    });
  }

  /**
   * Add a new appointment reminder
   * @param {Object} appointment - The new appointment
   * @param {String} userRole - User role (doctor or patient)
   */
  addAppointmentReminder(appointment, userRole) {
    if (!this.isUpcomingAppointment(appointment)) return;
    
    this.scheduleReminders(appointment, userRole);
  }

  /**
   * Remove all reminders for a specific appointment
   * @param {String} appointmentId - ID of the appointment
   */
  removeAppointmentReminders(appointmentId) {
    // Find all reminders for this appointment
    for (const [reminderId, reminder] of this.reminders.entries()) {
      if (reminder.appointmentId === appointmentId) {
        // Clear the timeout
        clearTimeout(reminder.timerId);
        // Remove from map
        this.reminders.delete(reminderId);
      }
    }
  }

  /**
   * Update reminders when appointment is updated
   * @param {Object} updatedAppointment - The updated appointment 
   * @param {String} userRole - User role
   */
  updateAppointmentReminders(updatedAppointment, userRole) {
    // Remove existing reminders
    this.removeAppointmentReminders(updatedAppointment._id);
    
    // Schedule new reminders if appointment is still upcoming
    if (this.isUpcomingAppointment(updatedAppointment)) {
      this.scheduleReminders(updatedAppointment, userRole);
    }
  }

  /**
   * Clear all scheduled reminders
   */
  clearAllReminders() {
    // Clear all timeouts
    for (const [_, reminder] of this.reminders.entries()) {
      clearTimeout(reminder.timerId);
    }
    
    // Clear all interval checks
    this.reminderIntervals.forEach(intervalId => clearInterval(intervalId));
    
    // Reset storage
    this.reminders = new Map();
    this.reminderIntervals = [];
    this.initialized = false;
  }
}

// Create a singleton instance
const appointmentReminderService = new AppointmentReminderService();

export default appointmentReminderService; 