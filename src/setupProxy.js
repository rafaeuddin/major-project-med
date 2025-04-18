const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Only set up the mock API in development mode
  if (process.env.NODE_ENV === 'development') {
    // Setup a mock API middleware
    app.use('/api', (req, res, next) => {
      // Check if we're using a test account (look for test_token in Authorization header)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer test_token_')) {
        // This is a test account, send mock responses
        handleMockApi(req, res);
      } else {
        // Not a test account, proxy to real backend
        next();
      }
    });
  }

  // Proxy all other API requests to your backend server
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000', // Your backend URL
      changeOrigin: true,
    })
  );
};

// Mock API response handler
function handleMockApi(req, res) {
  const path = req.path;
  const method = req.method;

  console.log(`Mock API: ${method} ${path}`);

  // Patient Appointments
  if (path === '/appointments' && method === 'GET') {
    res.json({
      success: true,
      appointments: [
        {
          _id: 'app1',
          date: new Date(Date.now() + 86400000).toISOString(), // tomorrow
          timeSlot: '10:00 AM',
          status: 'scheduled',
          reason: 'Regular checkup',
          doctorId: {
            _id: 'doctor123',
            name: 'Dr. John Smith',
            specialization: 'Cardiology'
          },
          patientId: {
            _id: 'patient123',
            name: 'Alex Johnson'
          }
        },
        {
          _id: 'app2',
          date: new Date(Date.now() - 186400000).toISOString(), // past
          timeSlot: '02:00 PM',
          status: 'completed',
          reason: 'Flu symptoms',
          notes: 'Patient was prescribed antibiotics and rest for 3 days.',
          doctorId: {
            _id: 'doctor456',
            name: 'Dr. Sarah Williams',
            specialization: 'General Practitioner'
          },
          patientId: {
            _id: 'patient123',
            name: 'Alex Johnson'
          }
        }
      ]
    });
    return;
  }

  // Cancel appointment
  if (path.startsWith('/appointments/cancel/') && method === 'PUT') {
    const appointmentId = path.split('/').pop();
    res.json({
      success: true,
      message: `Appointment ${appointmentId} has been cancelled`,
      appointment: {
        _id: appointmentId,
        status: 'cancelled'
      }
    });
    return;
  }

  // Complete appointment
  if (path.startsWith('/appointments/complete/') && method === 'PUT') {
    const appointmentId = path.split('/').pop();
    const notes = req.body.notes || '';
    res.json({
      success: true,
      message: `Appointment ${appointmentId} has been marked as completed`,
      appointment: {
        _id: appointmentId,
        status: 'completed',
        notes
      }
    });
    return;
  }

  // Save appointment notes
  if (path.match(/\/appointments\/\w+\/notes/) && method === 'PUT') {
    const appointmentId = path.split('/')[2];
    const notes = req.body.notes || '';
    res.json({
      success: true,
      message: `Notes saved for appointment ${appointmentId}`,
      appointment: {
        _id: appointmentId,
        notes
      }
    });
    return;
  }

  // Get time slots
  if (path.startsWith('/appointments/slots') && method === 'GET') {
    // Extract date and doctorId from query params
    const urlParams = new URL(req.url, 'http://example.com');
    const date = urlParams.searchParams.get('date');
    
    // Generate some time slots based on the date
    const day = new Date(date).getDay();
    const isWeekend = day === 0 || day === 6;
    
    const availableTimeSlots = isWeekend
      ? ['10:00 AM', '11:00 AM', '12:00 PM']  // fewer slots on weekends
      : ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM'];
      
    res.json({
      success: true,
      availableTimeSlots
    });
    return;
  }

  // Patient Profile
  if (path === '/patients/profile' && method === 'GET') {
    res.json({
      _id: 'patient123',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      phone: '9876543210',
      role: 'patient',
      dateOfBirth: '1990-01-15',
      gender: 'Male',
      address: '123 Main St, Anytown, USA',
      bloodType: 'O+',
      allergies: 'Penicillin',
      chronicConditions: 'None',
      medications: 'Vitamins',
      medicalHistory: [
        {
          title: 'Flu Treatment',
          description: 'Patient was treated for severe flu symptoms',
          date: '2023-01-15',
          doctorName: 'Dr. Sarah Williams'
        }
      ],
      emergencyContacts: [
        {
          name: 'Emily Johnson',
          relationship: 'Spouse',
          phone: '9876543211'
        }
      ],
      documents: []
    });
    return;
  }

  // Update Patient Profile
  if (path === '/patients/profile' && method === 'PUT') {
    const updatedProfile = req.body;
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
    return;
  }

  // Upload documents
  if (path === '/patients/documents' && method === 'POST') {
    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      documents: [
        {
          _id: 'doc1',
          name: 'Medical Report.pdf',
          type: 'application/pdf',
          size: '1.2 MB',
          uploadDate: new Date().toISOString(),
          url: '#'
        }
      ]
    });
    return;
  }

  // Default response for unhandled routes
  res.status(404).json({
    success: false,
    message: `Mock API endpoint not found: ${method} ${path}`
  });
} 