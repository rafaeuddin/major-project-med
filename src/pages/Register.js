import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register, currentUser, error: authError } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'patient',
    specialization: '',
    licenseNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      // Redirect based on role
      if (currentUser.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else if (currentUser.role === 'patient') {
        navigate('/patient/dashboard');
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleGoBack = () => {
    navigate('/login');
  };
  
  const validateForm = () => {
    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Validate password
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Validate phone
    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(formData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    
    // Validate doctor-specific fields
    if (formData.role === 'doctor') {
      if (!formData.specialization) {
        setError('Please enter your medical specialization');
        return false;
      }
      
      if (!formData.licenseNumber) {
        setError('Please enter your medical license number');
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Prepare registration data
    const registrationData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: formData.role
    };
    
    // Add doctor-specific fields if role is doctor
    if (formData.role === 'doctor') {
      registrationData.specialization = formData.specialization;
      registrationData.licenseNumber = formData.licenseNumber;
    }
    
    try {
      const success = await register(registrationData);
      
      if (!success) {
        setError(authError || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during registration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="register-page">
      <div className="back-button-container">
        <button className="back-button" onClick={handleGoBack}>
          ← Back to Login
        </button>
      </div>
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
        
        <form onSubmit={handleSubmit} className="register-form">
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
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group password-field">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
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
            
            <div className="form-group password-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  required
                />
                <button 
                  type="button" 
                  className="toggle-password" 
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
          </div>
          
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
          
          {formData.role === 'doctor' && (
            <div className="doctor-fields">
              <div className="form-group">
                <label htmlFor="specialization">Medical Specialization</label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g. Cardiology, Pediatrics, etc."
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="licenseNumber">Medical License Number</label>
                <input
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="Enter your medical license ID"
                  required
                />
              </div>
            </div>
          )}
          
          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="register-footer">
          <p>
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 