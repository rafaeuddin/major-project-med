import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const { login, currentUser, error: authError } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    role: 'patient' // Default role is patient
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if user is already logged in
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.identifier || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Call the login function from AuthContext
      const success = await login(formData.identifier, formData.password);
      
      if (!success && authError) {
        setError(authError);
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to fill test account credentials
  const fillTestAccount = (role) => {
    if (role === 'doctor') {
      setFormData({
        identifier: 'john.smith',
        password: 'password123',
        role: 'doctor'
      });
    } else if (role === 'patient') {
      setFormData({
        identifier: 'alex',
        password: 'password123',
        role: 'patient'
      });
    }
  };
  
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Medical Portal</h1>
          <p>Sign in to your account</p>
        </div>
        
        {error && (
          <div className="error-alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="role-selector">
            <p>Login as:</p>
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
            <label htmlFor="identifier">Username, Email or Phone</label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Enter your username, email, or phone"
              required
            />
          </div>
          
          <div className="form-group password-field">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
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
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          
          <div className="alt-login-options">
            <Link to="/phone-login" className="phone-login-link">
              Login with OTP
            </Link>
          </div>
        </form>
        
        <div className="login-footer">
          <p>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
        
        {/* Test Account Information */}
        <div className="test-accounts">
          <h3>Test Accounts:</h3>
          <div className="account-type">
            <h4>Doctor:</h4>
            <p>Username: john.smith</p>
            <p>Password: password123</p>
            <button 
              className="fill-test-account" 
              onClick={() => fillTestAccount('doctor')}
            >
              Use these credentials
            </button>
          </div>
          <div className="account-type">
            <h4>Patient:</h4>
            <p>Username: alex</p>
            <p>Password: password123</p>
            <button 
              className="fill-test-account" 
              onClick={() => fillTestAccount('patient')}
            >
              Use these credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 