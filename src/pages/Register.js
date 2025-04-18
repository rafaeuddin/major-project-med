import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Register.css';

const Register = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Input form, 2: OTP verification
  const [registrationType, setRegistrationType] = useState('email'); // 'email' or 'phone'
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient'
  });
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  useEffect(() => {
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
  
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const toggleRegistrationType = () => {
    setRegistrationType(registrationType === 'email' ? 'phone' : 'email');
    setError('');
  };
  
  const validateForm = () => {
    // Name validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    
    // Username validation
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    
    // Email/Phone validation
    if (registrationType === 'email') {
      if (!formData.email) {
        setError('Email is required');
        return false;
      }
      
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
    } else {
      if (!formData.phone) {
        setError('Phone number is required');
        return false;
      }
      
      // Simple phone validation - you might want to use a more sophisticated one
      if (formData.phone.length < 10) {
        setError('Please enter a valid phone number');
        return false;
      }
    }
    
    // Password validation
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };
  
  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    
    setError('');
    setSuccessMessage('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const endpoint = registrationType === 'email' 
        ? '/api/auth/register/email' 
        : '/api/auth/register/phone';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          email: registrationType === 'email' ? formData.email : undefined,
          phone: registrationType === 'phone' ? formData.phone : undefined,
          password: formData.password,
          role: formData.role
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      setSuccessMessage(data.message);
      setStep(2);
      setCountdown(60); // 60 seconds countdown for resend
      
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setError('');
    setLoading(true);
    
    try {
      const endpoint = registrationType === 'email' 
        ? '/api/auth/send-email-otp' 
        : '/api/auth/send-phone-otp';
      
      const contactField = registrationType === 'email' 
        ? { email: formData.email } 
        : { phone: formData.phone };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactField)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification code');
      }
      
      setSuccessMessage('Verification code resent successfully');
      setCountdown(60); // Reset countdown
      
    } catch (err) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp) {
      return setError('Please enter verification code');
    }
    
    setError('');
    setLoading(true);
    
    try {
      const endpoint = registrationType === 'email' 
        ? '/api/auth/verify-email-otp' 
        : '/api/auth/verify-phone-otp';
      
      const contactField = registrationType === 'email' 
        ? { email: formData.email, otp } 
        : { phone: formData.phone, otp };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactField)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }
      
      setSuccessMessage('Verification successful! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Medical Portal</h1>
          <p>Create a new account</p>
        </div>
        
        {error && (
          <div className="error-alert">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="success-alert">
            {successMessage}
          </div>
        )}
        
        {step === 1 ? (
          <form onSubmit={handleRegistrationSubmit} className="register-form">
            <div className="registration-type-toggle">
              <button 
                type="button"
                className={`toggle-btn ${registrationType === 'email' ? 'active' : ''}`}
                onClick={() => setRegistrationType('email')}
              >
                Register with Email
              </button>
              <button 
                type="button"
                className={`toggle-btn ${registrationType === 'phone' ? 'active' : ''}`}
                onClick={() => setRegistrationType('phone')}
              >
                Register with Phone
              </button>
            </div>
            
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
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
              <label htmlFor="username">Username</label>
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
            
            {registrationType === 'email' ? (
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
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
                <label htmlFor="phone">Phone Number</label>
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
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Account Type</label>
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
            
            <button 
              type="submit" 
              className="register-button"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
            
            <div className="register-footer">
              <p>
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          </form>
        ) : (
          <div className="verification-container">
            <h2>Verification</h2>
            <p className="verification-info">
              {registrationType === 'email' 
                ? `We've sent a verification code to ${formData.email}`
                : `We've sent a verification code to ${formData.phone}`
              }
            </p>
            
            <form onSubmit={handleVerifyOTP} className="verification-form">
              <div className="form-group">
                <label htmlFor="otp">Verification Code</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="verify-button"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
            
            <div className="resend-container">
              {countdown > 0 ? (
                <p>Resend code in {countdown} seconds</p>
              ) : (
                <button 
                  type="button" 
                  className="resend-button"
                  onClick={handleResendOTP}
                  disabled={loading}
                >
                  Resend Code
                </button>
              )}
            </div>
            
            <div className="back-option">
              <button 
                type="button" 
                className="back-button"
                onClick={() => setStep(1)}
              >
                Back to Registration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register; 