require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-portal', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define fake data
const doctors = [
  {
    name: 'Dr. John Smith',
    email: 'john.smith@example.com',
    password: 'password123',
    phone: '123-456-7890',
    role: 'doctor',
    specialization: 'Cardiology'
  },
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@example.com',
    password: 'password123',
    phone: '123-456-7891',
    role: 'doctor',
    specialization: 'Neurology'
  },
  {
    name: 'Dr. Michael Lee',
    email: 'michael.lee@example.com',
    password: 'password123',
    phone: '123-456-7892',
    role: 'doctor',
    specialization: 'Pediatrics'
  },
  {
    name: 'Dr. Emily Wilson',
    email: 'emily.wilson@example.com',
    password: 'password123',
    phone: '123-456-7893',
    role: 'doctor',
    specialization: 'Dermatology'
  }
];

const patients = [
  {
    name: 'Alex Thompson',
    email: 'alex@example.com',
    password: 'password123',
    phone: '234-567-8901',
    role: 'patient',
    emergencyContact: {
      name: 'Jane Thompson',
      phone: '234-567-8902',
      relationship: 'Spouse'
    }
  },
  {
    name: 'Olivia Martinez',
    email: 'olivia@example.com',
    password: 'password123',
    phone: '234-567-8903',
    role: 'patient',
    emergencyContact: {
      name: 'Robert Martinez',
      phone: '234-567-8904',
      relationship: 'Father'
    }
  },
  {
    name: 'William Chen',
    email: 'william@example.com',
    password: 'password123',
    phone: '234-567-8905',
    role: 'patient',
    emergencyContact: {
      name: 'Linda Chen',
      phone: '234-567-8906',
      relationship: 'Mother'
    }
  },
  {
    name: 'Sophia Davis',
    email: 'sophia@example.com',
    password: 'password123',
    phone: '234-567-8907',
    role: 'patient',
    emergencyContact: {
      name: 'Thomas Davis',
      phone: '234-567-8908',
      relationship: 'Brother'
    }
  }
];

const admin = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123',
  phone: '345-678-9012',
  role: 'admin'
};

// Function to create appointments
const createAppointments = async (patientIds, doctorIds) => {
  const appointments = [];
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
  ];
  
  const statuses = ['scheduled', 'completed', 'cancelled', 'rescheduled'];
  const reasons = [
    'Regular check-up',
    'Follow-up appointment',
    'Consultation for new symptoms',
    'Annual physical examination',
    'Prescription renewal',
    'Vaccination'
  ];

  // Create upcoming appointments for the next 14 days
  for (let i = 0; i < 20; i++) {
    const patientId = patientIds[Math.floor(Math.random() * patientIds.length)];
    const doctorId = doctorIds[Math.floor(Math.random() * doctorIds.length)];
    
    // Random date within the next 14 days
    const daysToAdd = Math.floor(Math.random() * 14) + 1;
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      i--; // Try again with a new date
      continue;
    }
    
    const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
    
    // Mostly scheduled, some other statuses
    const status = Math.random() < 0.7 
      ? 'scheduled' 
      : statuses[Math.floor(Math.random() * statuses.length)];
    
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    
    appointments.push({
      patientId,
      doctorId,
      date,
      timeSlot,
      status,
      reason,
      notes: status === 'completed' ? 'Patient responded well to treatment.' : ''
    });
  }
  
  return appointments;
};

// Seed database
const seedDatabase = async () => {
  try {
    // Clear database
    await User.deleteMany({});
    await Appointment.deleteMany({});
    
    console.log('Database cleared');
    
    // Insert admin
    await User.create(admin);
    console.log('Admin user created');
    
    // Insert doctors
    const createdDoctors = await User.insertMany(doctors);
    console.log('Doctors created');
    
    // Insert patients
    const createdPatients = await User.insertMany(patients);
    console.log('Patients created');
    
    // Extract IDs for appointment creation
    const patientIds = createdPatients.map(patient => patient._id);
    const doctorIds = createdDoctors.map(doctor => doctor._id);
    
    // Create and insert appointments
    const appointments = await createAppointments(patientIds, doctorIds);
    await Appointment.insertMany(appointments);
    console.log('Appointments created');
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Run the seeding
seedDatabase(); 