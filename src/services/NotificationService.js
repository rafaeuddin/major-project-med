import { format } from 'date-fns';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.subscribers = [];
    this.permission = this.checkPermission();
  }

  // Get notification permission
  checkPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return 'denied';
    }
    return Notification.permission;
  }

  // Request permission for notifications
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Show a browser notification
  showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/logo192.png', // Add your app logo path here
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) options.onClick();
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Add a notification to the in-app notification center
  addNotification(notification) {
    const newNotification = {
      id: Date.now(),
      createdAt: new Date(),
      read: false,
      ...notification
    };

    this.notifications = [newNotification, ...this.notifications];
    this.notifySubscribers();

    // Also show browser notification if permission granted
    if (this.permission === 'granted' && notification.showBrowser !== false) {
      this.showNotification(notification.title, {
        body: notification.message,
        onClick: notification.onClick
      });
    }

    return newNotification.id;
  }

  // Create an appointment reminder
  createAppointmentReminder(appointment, userRole) {
    const appointmentDate = new Date(appointment.date);
    const formattedDate = format(appointmentDate, 'EEEE, MMMM d, yyyy');
    const isDoctor = userRole === 'doctor';
    
    const personName = isDoctor 
      ? appointment.patientId?.name || 'A patient' 
      : appointment.doctorId?.name || 'Your doctor';
    
    const title = `Appointment Reminder`;
    const message = `You have an appointment ${isDoctor ? 'with' : 'scheduled with'} ${personName} on ${formattedDate} at ${appointment.timeSlot}.`;
    
    return {
      id: Date.now(),
      type: 'appointment_reminder',
      title,
      message,
      appointmentId: appointment._id,
      createdAt: new Date(),
      read: false,
      onClick: () => {
        window.location.href = isDoctor ? '/doctor-dashboard' : '/patient-dashboard';
      }
    };
  }

  // Get all notifications
  getNotifications() {
    return [...this.notifications];
  }

  // Get unread notifications
  getUnreadNotifications() {
    return this.notifications.filter(notification => !notification.read);
  }

  // Mark notification as read
  markAsRead(notificationId) {
    this.notifications = this.notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true } 
        : notification
    );
    this.notifySubscribers();
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications = this.notifications.map(notification => ({ 
      ...notification, 
      read: true 
    }));
    this.notifySubscribers();
  }

  // Subscribe to notifications changes
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Notify all subscribers of changes
  notifySubscribers() {
    for (const callback of this.subscribers) {
      callback(this.getNotifications());
    }
  }
}

// Create a singleton instance
const notificationService = new NotificationService();

export default notificationService; 