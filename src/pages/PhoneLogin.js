import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/PhoneLogin.css';

const PhoneLogin = () => {
  const [step, setStep] = useState(1); // 1: Choose method, 2: Input contact, 3: Verify OTP
  const [verificationType, setVerificationType] = useState('phone'); // 'phone' or 'email'
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const { verifyEmailOTP, verifyPhoneOTP, sendEmailOTP, sendPhoneOTP, currentUser, error: authError } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if already logged in
    if (currentUser) {
      switch (currentUser.role) {
        case 'doctor':
          navigate('/doctor-dashboard');
          break;
        case 'patient':
          navigate('/patient-dashboard');
          break;
        default:
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
  
  const handleMethodSelect = (method) => {
    setVerificationType(method);
    setStep(2);
    setError('');
  };
  
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Simple validation
    if (!contact) {
      return setError(verificationType === 'email' 
        ? 'Please enter your email' 
        : 'Please enter your phone number');
    }
    
    if (verificationType === 'email') {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(contact)) {
        return setError('Please enter a valid email address');
      }
    } else {
      // Simple phone validation
      if (contact.length < 10) {
        return setError('Please enter a valid phone number');
      }
    }
    
    try {
      setLoading(true);
      
      let success;
      if (verificationType === 'email') {
        success = await sendEmailOTP(contact);
      } else {
        success = await sendPhoneOTP(contact);
      }
      
      if (!success) {
        if (authError) {
          throw new Error(authError);
        } else {
          throw new Error('Failed to send verification code');
        }
      }
      
      setSuccessMessage('Verification code sent successfully');
      setStep(3);
      setCountdown(60); // 60 seconds countdown for resend
      
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Simple validation
    if (!otp) {
      return setError('Please enter the verification code');
    }
    
    try {
      setLoading(true);
      
      let success;
      if (verificationType === 'email') {
        success = await verifyEmailOTP(contact, otp);
      } else {
        success = await verifyPhoneOTP(contact, otp);
      }
      
      if (!success) {
        if (authError) {
          throw new Error(authError);
        } else {
          throw new Error('Invalid verification code');
        }
      }
      
      setSuccessMessage('Verification successful');
      
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    try {
      setLoading(true);
      setError('');
      
      let success;
      if (verificationType === 'email') {
        success = await sendEmailOTP(contact);
      } else {
        success = await sendPhoneOTP(contact);
      }
      
      if (!success) {
        if (authError) {
          throw new Error(authError);
        } else {
          throw new Error('Failed to resend verification code');
        }
      }
      
      setSuccessMessage('Verification code resent successfully');
      setCountdown(60); // Reset countdown
      
    } catch (err) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  // Function to fill test account credentials
  const fillTestContact = (type) => {
    if (type === 'phone') {
      setVerificationType('phone');
      setContact('9876543210'); // Alex's phone
    } else if (type === 'email') {
      setVerificationType('email');
      setContact('alex@example.com'); // Alex's email
    }
  };
  
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h2>Login with OTP</h2>
        </div>
        
        {error && <div className="error-alert">{error}</div>}
        {successMessage && <div className="success-alert">{successMessage}</div>}
        
        {step === 1 && (
          <div className="method-selection">
            <p>Choose verification method:</p>
            <div className="method-buttons">
              <button 
                type="button"
                className="method-button phone-method"
                onClick={() => handleMethodSelect('phone')}
              >
                <span className="method-icon">📱</span>
                <span>Phone Number</span>
              </button>
              <button 
                type="button"
                className="method-button email-method"
                onClick={() => handleMethodSelect('email')}
              >
                <span className="method-icon">✉️</span>
                <span>Email</span>
              </button>
            </div>
            
            <div className="login-footer">
              <p>
                Remember your password? <Link to="/login">Login with Password</Link>
              </p>
              <p>
                Don't have an account? <Link to="/register">Register</Link>
              </p>
            </div>

            {/* Test Account Information */}
            <div className="test-accounts">
              <h3>Test Accounts:</h3>
              <div className="account-type">
                <button 
                  className="fill-test-account" 
                  onClick={() => fillTestContact('email')}
                >
                  Use Test Email (alex@example.com)
                </button>
              </div>
              <div className="account-type">
                <button 
                  className="fill-test-account" 
                  onClick={() => fillTestContact('phone')}
                >
                  Use Test Phone (9876543210)
                </button>
              </div>
              <p className="test-note">In dev mode, any 6-digit OTP will work</p>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <form className="login-form" onSubmit={handleContactSubmit}>
            <div className="form-group">
              <label htmlFor="contact">
                {verificationType === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <input
                type={verificationType === 'email' ? 'email' : 'tel'}
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={verificationType === 'email' ? 'Enter your email' : 'Enter your phone number'}
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button" 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
            
            <div className="back-option">
              <button 
                type="button" 
                className="back-button"
                onClick={() => setStep(1)}
              >
                Back
              </button>
            </div>
          </form>
        )}
        
        {step === 3 && (
          <form className="login-form" onSubmit={handleOtpSubmit}>
            <p className="otp-info">
              {verificationType === 'email' 
                ? `We've sent a verification code to ${contact}`
                : `We've sent a verification code to ${contact}`
              }
            </p>
            
            <div className="form-group">
              <label htmlFor="otp">Verification Code</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button" 
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            
            <div className="resend-otp">
              {countdown > 0 ? (
                <p>Resend code in {countdown} seconds</p>
              ) : (
                <button 
                  type="button" 
                  onClick={handleResendOTP} 
                  className="resend-button"
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
                onClick={() => setStep(2)}
              >
                Back
              </button>
            </div>

            {/* For dev testing */}
            <div className="test-accounts">
              <p className="test-note">In dev mode, any 6-digit OTP will work</p>
              <button 
                className="fill-test-account" 
                onClick={() => setOtp('123456')}
              >
                Use Test OTP (123456)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PhoneLogin; 