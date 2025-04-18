const nodemailer = require('nodemailer');
// You can use any SMS service like Twilio
// const twilio = require('twilio');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Configure SMS client (if using Twilio)
// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send appointment confirmation email
const sendAppointmentConfirmationEmail = async (patient, doctor, appointment) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: patient.email,
      subject: 'Appointment Confirmation',
      html: `
        <h2>Your appointment has been confirmed!</h2>
        <p>Dear ${patient.name},</p>
        <p>Your appointment with Dr. ${doctor.name} is scheduled for:</p>
        <p><strong>Date:</strong> ${appointment.date.toDateString()}</p>
        <p><strong>Time:</strong> ${appointment.timeSlot}</p>
        <p><strong>Reason:</strong> ${appointment.reason}</p>
        <p>Please arrive 15 minutes before your scheduled appointment time.</p>
        <p>If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
        <p>Thank you!</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Appointment confirmation email sent to ${patient.email}`);
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
  }
};

// Send appointment reminder email
const sendAppointmentReminderEmail = async (patient, doctor, appointment) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: patient.email,
      subject: 'Appointment Reminder',
      html: `
        <h2>Appointment Reminder</h2>
        <p>Dear ${patient.name},</p>
        <p>This is a reminder that you have an appointment with Dr. ${doctor.name} tomorrow:</p>
        <p><strong>Date:</strong> ${appointment.date.toDateString()}</p>
        <p><strong>Time:</strong> ${appointment.timeSlot}</p>
        <p>Please arrive 15 minutes before your scheduled appointment time.</p>
        <p>If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
        <p>Thank you!</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Appointment reminder email sent to ${patient.email}`);
  } catch (error) {
    console.error('Error sending appointment reminder email:', error);
  }
};

// Send appointment reschedule notification
const sendRescheduledAppointmentNotification = async (patient, doctor, appointment, oldDate, oldTimeSlot) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: patient.email,
      subject: 'Appointment Rescheduled',
      html: `
        <h2>Your appointment has been rescheduled!</h2>
        <p>Dear ${patient.name},</p>
        <p>Your appointment with Dr. ${doctor.name} has been rescheduled from:</p>
        <p><strong>Old Date:</strong> ${new Date(oldDate).toDateString()}</p>
        <p><strong>Old Time:</strong> ${oldTimeSlot}</p>
        <p>To:</p>
        <p><strong>New Date:</strong> ${appointment.date.toDateString()}</p>
        <p><strong>New Time:</strong> ${appointment.timeSlot}</p>
        <p>Please arrive 15 minutes before your scheduled appointment time.</p>
        <p>If you need to make any changes, please do so at least 24 hours in advance.</p>
        <p>Thank you!</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Appointment reschedule notification sent to ${patient.email}`);
  } catch (error) {
    console.error('Error sending appointment reschedule notification:', error);
  }
};

// Send appointment cancellation notification
const sendCancelledAppointmentNotification = async (patient, doctor, appointment) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: patient.email,
      subject: 'Appointment Cancelled',
      html: `
        <h2>Your appointment has been cancelled</h2>
        <p>Dear ${patient.name},</p>
        <p>Your appointment with Dr. ${doctor.name} scheduled for:</p>
        <p><strong>Date:</strong> ${appointment.date.toDateString()}</p>
        <p><strong>Time:</strong> ${appointment.timeSlot}</p>
        <p>has been cancelled.</p>
        <p>If you would like to reschedule, please book a new appointment at your convenience.</p>
        <p>Thank you!</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Appointment cancellation notification sent to ${patient.email}`);
  } catch (error) {
    console.error('Error sending appointment cancellation notification:', error);
  }
};

// Send appointment SMS reminder
// const sendAppointmentSMSReminder = async (patient, doctor, appointment) => {
//   try {
//     const message = await twilioClient.messages.create({
//       body: `Reminder: You have an appointment with Dr. ${doctor.name} on ${appointment.date.toDateString()} at ${appointment.timeSlot}.`,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: patient.phone
//     });
//
//     console.log(`Appointment SMS reminder sent to ${patient.phone}, SID: ${message.sid}`);
//   } catch (error) {
//     console.error('Error sending appointment SMS reminder:', error);
//   }
// };

module.exports = {
  sendAppointmentConfirmationEmail,
  sendAppointmentReminderEmail,
  sendRescheduledAppointmentNotification,
  sendCancelledAppointmentNotification,
  // sendAppointmentSMSReminder
}; 