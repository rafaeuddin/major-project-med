import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // Check if user is logged in on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      setToken(token);
      setCurrentUser(JSON.parse(user));
    }
    
    setLoading(false);
  }, []);

  // Fetch user data from token
  const fetchUserData = async () => {
    if (!token) return null;

    try {
      const response = await authFetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Login function - called with token and user from API
  const login = (authToken, user) => {
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(authToken);
    setCurrentUser(user);
    return true;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setCurrentUser(null);
  };

  // Reusable fetch function with auth token
  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    return fetch(url, config);
  };

  // Register with email
  const registerWithEmail = async (formData) => {
    try {
      setError('');
      const response = await fetch('/api/auth/register/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Registration failed');
        return false;
      }
      
      return true;
    } catch (err) {
      setError('An error occurred during registration');
      console.error(err);
      return false;
    }
  };

  // Register with phone
  const registerWithPhone = async (formData) => {
    try {
      setError('');
      const response = await fetch('/api/auth/register/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Registration failed');
        return false;
      }
      
      return true;
    } catch (err) {
      setError('An error occurred during registration');
      console.error(err);
      return false;
    }
  };

  // Verify email OTP
  const verifyEmailOTP = async (email, otp) => {
    try {
      setError('');
      const response = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Verification failed');
        return false;
      }
      
      login(data.token, data.user);
      return true;
    } catch (err) {
      setError('An error occurred during verification');
      console.error(err);
      return false;
    }
  };

  // Verify phone OTP
  const verifyPhoneOTP = async (phone, otp) => {
    try {
      setError('');
      const response = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Verification failed');
        return false;
      }
      
      login(data.token, data.user);
      return true;
    } catch (err) {
      setError('An error occurred during verification');
      console.error(err);
      return false;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    authFetch,
    registerWithEmail,
    registerWithPhone,
    verifyEmailOTP,
    verifyPhoneOTP
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 