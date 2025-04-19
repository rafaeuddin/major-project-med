import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/DoctorChatbot.css';

const DoctorChatbot = () => {
  const navigate = useNavigate();
  const { authFetch, currentUser } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm Dr. AI, your virtual healthcare assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBookingButton, setShowBookingButton] = useState(false);
  const [recommendedSpecialty, setRecommendedSpecialty] = useState('');
  const messagesEndRef = useRef(null);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Medical knowledge base - simplified for demo
  const medicalKnowledge = [
    {
      keywords: ['headache', 'head pain', 'migraine'],
      response: "It sounds like you're experiencing a headache. This could be due to stress, dehydration, lack of sleep, or other factors. If it's severe, persistent, or accompanied by other symptoms like fever, vision changes, or neck stiffness, you should consult with a doctor. Would you like to book an appointment?"
    },
    {
      keywords: ['fever', 'temperature', 'hot', 'chills'],
      response: "A fever is often a sign that your body is fighting an infection. Make sure to stay hydrated and rest. If your temperature is above 103°F (39.4°C), lasts more than three days, or is accompanied by severe symptoms, you should seek medical attention. Would you like to discuss this with a doctor?"
    },
    {
      keywords: ['cough', 'coughing', 'chest congestion'],
      response: "Coughing can be caused by various factors including allergies, cold, flu, or respiratory infections. If your cough is persistent (lasting more than 2 weeks), produces discolored mucus, or is accompanied by shortness of breath, you should consult with a healthcare professional. Shall I help you book an appointment?"
    },
    {
      keywords: ['cold', 'flu', 'stuffy nose', 'runny nose', 'sore throat'],
      response: "Common cold symptoms typically resolve within 7-10 days. Stay hydrated, get plenty of rest, and consider over-the-counter medications for symptom relief. If symptoms worsen or don't improve, it might be good to see a doctor. Would you like to schedule a consultation?"
    },
    {
      keywords: ['stomach', 'abdomen', 'pain', 'nausea', 'vomiting', 'diarrhea'],
      response: "Stomach issues can result from various causes including food poisoning, viruses, or digestive disorders. Ensure you stay hydrated. If symptoms are severe, persistent, or accompanied by fever, blood in stool, or intense pain, medical attention is recommended. Would you like to speak with a specialist?"
    },
    {
      keywords: ['rash', 'skin', 'itchy', 'bumps', 'hives'],
      response: "Skin rashes can be caused by allergies, infections, or other conditions. Avoid scratching and irritating the area. If the rash is widespread, painful, or accompanied by other symptoms like fever or difficulty breathing, you should consult a doctor. Would you like to see a dermatologist?"
    },
    {
      keywords: ['appointment', 'book', 'schedule', 'doctor', 'visit'],
      response: "I'd be happy to help you book an appointment. You can click on 'Book New Appointment' in your dashboard, or I can guide you to the right specialist based on your symptoms. What type of doctor would you like to see?"
    },
    {
      keywords: ['thank', 'thanks', 'appreciate', 'helpful'],
      response: "You're welcome! I'm here to help. Is there anything else you'd like to know about your health today?"
    }
  ];

  // Specialty recommendations based on symptoms
  const specialtyRecommendations = {
    headache: ['Neurology', 'General Physician'],
    migraine: ['Neurology'],
    fever: ['General Physician', 'Infectious Disease'],
    cough: ['Pulmonology', 'General Physician'],
    'chest pain': ['Cardiology', 'Emergency Medicine'],
    'shortness of breath': ['Pulmonology', 'Cardiology'],
    rash: ['Dermatology', 'Allergy and Immunology'],
    'stomach pain': ['Gastroenterology', 'General Physician'],
    nausea: ['Gastroenterology', 'General Physician'],
    vomiting: ['Gastroenterology', 'Emergency Medicine'],
    diarrhea: ['Gastroenterology'],
    'joint pain': ['Rheumatology', 'Orthopedics'],
    'back pain': ['Orthopedics', 'Neurology', 'Physical Therapy'],
    'eye pain': ['Ophthalmology'],
    'vision problems': ['Ophthalmology', 'Neurology'],
    'ear pain': ['Otolaryngology (ENT)'],
    'hearing loss': ['Otolaryngology (ENT)', 'Audiology'],
    'sore throat': ['Otolaryngology (ENT)', 'General Physician'],
    'urinary problems': ['Urology', 'Nephrology'],
    depression: ['Psychiatry', 'Psychology'],
    anxiety: ['Psychiatry', 'Psychology'],
    'sleep problems': ['Sleep Medicine', 'Psychiatry'],
    'high blood pressure': ['Cardiology', 'Internal Medicine'],
    diabetes: ['Endocrinology', 'Internal Medicine'],
    'pregnancy': ['Obstetrics and Gynecology']
  };
  
  // Severity assessment questions
  const severityQuestions = {
    headache: [
      "Is this the worst headache of your life?",
      "Are you experiencing any visual disturbances or difficulty speaking?",
      "Is your headache accompanied by a stiff neck or fever?"
    ],
    fever: [
      "How high is your temperature?",
      "Is your fever accompanied by a rash?",
      "Are you experiencing any difficulty breathing?"
    ],
    cough: [
      "Are you coughing up blood?",
      "Are you experiencing chest pain when coughing?",
      "Have you been coughing for more than 2 weeks?"
    ],
    'chest pain': [
      "Is the pain severe or crushing?",
      "Does the pain radiate to your arm, jaw, or back?",
      "Are you experiencing shortness of breath or sweating with the pain?"
    ]
  };

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const newUserMessage = {
      id: messages.length + 1,
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsTyping(true);

    // Add message to conversation history for the API
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: input.trim() }
    ];
    setConversationHistory(updatedHistory);

    try {
      // Make API call to our backend
      const response = await authFetch('/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          conversationHistory: updatedHistory.slice(-10) // Keep last 10 messages
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from chatbot');
      }

      const data = await response.json();
      
      // Add bot's response to conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'assistant', content: data.data.response }
      ]);

      const newBotMessage = {
        id: messages.length + 2,
        text: data.data.response,
        sender: 'bot',
        timestamp: new Date(),
        urgencyLevel: data.data.urgencyLevel,
        specialistRecommendation: data.data.specialistRecommendation,
        hasPatientHistory: data.data.hasPatientHistory
      };
      
      setMessages(prev => [...prev, newBotMessage]);
      
      // Show booking button if a specialist is recommended
      if (data.data.specialistRecommendation) {
        setRecommendedSpecialty(data.data.specialistRecommendation);
        setShowBookingButton(true);
      }
      
      // If urgency level is high, add a follow-up message
      if (data.data.urgencyLevel === 'urgent') {
        setTimeout(() => {
          const emergencyFollowup = {
            id: messages.length + 3,
            text: "If you're experiencing a medical emergency, please call emergency services immediately. Don't wait for an online response.",
            sender: 'bot',
            timestamp: new Date(Date.now() + 1000),
            urgencyLevel: 'urgent'
          };
          setMessages(prev => [...prev, emergencyFollowup]);
        }, 1000);
      }
      
      if (!isChatOpen) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error communicating with chatbot:', error);
      
      // Add error message
      const errorMessage = {
        id: messages.length + 2,
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later or contact support if the problem persists.",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle booking appointment
  const handleBookAppointment = () => {
    setShowBookingButton(false);
    
    const confirmationMessage = {
      id: messages.length + 1,
      text: "Would you like me to help you book an appointment with a specialist?",
      sender: 'bot',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, confirmationMessage]);
    
    setTimeout(() => {
      const botConfirmation = {
        id: messages.length + 2,
        text: `Great! I'll help you book an appointment with a ${recommendedSpecialty} specialist. Taking you to our booking page now.`,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botConfirmation]);
      
      // After a short delay, navigate to the booking page
      setTimeout(() => {
        navigate('/book-appointment', { 
          state: { recommendedSpecialty: recommendedSpecialty } 
        });
      }, 1500);
    }, 1000);
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="doctor-chatbot">
      {/* Chat toggle button */}
      <button 
        className="chat-toggle"
        onClick={() => setIsChatOpen(!isChatOpen)}
      >
        {isChatOpen ? (
          <span className="close-icon">×</span>
        ) : (
          <>
            <span className="chat-icon">👨‍⚕️</span>
            <span>Dr. AI</span>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </>
        )}
      </button>
      
      {/* Chat window */}
      {isChatOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-title">
              <span className="doctor-avatar">👨‍⚕️</span>
              <span className="doctor-name">Dr. AI</span>
              <span className="status-indicator">●</span>
            </div>
            <p className="chat-subtitle">AI-Powered Healthcare Assistant</p>
          </div>
          
          <div className="messages-container">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`message ${message.sender} ${message.urgencyLevel === 'urgent' ? 'urgent' : ''} ${message.isError ? 'error' : ''} ${message.hasPatientHistory ? 'with-history' : ''}`}
              >
                {message.hasPatientHistory && (
                  <div className="history-badge" title="Using your medical history">
                    <span>📋</span>
                  </div>
                )}
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message bot">
                <div className="message-content typing">
                  <span className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            )}
            
            {showBookingButton && !isTyping && (
              <div className="booking-button-container">
                <button 
                  className="booking-button"
                  onClick={handleBookAppointment}
                >
                  Book Appointment Now
                </button>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <form className="chat-input" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your health question here..."
              disabled={isTyping}
            />
            <button 
              type="submit" 
              disabled={input.trim() === '' || isTyping}
            >
              <span className="send-icon">➤</span>
            </button>
          </form>
          
          <div className="chat-disclaimer">
            <p>This is an AI assistant and not a replacement for professional medical advice. In case of emergency, call 911 or your local emergency number.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorChatbot; 