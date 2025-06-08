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

  // Replace fillTestAccount with support for all test accounts
  const testDoctorAccounts = [
    { username: 'drsarah', email: 'drsarah@demo.com', password: 'Test@1234', name: 'Dr. Sarah Johnson', specialization: 'General Physician' },
    { username: 'drmichael', email: 'drmichael@demo.com', password: 'Test@1234', name: 'Dr. Michael Chen', specialization: 'Cardiologist' },
    { username: 'dremily', email: 'dremily@demo.com', password: 'Test@1234', name: 'Dr. Emily Rodriguez', specialization: 'Pediatrician' },
    { username: 'drdavid', email: 'drdavid@demo.com', password: 'Test@1234', name: 'Dr. David Kim', specialization: 'Dermatologist' },
    { username: 'drpatricia', email: 'drpatricia@demo.com', password: 'Test@1234', name: 'Dr. Patricia Moore', specialization: 'Neurologist' }
  ];
  const testPatientAccounts = [
    { username: 'patientalice', email: 'alice@demo.com', password: 'Test@1234', name: 'Alice' },
    { username: 'patientbob', email: 'bob@demo.com', password: 'Test@1234', name: 'Bob' },
    { username: 'patientcarol', email: 'carol@demo.com', password: 'Test@1234', name: 'Carol' },
    { username: 'patientdan', email: 'dan@demo.com', password: 'Test@1234', name: 'Dan' },
    { username: 'patientemma', email: 'emma@demo.com', password: 'Test@1234', name: 'Emma' }
  ];

  const fillTestAccount = (account, role) => {
    setFormData({
      identifier: account.username,
      password: account.password,
      role
    });
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
        
        {/* Replace the test-accounts section with a split table for doctors and patients */}
        <div className="test-accounts">
          <h3>Test Login Credentials</h3>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h4>Doctors</h4>
              <table style={{ width: '100%', fontSize: '13px', marginBottom: '1rem' }}>
                <thead>
                  <tr><th>Username</th><th>Email</th><th>Password</th><th></th></tr>
                </thead>
                <tbody>
                  {testDoctorAccounts.map((acc, idx) => (
                    <tr key={acc.username}>
                      <td>{acc.username}</td>
                      <td>{acc.email}</td>
                      <td>{acc.password}</td>
                      <td><button className="fill-test-account" type="button" onClick={() => fillTestAccount(acc, 'doctor')}>Fill</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h4>Patients</h4>
              <table style={{ width: '100%', fontSize: '13px', marginBottom: '1rem' }}>
                <thead>
                  <tr><th>Username</th><th>Email</th><th>Password</th><th></th></tr>
                </thead>
                <tbody>
                  {testPatientAccounts.map((acc, idx) => (
                    <tr key={acc.username}>
                      <td>{acc.username}</td>
                      <td>{acc.email}</td>
                      <td>{acc.password}</td>
                      <td><button className="fill-test-account" type="button" onClick={() => fillTestAccount(acc, 'patient')}>Fill</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 