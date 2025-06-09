require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Import routes
const appointmentRoutes = require('./routes/appointmentRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan('dev'));

// Mock data for development environment
if (process.env.NODE_ENV === 'development') {
  console.log('DEVELOPMENT MODE: Using mock data instead of MongoDB');
  
  // Sample test patients
  const testPatients = [
    {
      _id: 'patient1',
      name: 'Emily Johnson',
      email: 'emily@example.com',
      phone: '+1234567890',
      dateOfBirth: '1992-05-15',
      gender: 'female',
      address: '456 Park Avenue, New York, NY',
      bloodType: 'A+',
      allergies: 'Penicillin',
      chronicConditions: 'Asthma',
      medications: 'Albuterol inhaler'
    },
    {
      _id: 'patient2',
      name: 'Michael Williams',
      email: 'michael@example.com',
      phone: '+1987654321',
      dateOfBirth: '1985-09-28',
      gender: 'male',
      address: '789 Oak Street, Chicago, IL',
      bloodType: 'O-',
      allergies: 'None',
      chronicConditions: 'Hypertension',
      medications: 'Lisinopril 10mg daily'
    },
    {
      _id: 'patient3',
      name: 'Sarah Thompson',
      email: 'sarah@example.com',
      phone: '+1122334455',
      dateOfBirth: '1998-02-10',
      gender: 'female',
      address: '123 Maple Drive, San Francisco, CA',
      bloodType: 'B+',
      allergies: 'Shellfish',
      chronicConditions: 'None',
      medications: 'None'
    }
  ];
  
  // Sample test appointments
  const testAppointments = [
    {
      _id: 'apt1',
      patientId: testPatients[0],
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      timeSlot: '10:00 AM',
      status: 'scheduled',
      reason: 'Follow-up on asthma treatment',
      notes: '',
      createdAt: new Date(Date.now() - 604800000) // A week ago
    },
    {
      _id: 'apt2',
      patientId: testPatients[1],
      date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
      timeSlot: '2:30 PM',
      status: 'scheduled',
      reason: 'Blood pressure check',
      notes: '',
      createdAt: new Date(Date.now() - 345600000) // 4 days ago
    },
    {
      _id: 'apt3',
      patientId: testPatients[2],
      date: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days from now
      timeSlot: '9:15 AM',
      status: 'scheduled',
      reason: 'Annual check-up',
      notes: '',
      createdAt: new Date(Date.now() - 172800000) // 2 days ago
    },
    {
      _id: 'apt4',
      patientId: testPatients[0],
      date: new Date(Date.now() - 604800000).toISOString().split('T')[0], // A week ago
      timeSlot: '11:30 AM',
      status: 'completed',
      reason: 'Respiratory infection',
      notes: 'Patient presented with symptoms of upper respiratory infection. Prescribed antibiotics for 7 days.',
      createdAt: new Date(Date.now() - 1209600000) // 2 weeks ago
    },
    {
      _id: 'apt5',
      patientId: testPatients[1],
      date: new Date(Date.now() - 345600000).toISOString().split('T')[0], // 4 days ago
      timeSlot: '3:45 PM',
      status: 'completed',
      reason: 'Medication review',
      notes: 'Adjusted blood pressure medication dosage. Follow-up in 1 month.',
      createdAt: new Date(Date.now() - 1036800000) // 12 days ago
    }
  ];
  
  // Mock doctor login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // For demonstration, allow any login with a simple password check
    if (password === 'password') {
      if (email.includes('doctor')) {
        res.json({
          success: true,
          token: 'mock-token-for-doctor',
          user: {
            _id: 'doctor1',
            name: 'Dr. Alex Smith',
            email: email,
            role: 'doctor',
            specialization: 'General Medicine',
            qualifications: 'MD, MBBS',
            licenseNumber: 'MD12345'
          }
        });
      } else {
        res.json({
          success: true,
          token: 'mock-token-for-patient',
          user: {
            _id: 'patient123',
            name: 'John Doe',
            email: email,
            role: 'patient',
            dateOfBirth: '1990-01-01',
            gender: 'male'
          }
        });
      }
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  });
  
  // Mock appointments data for doctor
  app.get('/api/appointments', (req, res) => {
    // This would normally check the authenticated user's ID
    // but for testing, we'll just return all test appointments
    res.json({
      success: true,
      appointments: testAppointments
    });
  });
  
  // Mock patient profile data
  app.get('/api/patients/profile', (req, res) => {
    res.json({
      name: 'John Doe',
      email: 'patient@example.com',
      phone: '+1234567890',
      dateOfBirth: '1990-01-01',
      address: '123 Main St, Anytown, USA',
      gender: 'male',
      bloodType: 'O+',
      allergies: 'None',
      chronicConditions: 'None',
      medications: 'None',
      emergencyContacts: [
        { name: 'Jane Doe', relationship: 'Spouse', phone: '+1987654321' }
      ],
      medicalHistory: [
        {
          title: 'Annual Checkup',
          description: 'Regular health examination, all vitals normal',
          date: '2023-10-15',
          doctorName: 'Smith'
        }
      ],
      documents: [
        {
          id: 'doc1',
          fileName: 'Blood Test Results.pdf',
          documentType: 'test_report',
          uploadDate: '2023-09-10',
          fileUrl: '#',
          fileType: 'pdf'
        },
        {
          id: 'doc2',
          fileName: 'X-Ray Image.jpg',
          documentType: 'xray',
          uploadDate: '2023-08-20',
          fileUrl: '#',
          fileType: 'jpg'
        }
      ]
    });
  });
  
  // Mock appointments data for patients
  app.get('/api/appointments/user', (req, res) => {
    res.json({
      appointments: [
        {
          id: 'apt1',
          doctorId: 'doc1',
          doctorName: 'Dr. Sarah Johnson',
          date: '2025-04-25',
          timeSlot: '10:00 AM',
<<<<<<< HEAD
          status: 'confirmed',
=======
          status: 'scheduled',
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
          reason: 'Annual checkup',
          createdAt: '2025-04-10'
        },
        {
          id: 'apt2',
          doctorId: 'doc2',
          doctorName: 'Dr. Michael Chen',
          date: '2025-05-05',
          timeSlot: '2:30 PM',
<<<<<<< HEAD
          status: 'pending',
=======
          status: 'scheduled',
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
          reason: 'Follow-up appointment',
          createdAt: '2025-04-12'
        }
      ]
    });
  });
  
<<<<<<< HEAD
=======
  // Mock appointment cancellation endpoint
  app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    
    // Find the appointment in the mock data
    const appointmentIndex = testAppointments.findIndex(apt => apt._id === id);
    
    if (appointmentIndex !== -1) {
      // Update the appointment status to cancelled
      testAppointments[appointmentIndex].status = 'cancelled';
      
      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        appointment: testAppointments[appointmentIndex]
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
  });
  
>>>>>>> 0f73f305686331e3366027683e38750020b6bba4
  // Mock nutrition data
  app.get('/api/food/nutrition/summary', (req, res) => {
    res.json({
      success: true,
      data: {
        overallSummary: {
          avgCalories: 2100,
          avgProteins: 85,
          avgCarbs: 220,
          avgFats: 70,
          avgWaterIntake: 2200
        },
        dailySummaries: [
          {
            date: '2025-04-18',
            totalCalories: 2200,
            totalProteins: 90,
            totalCarbs: 230,
            totalFats: 75
          },
          {
            date: '2025-04-17',
            totalCalories: 2050,
            totalProteins: 82,
            totalCarbs: 210,
            totalFats: 68
          }
        ]
      }
    });
  });
  
  // Mock prescriptions API
  app.post('/api/prescriptions', (req, res) => {
    // Log the prescription data for debugging
    console.log('Prescription data received:', req.body);
    
    // In a real app, you would save this to the database
    // For development, just return a success response
    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: {
        id: `rx-${Date.now()}`,
        ...req.body,
        createdAt: new Date()
      }
    });
  });
  
  // Get prescriptions for a patient
  app.get('/api/prescriptions/patient/:patientId', (req, res) => {
    const patientId = req.params.patientId;
    // In a real app, you would query the database
    res.json({
      success: true,
      data: [
        {
          id: 'rx-1',
          prescriptionNumber: 'RX-20250419-1234',
          patientId: patientId,
          doctorId: 'doc1',
          doctorName: 'Dr. Sarah Johnson',
          date: '2025-04-19',
          diagnosis: 'Common cold',
          medications: [
            {
              name: 'Acetaminophen',
              dosage: '500mg',
              frequency: 'Every 6 hours',
              duration: '5 days',
              instructions: 'Take with food'
            }
          ],
          instructions: 'Rest and drink plenty of fluids',
          createdAt: '2025-04-19T12:00:00.000Z'
        }
      ]
    });
  });
  
  // Mock endpoints for doctor functionality
  app.put('/api/appointments/complete/:appointmentId', (req, res) => {
    const { appointmentId } = req.params;
    const { notes } = req.body;
    
    // Locate and update the appointment in our test data
    const appointmentIndex = testAppointments.findIndex(apt => apt._id === appointmentId);
    if (appointmentIndex !== -1) {
      testAppointments[appointmentIndex].status = 'completed';
      testAppointments[appointmentIndex].notes = notes;
      
      res.json({
        success: true,
        message: 'Appointment marked as completed',
        appointment: testAppointments[appointmentIndex]
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
  });
  
  app.put('/api/appointments/:appointmentId/notes', (req, res) => {
    const { appointmentId } = req.params;
    const { notes } = req.body;
    
    // Locate and update the appointment in our test data
    const appointmentIndex = testAppointments.findIndex(apt => apt._id === appointmentId);
    if (appointmentIndex !== -1) {
      testAppointments[appointmentIndex].notes = notes;
      
      res.json({
        success: true,
        message: 'Appointment notes updated',
        appointment: testAppointments[appointmentIndex]
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
  });
} else {
  // Connect to MongoDB in non-development environments
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-portal', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// Routes
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/medical-records', medicalRecordRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An error occurred on the server',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app; 