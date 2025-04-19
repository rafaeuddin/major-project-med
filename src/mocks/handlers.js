import { http, HttpResponse } from 'msw';

// Mock data for appointments
const mockAppointments = [
  {
    _id: '1',
    patientId: {
      _id: 'patient123',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      phone: '123-456-7890'
    },
    doctorId: {
      _id: 'doctor456',
      name: 'Dr. Sarah Parker',
      specialization: 'Cardiology',
      email: 'dr.parker@example.com'
    },
    date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    timeSlot: '10:00 AM',
    status: 'scheduled',
    reason: 'Annual checkup',
    notes: ''
  },
  {
    _id: '2',
    patientId: {
      _id: 'patient123',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      phone: '123-456-7890'
    },
    doctorId: {
      _id: 'doctor789',
      name: 'Dr. Michael Chen',
      specialization: 'Neurology',
      email: 'dr.chen@example.com'
    },
    date: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    timeSlot: '2:00 PM',
    status: 'completed',
    reason: 'Headaches and dizziness',
    notes: 'Patient reported recurring headaches. Prescribed medication and recommended follow-up in 2 weeks.'
  }
];

// Mock available time slots
const mockTimeSlots = {
  availableTimeSlots: [
    '09:00 AM', '10:00 AM', '11:00 AM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
  ]
};

// Simple chatbot responses for common medical inquiries
const medicalResponses = {
  headache: {
    response: "It sounds like you're experiencing headaches. Headaches can be caused by various factors including stress, dehydration, lack of sleep, or underlying medical conditions. If your headache is severe, persistent, or accompanied by other symptoms like fever, vision changes, or neck stiffness, you should consult with a doctor. Would you like to book an appointment?",
    urgencyLevel: "normal",
    specialistRecommendation: "Neurologist"
  },
  fever: {
    response: "I see you're concerned about a fever. A fever is often a sign that your body is fighting an infection. Make sure to stay hydrated and rest. If your temperature is above 103°F (39.4°C), lasts more than three days, or is accompanied by severe symptoms, you should seek medical attention. Would you like to discuss this with a doctor?",
    urgencyLevel: "normal",
    specialistRecommendation: "General Physician"
  },
  chest_pain: {
    response: "Chest pain can be a symptom of several conditions and should be taken seriously. If you're experiencing severe chest pain, especially if it radiates to your arm, jaw, or back, or is accompanied by shortness of breath, sweating, or nausea, please seek emergency medical care immediately by calling 911 or going to your nearest emergency room.",
    urgencyLevel: "urgent",
    specialistRecommendation: "Cardiologist"
  },
  cough: {
    response: "Coughing can be caused by various factors including allergies, cold, flu, or respiratory infections. If your cough is persistent (lasting more than 2 weeks), produces discolored mucus, or is accompanied by shortness of breath, you should consult with a healthcare professional. Would you like me to help you book an appointment?",
    urgencyLevel: "normal",
    specialistRecommendation: "Pulmonologist"
  },
  default: {
    response: "Thank you for sharing your health concern. While I can provide general information, for a proper diagnosis and treatment plan, I'd recommend consulting with a healthcare professional. Would you like me to help you book an appointment with a doctor?",
    urgencyLevel: "normal",
    specialistRecommendation: null
  }
};

// Add to the medicalResponses object to include versions with patient history
const medicalResponsesWithHistory = {
  headache: {
    response: "Based on your medical history, I see you've had previous appointments related to headaches. It's important to monitor any changes in your symptoms. Given your history, I would suggest keeping your scheduled follow-up appointment with your neurologist. In the meantime, continue with your prescribed medication and make sure you're staying hydrated and managing stress as discussed in your previous consultation.",
    urgencyLevel: "normal",
    specialistRecommendation: "Neurologist",
    hasPatientHistory: true
  },
  fever: {
    response: "I notice from your medical history that you have a history of recurring infections. With your current fever, it's especially important to monitor your temperature closely. Given your medical background, if your temperature exceeds 101°F or persists for more than 24 hours, you should contact your doctor as they may want to see you sooner considering your history. Continue taking your medications as prescribed.",
    urgencyLevel: "normal",
    specialistRecommendation: "General Physician",
    hasPatientHistory: true
  },
  chest_pain: {
    response: "Given your medical history that shows you have hypertension, your chest pain symptoms should be taken very seriously. Please seek emergency medical care immediately by calling 911 or going to your nearest emergency room. With your cardiovascular history, it's important to get evaluated promptly, even if the pain seems mild.",
    urgencyLevel: "urgent",
    specialistRecommendation: "Cardiologist",
    hasPatientHistory: true
  },
  cough: {
    response: "Looking at your medical history, I see you have asthma and have been prescribed an inhaler. With your current cough, it's important to monitor for any signs of an asthma flare-up. If you're experiencing increased wheezing or shortness of breath along with your cough, use your rescue inhaler as prescribed and contact your pulmonologist. They may want to adjust your management plan.",
    urgencyLevel: "normal",
    specialistRecommendation: "Pulmonologist",
    hasPatientHistory: true
  },
  default: {
    response: "I've reviewed your medical history and can provide some general guidance based on your health background. However, for your specific concerns, I'd recommend consulting with your healthcare provider who's familiar with your complete medical history. They can offer personalized advice based on your ongoing treatment plan.",
    urgencyLevel: "normal",
    specialistRecommendation: null,
    hasPatientHistory: true
  }
};

// Mock data for medical records
const mockMedicalRecords = [
  {
    _id: 'record1',
    patientId: 'patient123',
    recordType: 'diagnosis',
    recordDate: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
    description: 'Diagnosed with migraine headaches',
    diagnosisDetails: {
      condition: 'Migraine',
      symptoms: ['Headache', 'Nausea', 'Light sensitivity'],
      severity: 'moderate',
      status: 'active'
    },
    createdBy: {
      _id: 'doctor456',
      name: 'Dr. Sarah Parker',
      role: 'doctor',
      specialization: 'Neurology'
    }
  },
  {
    _id: 'record2',
    patientId: 'patient123',
    recordType: 'prescription',
    recordDate: new Date(Date.now() - 86400000 * 29).toISOString(), // 29 days ago
    description: 'Prescribed medication for migraine prevention',
    medicationDetails: {
      name: 'Propranolol',
      dosage: '40mg',
      frequency: 'Twice daily',
      startDate: new Date(Date.now() - 86400000 * 29).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 60).toISOString() // 60 days from now
    },
    createdBy: {
      _id: 'doctor456',
      name: 'Dr. Sarah Parker',
      role: 'doctor',
      specialization: 'Neurology'
    }
  },
  {
    _id: 'record3',
    patientId: 'patient123',
    recordType: 'allergy',
    recordDate: new Date(Date.now() - 86400000 * 100).toISOString(), // 100 days ago
    description: 'Identified penicillin allergy',
    allergyDetails: {
      allergen: 'Penicillin',
      reaction: 'Hives and difficulty breathing',
      severity: 'severe',
      status: 'active'
    },
    createdBy: {
      _id: 'doctor789',
      name: 'Dr. Michael Chen',
      role: 'doctor',
      specialization: 'Immunology'
    }
  },
  {
    _id: 'record4',
    patientId: 'patient123',
    recordType: 'labResult',
    recordDate: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
    description: 'Complete blood count results',
    details: {
      testName: 'Complete Blood Count',
      results: 'Within normal ranges',
      notes: 'No significant abnormalities found'
    },
    createdBy: {
      _id: 'doctor456',
      name: 'Dr. Sarah Parker',
      role: 'doctor',
      specialization: 'Neurology'
    }
  }
];

// Mock data for food items
const mockFoodItems = [
  { id: '1', name: 'Apple', brand: 'Fresh Fruits', calories: 95, proteins: 0.5, carbs: 25, fats: 0.3, servingUnit: 'medium' },
  { id: '2', name: 'Banana', brand: 'Fresh Fruits', calories: 105, proteins: 1.3, carbs: 27, fats: 0.4, servingUnit: 'medium' },
  { id: '3', name: 'Chicken Breast', brand: 'Organic Meats', calories: 165, proteins: 31, carbs: 0, fats: 3.6, servingUnit: '100g' },
  { id: '4', name: 'Brown Rice', brand: 'Healthy Grains', calories: 216, proteins: 5, carbs: 45, fats: 1.8, servingUnit: 'cup' },
  { id: '5', name: 'Salmon', brand: 'Wild Caught', calories: 208, proteins: 20, carbs: 0, fats: 13, servingUnit: '100g' },
  { id: '6', name: 'Spinach', brand: 'Garden Fresh', calories: 7, proteins: 0.9, carbs: 1.1, fats: 0.1, servingUnit: 'cup' },
  { id: '7', name: 'Eggs', brand: 'Farm Fresh', calories: 68, proteins: 5.5, carbs: 0.6, fats: 4.8, servingUnit: 'large' },
  { id: '8', name: 'Whole Wheat Bread', brand: 'Bakery', calories: 69, proteins: 3.6, carbs: 12, fats: 0.9, servingUnit: 'slice' },
  { id: '9', name: 'Avocado', brand: 'Fresh Produce', calories: 234, proteins: 2.9, carbs: 12.5, fats: 21, servingUnit: 'medium' },
  { id: '10', name: 'Greek Yogurt', brand: 'Dairy Farm', calories: 100, proteins: 17, carbs: 6, fats: 0.5, servingUnit: 'cup' }
];

// Generate mock food logs for the past 30 days
const generateMockFoodLogs = () => {
  const logs = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    // Decide if this date has food logs (80% chance)
    if (Math.random() < 0.8) {
      // Generate between 2-4 meal logs for this day
      const mealCount = Math.floor(Math.random() * 3) + 2;
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      
      const usedMealTypes = [];
      
      for (let j = 0; j < mealCount; j++) {
        // Select a meal type that hasn't been used yet
        let mealType;
        do {
          mealType = mealTypes[Math.floor(Math.random() * mealTypes.length)];
        } while (usedMealTypes.includes(mealType));
        
        usedMealTypes.push(mealType);
        
        // Generate between 1-3 food items for this meal
        const foodItemCount = Math.floor(Math.random() * 3) + 1;
        const foodItems = [];
        
        let totalCalories = 0;
        let totalProteins = 0;
        let totalCarbs = 0;
        let totalFats = 0;
        
        for (let k = 0; k < foodItemCount; k++) {
          const foodItem = mockFoodItems[Math.floor(Math.random() * mockFoodItems.length)];
          const servingSize = Math.round((Math.random() * 1.5 + 0.5) * 100) / 100; // Between 0.5 and 2 servings
          
          const itemCalories = foodItem.calories * servingSize;
          const itemProteins = foodItem.proteins * servingSize;
          const itemCarbs = foodItem.carbs * servingSize;
          const itemFats = foodItem.fats * servingSize;
          
          totalCalories += itemCalories;
          totalProteins += itemProteins;
          totalCarbs += itemCarbs;
          totalFats += itemFats;
          
          foodItems.push({
            foodItem: foodItem.id,
            foodItemDetails: foodItem,
            servingSize,
            calories: itemCalories,
            proteins: itemProteins,
            carbs: itemCarbs,
            fats: itemFats
          });
        }
        
        logs.push({
          id: `log-${date.toISOString()}-${mealType}`,
          userId: 'user123',
          date: date.toISOString(),
          mealType,
          foodItems,
          totalCalories,
          totalProteins,
          totalCarbs,
          totalFats,
          waterIntake: Math.floor(Math.random() * 500) + 200, // 200-700ml per meal
          notes: '',
          createdAt: date.toISOString()
        });
      }
    }
  }
  
  return logs;
};

const mockFoodLogs = generateMockFoodLogs();

// Generate nutrition summary from food logs
const generateNutritionSummary = (startDate, endDate) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  // Filter logs within the date range
  const filteredLogs = mockFoodLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= start && logDate <= end;
  });
  
  // Generate daily summaries
  const dailySummaries = {};
  
  filteredLogs.forEach(log => {
    const dateKey = log.date.split('T')[0];
    
    if (!dailySummaries[dateKey]) {
      dailySummaries[dateKey] = {
        date: dateKey,
        totalCalories: 0,
        totalProteins: 0,
        totalCarbs: 0,
        totalFats: 0,
        waterIntake: 0,
        meals: {}
      };
    }
    
    // Add this log's data to the daily summary
    dailySummaries[dateKey].totalCalories += log.totalCalories || 0;
    dailySummaries[dateKey].totalProteins += log.totalProteins || 0;
    dailySummaries[dateKey].totalCarbs += log.totalCarbs || 0;
    dailySummaries[dateKey].totalFats += log.totalFats || 0;
    dailySummaries[dateKey].waterIntake += log.waterIntake || 0;
    
    // Add meal-specific data
    dailySummaries[dateKey].meals[log.mealType] = {
      calories: log.totalCalories || 0,
      proteins: log.totalProteins || 0,
      carbs: log.totalCarbs || 0,
      fats: log.totalFats || 0
    };
  });
  
  // Convert object to array
  const summaryArray = Object.values(dailySummaries);
  
  // Calculate overall averages
  const overallSummary = summaryArray.reduce((acc, day) => {
    acc.totalDays += 1;
    acc.avgCalories += day.totalCalories;
    acc.avgProteins += day.totalProteins;
    acc.avgCarbs += day.totalCarbs;
    acc.avgFats += day.totalFats;
    acc.avgWaterIntake += day.waterIntake;
    return acc;
  }, {
    totalDays: 0,
    avgCalories: 0,
    avgProteins: 0,
    avgCarbs: 0,
    avgFats: 0,
    avgWaterIntake: 0
  });
  
  if (overallSummary.totalDays > 0) {
    overallSummary.avgCalories /= overallSummary.totalDays;
    overallSummary.avgProteins /= overallSummary.totalDays;
    overallSummary.avgCarbs /= overallSummary.totalDays;
    overallSummary.avgFats /= overallSummary.totalDays;
    overallSummary.avgWaterIntake /= overallSummary.totalDays;
  }
  
  return {
    dailySummaries: summaryArray,
    overallSummary
  };
};

// Mock patient profile data
const mockPatientProfile = {
  _id: 'patient123',
  name: 'Jane Smith',
  email: 'patient@example.com',
  phone: '555-123-4567',
  dateOfBirth: '1988-04-15T00:00:00.000Z',
  gender: 'female',
  bloodGroup: 'O+',
  height: 165, // in cm
  weight: 62, // in kg
  address: {
    street: '123 Main St',
    city: 'Metropolis',
    state: 'NY',
    zipCode: '10001',
    country: 'USA'
  },
  emergencyContact: {
    name: 'John Smith',
    relationship: 'Spouse',
    phone: '555-987-6543'
  },
  medicalHistory: {
    allergies: ['Penicillin'],
    chronicConditions: ['Migraine'],
    pastSurgeries: [],
    familyHistory: ['Hypertension', 'Diabetes']
  },
  insurance: {
    provider: 'HealthGuard',
    policyNumber: 'HG-123456789',
    expiryDate: '2024-12-31T00:00:00.000Z'
  },
  createdAt: '2023-01-15T00:00:00.000Z',
  updatedAt: '2023-05-20T00:00:00.000Z'
};

export const handlers = [
  // Fast-responding handlers for problematic endpoints (put these first for priority)
  // Fast user appointments handler
  http.get('/api/appointments/user', () => {
    return new Response(
      JSON.stringify({
        success: true,
        appointments: mockAppointments
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }),

  // Fast patient profile handler
  http.get('/api/patients/profile', () => {
    return new Response(
      JSON.stringify({
        success: true,
        data: mockPatientProfile
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }),

  // Regular handlers continue below...
  
  // Auth handlers
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json()
    
    // Mock credentials check
    if (email === 'doctor@example.com' && password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: {
            _id: 'doctor123',
            name: 'Dr. John Doe',
            email: 'doctor@example.com',
            role: 'doctor'
          }
        }
      })
    } else if (email === 'patient@example.com' && password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: {
            _id: 'patient123',
            name: 'Jane Smith',
            email: 'patient@example.com',
            role: 'patient'
          }
        }
      })
    } else {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: 'Invalid credentials'
        }),
        { status: 401 }
      )
    }
  }),

  http.get('/api/auth/me', () => {
    // Return mock user data
    return HttpResponse.json({
      success: true,
      data: {
        _id: 'user123',
        name: 'Mock User',
        email: 'user@example.com',
        role: 'patient'
      }
    })
  }),

  // Appointment handlers
  http.get('/api/appointments', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          _id: 'appt1',
          patientId: 'patient123',
          patientName: 'Jane Smith',
          doctorId: 'doctor123',
          doctorName: 'Dr. John Doe',
          date: '2023-09-15',
          timeSlot: '10:00 AM',
          status: 'scheduled',
          reason: 'Annual checkup',
          createdAt: '2023-09-01T10:00:00Z'
        },
        {
          _id: 'appt2',
          patientId: 'patient123',
          patientName: 'Jane Smith',
          doctorId: 'doctor456',
          doctorName: 'Dr. Sarah Wilson',
          date: '2023-08-20',
          timeSlot: '2:00 PM',
          status: 'completed',
          reason: 'Follow-up',
          notes: 'Patient is recovering well.',
          createdAt: '2023-08-01T14:00:00Z'
        }
      ]
    })
  }),

  http.post('/api/appointments', async ({ request }) => {
    const appointment = await request.json()
    
    return HttpResponse.json({
      success: true,
      data: {
        _id: 'new-appt-id',
        ...appointment,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      }
    })
  }),

  http.delete('/api/appointments/:id', ({ params }) => {
    const { id } = params;
    
    try {
      // Make sure we return a valid response with all the needed data
      return HttpResponse.json({
        success: true,
        message: `Appointment ${id} cancelled successfully`,
        appointment: { _id: id, status: 'cancelled' }
      });
    } catch (error) {
      console.error('Error in appointment cancellation handler:', error);
      return HttpResponse.json({
        success: false,
        message: 'Failed to cancel appointment'
      }, { status: 500 });
    }
  }),

  // Doctors handlers
  http.get('/api/doctors', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          _id: 'doctor123',
          name: 'Dr. John Doe',
          specialization: 'Cardiologist',
          consultationFee: 150,
          availableTimeSlots: ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM']
        },
        {
          _id: 'doctor456',
          name: 'Dr. Sarah Wilson',
          specialization: 'Dermatologist',
          consultationFee: 120,
          availableTimeSlots: ['9:30 AM', '10:30 AM', '11:30 AM', '2:30 PM', '3:30 PM']
        }
      ]
    })
  }),

  http.get('/api/doctors/:id/timeslots', ({ params, request }) => {
    const { id } = params
    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    
    return HttpResponse.json({
      success: true,
      data: ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM']
    })
  }),

  // Available slots endpoint - make super reliable
  http.get('/api/appointments/available-slots', ({ request }) => {
    try {
      const url = new URL(request.url);
      const date = url.searchParams.get('date') || '';
      const doctorId = url.searchParams.get('doctorId') || '';
      
      console.log(`Serving time slots for date: ${date}, doctor: ${doctorId}`);
      
      return new HttpResponse(
        JSON.stringify({
          success: true,
          availableTimeSlots: mockTimeSlots.availableTimeSlots
        }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error in available-slots handler:', error);
      return new HttpResponse(
        JSON.stringify({
          success: true,
          availableTimeSlots: ['09:00 AM', '10:00 AM', '02:00 PM']
        }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }),

  // Chatbot API endpoint handler
  http.post('/api/chatbot/message', async ({ request }) => {
    const { message, conversationHistory } = await request.json();
    
    // Simple keyword-based response for the mock
    const messageLower = message.toLowerCase();
    let response;
    
    // Randomly decide whether to show responses with patient history
    const usePatientHistory = Math.random() > 0.5;
    
    if (messageLower.includes('headache') || messageLower.includes('head pain') || messageLower.includes('migraine')) {
      response = usePatientHistory ? medicalResponsesWithHistory.headache : medicalResponses.headache;
    } else if (messageLower.includes('fever') || messageLower.includes('temperature') || messageLower.includes('hot')) {
      response = usePatientHistory ? medicalResponsesWithHistory.fever : medicalResponses.fever;
    } else if (messageLower.includes('chest pain') || messageLower.includes('heart pain')) {
      response = usePatientHistory ? medicalResponsesWithHistory.chest_pain : medicalResponses.chest_pain;
    } else if (messageLower.includes('cough') || messageLower.includes('cold') || messageLower.includes('flu')) {
      response = usePatientHistory ? medicalResponsesWithHistory.cough : medicalResponses.cough;
    } else {
      response = usePatientHistory ? medicalResponsesWithHistory.default : medicalResponses.default;
    }
    
    // Add personalization based on conversation history if available
    if (conversationHistory && conversationHistory.length > 0) {
      // Find the user's name if mentioned in conversation
      const nameMatch = conversationHistory.find(msg => 
        msg.role === 'user' && 
        msg.content.match(/my name is ([a-zA-Z]+)/i)
      );
      
      if (nameMatch) {
        const name = nameMatch.content.match(/my name is ([a-zA-Z]+)/i)[1];
        response.response = `Hi ${name}, ${response.response}`;
      }
    }
    
    return HttpResponse.json({
      success: true,
      data: response
    });
  }),

  // Medical records handlers
  http.get('/api/medical-records/patient/:id', ({ params }) => {
    const { id } = params;
    
    // Filter records for the specific patient
    const patientRecords = mockMedicalRecords.filter(record => record.patientId === id);
    
    return HttpResponse.json({
      success: true,
      data: patientRecords
    });
  }),

  http.get('/api/medical-records/summary/:id', ({ params }) => {
    const { id } = params;
    
    // Filter records for the specific patient
    const patientRecords = mockMedicalRecords.filter(record => record.patientId === id);
    
    // Create a sample summary
    const summary = {
      patient: {
        name: 'Jane Smith',
        age: 35,
        emergencyContact: {
          name: 'John Smith',
          phone: '555-123-4567',
          relationship: 'Spouse'
        }
      },
      activeConditions: patientRecords
        .filter(r => r.recordType === 'diagnosis' && r.diagnosisDetails?.status === 'active')
        .map(c => ({
          condition: c.diagnosisDetails?.condition,
          severity: c.diagnosisDetails?.severity,
          dateIdentified: c.recordDate
        })),
      allergies: patientRecords
        .filter(r => r.recordType === 'allergy' && r.allergyDetails?.status === 'active')
        .map(a => ({
          allergen: a.allergyDetails?.allergen,
          reaction: a.allergyDetails?.reaction,
          severity: a.allergyDetails?.severity
        })),
      currentMedications: patientRecords
        .filter(r => r.recordType === 'prescription' && new Date(r.medicationDetails?.endDate) > new Date())
        .map(m => ({
          name: m.medicationDetails?.name,
          dosage: m.medicationDetails?.dosage,
          frequency: m.medicationDetails?.frequency
        })),
      recentAppointments: mockAppointments.map(a => ({
        date: a.date,
        doctor: a.doctorId?.name,
        specialization: a.doctorId?.specialization,
        reason: a.reason,
        status: a.status,
        notes: a.notes
      }))
    };
    
    return HttpResponse.json({
      success: true,
      data: summary
    });
  }),

  http.get('/api/medical-records/:id', ({ params }) => {
    const { id } = params;
    
    // Find the specific record
    const record = mockMedicalRecords.find(record => record._id === id);
    
    if (!record) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: 'Medical record not found'
        }),
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: record
    });
  }),

  // Add food item handlers
  http.get('/api/food/items', () => {
    return HttpResponse.json({
      success: true,
      data: mockFoodItems
    });
  }),
  
  http.get('/api/food/items/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    
    const filteredItems = mockFoodItems.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) || 
      item.brand.toLowerCase().includes(query.toLowerCase())
    );
    
    return HttpResponse.json({
      success: true,
      count: filteredItems.length,
      data: filteredItems
    });
  }),
  
  // Food log handlers
  http.get('/api/food/logs', () => {
    return HttpResponse.json({
      success: true,
      count: mockFoodLogs.length,
      data: mockFoodLogs
    });
  }),
  
  http.post('/api/food/logs', async ({ request }) => {
    try {
      const foodLog = await request.json();
      
      // Create a mock response
      const newLog = {
        id: `log-${Date.now()}`,
        userId: 'user123',
        ...foodLog,
        createdAt: new Date().toISOString()
      };
      
      return HttpResponse.json({
        success: true,
        data: newLog
      });
    } catch (error) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: 'Failed to create food log'
        }),
        { status: 400 }
      );
    }
  }),
  
  // Nutrition summary handler
  http.get('/api/food/nutrition/summary', ({ request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = url.searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    
    const summary = generateNutritionSummary(startDate, endDate);
    
    return HttpResponse.json({
      success: true,
      data: summary
    });
  }),

  // Add patient profile update handler
  http.put('/api/patients/profile', async ({ request }) => {
    const updatedProfile = await request.json();
    
    return HttpResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...mockPatientProfile,
        ...updatedProfile,
        updatedAt: new Date().toISOString()
      }
    });
  })
]; 