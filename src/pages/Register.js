import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaPhone, FaUser, FaUserMd, FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/Register.css';

const Register = () => {
  const { registerWithEmail, registerWithPhone, currentUser, error: authError } = useAuth();
  const navigate = useNavigate();
  
  const [contactType, setContactType] = useState('email');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (currentUser) {
      // Redirect based on role
      if (currentUser.role === 'doctor') {
        navigate('/doctor-dashboard');
      } else if (currentUser.role === 'patient') {
        navigate('/patient-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [currentUser, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleContactTypeChange = (type) => {
    setContactType(type);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const validateForm = () => {
    // Reset errors
    setError('');
    
    // Basic validation
    if (!formData.name || !formData.username || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (contactType === 'email' && !formData.email) {
      setError('Please enter your email address');
      return false;
    }
    
    if (contactType === 'phone' && !formData.phone) {
      setError('Please enter your phone number');
      return false;
    }
    
    if (contactType === 'email') {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
    }
    
    if (contactType === 'phone' && formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      let success;
      
      if (contactType === 'email') {
        success = await registerWithEmail(formData);
      } else {
        success = await registerWithPhone(formData);
      }
      
      if (!success) {
        if (authError) {
          throw new Error(authError);
        } else {
          throw new Error('Registration failed. Please try again.');
        }
      }
      
      // Registration successful - set success message
      setSuccessMsg(`Registration successful! Please check your ${contactType} to verify your account.`);
      
      // Redirect to verification/login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Create an Account</h1>
          <p>Join our medical portal</p>
        </div>
        
        {error && (
          <div className="error-alert">{error}</div>
        )}
        
        {successMsg && (
          <div className="success-alert">{successMsg}</div>
        )}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="contact-type-selector">
            <p>Register with:</p>
            <div className="contact-options">
              <button
                type="button"
                className={`contact-option ${contactType === 'email' ? 'selected' : ''}`}
                onClick={() => handleContactTypeChange('email')}
              >
                <span className="contact-icon">✉️</span>
                Email
              </button>
              <button
                type="button"
                className={`contact-option ${contactType === 'phone' ? 'selected' : ''}`}
                onClick={() => handleContactTypeChange('phone')}
              >
                <span className="contact-icon">📱</span>
                Phone
              </button>
            </div>
          </div>
          
          <div className="role-selector">
            <p>Register as:</p>
            <div className="role-options">
              <label className={`role-option ${formData.role === 'patient' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="patient"
                  checked={formData.role === 'patient'}
                  onChange={handleChange}
                />
                <div className="role-icon">👤</div>
                <span>Patient</span>
              </label>
              <label className={`role-option ${formData.role === 'doctor' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="doctor"
                  checked={formData.role === 'doctor'}
                  onChange={handleChange}
                />
                <div className="role-icon">👨‍⚕️</div>
                <span>Doctor</span>
              </label>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name*</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="username">Username*</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
              />
            </div>
          </div>
          
          {contactType === 'email' ? (
            <div className="form-group">
              <label htmlFor="email">Email Address*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="phone">Phone Number*</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                required
              />
            </div>
          )}
          
          <div className="form-row">
            <div className="form-group password-field">
              <label htmlFor="password">Password*</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                />
                <button 
                  type="button" 
                  className="toggle-password" 
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password*</label>
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>
          
          {formData.role === 'doctor' && (
            <div className="form-group">
              <label htmlFor="specialization">Specialization*</label>
              <select
                id="specialization"
                name="specialization"
                value={formData.specialization || ''}
                onChange={handleChange}
                required={formData.role === 'doctor'}
              >
                <option value="">Select specialization</option>
                <option value="General Practitioner">General Practitioner</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}
          
          <div className="form-terms">
            <p>
              By registering, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
            </p>
          </div>
          
          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <div className="register-footer">
          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 