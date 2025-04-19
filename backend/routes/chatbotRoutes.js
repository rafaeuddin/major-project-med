const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const OpenAI = require('openai');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fetch patient's medical history summary
const fetchPatientMedicalHistory = async (patientId) => {
  try {
    // Get the patient details
    const patient = await User.findById(patientId).select('-password');
    if (!patient) return null;
    
    // Get all medical records
    const medicalRecords = await MedicalRecord.find({ patientId })
      .sort({ recordDate: -1 })
      .populate('createdBy', 'name specialization');
    
    // Get recent appointments
    const recentAppointments = await Appointment.find({ 
      patientId,
      status: { $in: ['completed', 'scheduled'] } 
    })
      .sort({ date: -1 })
      .limit(5)
      .populate('doctorId', 'name specialization');

    // Analyze records to create summary
    const activeConditions = medicalRecords.filter(
      record => record.recordType === 'diagnosis' && 
                record.diagnosisDetails?.status === 'active'
    );
    
    const allergies = medicalRecords.filter(
      record => record.recordType === 'allergy' && 
                record.allergyDetails?.status === 'active'
    );
    
    const medications = medicalRecords.filter(
      record => record.recordType === 'prescription' && 
                (record.medicationDetails?.endDate > new Date() || !record.medicationDetails?.endDate)
    );

    // Create a comprehensive summary as a text string for the AI
    let summaryText = `PATIENT SUMMARY FOR ${patient.name}:\n`;
    
    if (patient.dateOfBirth) {
      const age = calculateAge(patient.dateOfBirth);
      summaryText += `Age: ${age || 'Unknown'}\n`;
    }
    
    // Active conditions
    summaryText += `\nACTIVE MEDICAL CONDITIONS:\n`;
    if (activeConditions.length > 0) {
      activeConditions.forEach(c => {
        summaryText += `- ${c.diagnosisDetails.condition} (Severity: ${c.diagnosisDetails.severity || 'Unknown'}, Identified: ${formatDate(c.recordDate)})\n`;
      });
    } else {
      summaryText += "No known active medical conditions.\n";
    }
    
    // Allergies
    summaryText += `\nALLERGIES:\n`;
    if (allergies.length > 0) {
      allergies.forEach(a => {
        summaryText += `- ${a.allergyDetails.allergen} (Reaction: ${a.allergyDetails.reaction || 'Unknown'}, Severity: ${a.allergyDetails.severity || 'Unknown'})\n`;
      });
    } else {
      summaryText += "No known allergies.\n";
    }
    
    // Current medications
    summaryText += `\nCURRENT MEDICATIONS:\n`;
    if (medications.length > 0) {
      medications.forEach(m => {
        summaryText += `- ${m.medicationDetails.name} (Dosage: ${m.medicationDetails.dosage || 'Unknown'}, Frequency: ${m.medicationDetails.frequency || 'Unknown'})\n`;
      });
    } else {
      summaryText += "No current medications.\n";
    }
    
    // Recent appointments
    summaryText += `\nRECENT MEDICAL HISTORY:\n`;
    if (recentAppointments.length > 0) {
      recentAppointments.forEach(a => {
        summaryText += `- ${formatDate(a.date)}: ${a.reason} with ${a.doctorId?.name || 'Unknown Doctor'} (${a.doctorId?.specialization || 'Unknown Specialty'})\n`;
        if (a.notes) {
          summaryText += `  Notes: ${a.notes}\n`;
        }
      });
    } else {
      summaryText += "No recent appointment history.\n";
    }
    
    return summaryText;
  } catch (error) {
    console.error('Error fetching patient medical history:', error);
    return null;
  }
};

// Helper function to format dates
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Helper function to calculate age
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// @route   POST /api/chatbot/message
// @desc    Send a message to ChatGPT and get a response
// @access  Private
router.post('/message', protect, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Get patient's medical history if available
    let patientMedicalHistory = null;
    if (req.user.role === 'patient') {
      patientMedicalHistory = await fetchPatientMedicalHistory(req.user.id);
    }

    // Format conversation history for the OpenAI chat API
    const messages = [
      {
        role: 'system',
        content: `You are Dr. AI, a helpful medical assistant chatbot. Your task is to provide general health information, 
                  suggest potential causes for symptoms, and recommend when to see a doctor. 
                  NEVER provide a specific diagnosis. 
                  ALWAYS recommend seeing a healthcare professional for personalized advice.
                  If users describe severe symptoms (chest pain, difficulty breathing, sudden severe headache, etc.), 
                  emphasize the importance of seeking immediate medical attention.
                  You have knowledge about common health conditions, preventive care, and general wellness.
                  Keep responses concise, clear, and empathetic.
                  ${patientMedicalHistory ? `\n\nIMPORTANT PATIENT INFORMATION:\n${patientMedicalHistory}\n\nConsider this medical history when providing advice. Reference relevant aspects of the patient's history when appropriate, but maintain confidentiality and privacy. DO NOT share information about conditions not relevant to the current conversation.` : ''}`
      },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // Or use 'gpt-3.5-turbo' for a less expensive option
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    // Extract the assistant's response
    const aiResponse = response.choices[0].message.content;

    // Analyze the message for medical urgency
    let urgencyLevel = 'normal';
    const urgentKeywords = ['emergency', 'call 911', 'immediate', 'urgent', 'severe'];
    
    if (urgentKeywords.some(keyword => aiResponse.toLowerCase().includes(keyword))) {
      urgencyLevel = 'urgent';
    }

    // Identify if a specialist recommendation is included
    let specialistRecommendation = null;
    const specialistMatcher = aiResponse.match(/see a ([a-zA-Z\s]+)(specialist|doctor|physician)/i);
    
    if (specialistMatcher) {
      specialistRecommendation = specialistMatcher[1].trim();
    }

    return res.json({
      success: true,
      data: {
        response: aiResponse,
        urgencyLevel,
        specialistRecommendation,
        hasPatientHistory: !!patientMedicalHistory
      }
    });
    
  } catch (error) {
    console.error('ChatGPT API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error communicating with AI service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 