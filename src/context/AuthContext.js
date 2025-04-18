import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // Define test accounts for development
  const TEST_ACCOUNTS = {
    'john.smith': {
      id: 'doctor123',
      username: 'john.smith',
      name: 'Dr. John Smith',
      email: 'john.smith@example.com',
      phone: '1234567890',
      password: 'password123',
      role: 'doctor',
      specialization: 'Cardiology',
      isEmailVerified: true,
      isPhoneVerified: true
    },
    'alex': {
      id: 'patient123',
      username: 'alex',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      phone: '9876543210',
      password: 'password123',
      role: 'patient',
      isEmailVerified: true,
      isPhoneVerified: true
    }
  };

  // Flag to indicate if we're using test accounts (dev mode)
  const DEV_MODE = process.env.NODE_ENV === 'development';

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
      // In dev mode with test accounts, just return the current user
      if (DEV_MODE && currentUser) {
        return currentUser;
      }

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

  // Handle login with identifier (username/email/phone) and password
  const handleLogin = async (identifier, password) => {
    setError('');
    
    try {
      // In development mode, check test accounts first
      if (DEV_MODE) {
        // Check if the identifier matches any test account
        const testUser = Object.values(TEST_ACCOUNTS).find(
          account => account.username === identifier || 
                      account.email === identifier || 
                      account.phone === identifier
        );
        
        if (testUser && testUser.password === password) {
          // Generate mock token
          const mockToken = `test_token_${Date.now()}`;
          
          // Login the test user
          login(mockToken, {
            id: testUser.id,
            name: testUser.name,
            username: testUser.username,
            email: testUser.email,
            phone: testUser.phone,
            role: testUser.role,
            isEmailVerified: testUser.isEmailVerified,
            isPhoneVerified: testUser.isPhoneVerified
          });
          
          return true;
        } else if (testUser) {
          setError('Invalid password');
          return false;
        }
      }
      
      // If not in dev mode or no matching test account, try regular API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Login failed');
        return false;
      }
      
      login(data.token, data.user);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
      return false;
    }
  };

  // Register with email
  const registerWithEmail = async (formData) => {
    try {
      setError('');
      
      // In development mode with test accounts
      if (DEV_MODE) {
        // Check if email or username already exists
        const emailExists = Object.values(TEST_ACCOUNTS).some(
          account => account.email === formData.email
        );
        
        const usernameExists = Object.values(TEST_ACCOUNTS).some(
          account => account.username === formData.username
        );
        
        if (emailExists) {
          setError('Email already in use');
          return false;
        }
        
        if (usernameExists) {
          setError('Username already in use');
          return false;
        }
        
        // In a real app we would add the user to the database
        console.log('DEV MODE: User registered:', formData);
        
        // Return success for development
        return true;
      }
      
      // Regular API call for production
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
      
      // In development mode with test accounts
      if (DEV_MODE) {
        // Check if phone or username already exists
        const phoneExists = Object.values(TEST_ACCOUNTS).some(
          account => account.phone === formData.phone
        );
        
        const usernameExists = Object.values(TEST_ACCOUNTS).some(
          account => account.username === formData.username
        );
        
        if (phoneExists) {
          setError('Phone number already in use');
          return false;
        }
        
        if (usernameExists) {
          setError('Username already in use');
          return false;
        }
        
        // In a real app we would add the user to the database
        console.log('DEV MODE: User registered:', formData);
        
        // Return success for development
        return true;
      }
      
      // Regular API call for production
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
      
      // In development mode, auto-verify with any OTP
      if (DEV_MODE) {
        // Find test account with this email
        const testUser = Object.values(TEST_ACCOUNTS).find(
          account => account.email === email
        );
        
        if (testUser) {
          // Generate mock token and log in the user
          const mockToken = `test_token_${Date.now()}`;
          
          login(mockToken, {
            id: testUser.id,
            name: testUser.name,
            username: testUser.username,
            email: testUser.email,
            phone: testUser.phone,
            role: testUser.role,
            isEmailVerified: true,
            isPhoneVerified: testUser.isPhoneVerified
          });
          
          return true;
        } else {
          setError('Email not found');
          return false;
        }
      }
      
      // Regular API call for production
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
      
      // In development mode, auto-verify with any OTP
      if (DEV_MODE) {
        // Find test account with this phone
        const testUser = Object.values(TEST_ACCOUNTS).find(
          account => account.phone === phone
        );
        
        if (testUser) {
          // Generate mock token and log in the user
          const mockToken = `test_token_${Date.now()}`;
          
          login(mockToken, {
            id: testUser.id,
            name: testUser.name,
            username: testUser.username,
            email: testUser.email,
            phone: testUser.phone,
            role: testUser.role,
            isEmailVerified: testUser.isEmailVerified,
            isPhoneVerified: true
          });
          
          return true;
        } else {
          setError('Phone number not found');
          return false;
        }
      }
      
      // Regular API call for production
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

  // Send phone OTP
  const sendPhoneOTP = async (phone) => {
    try {
      setError('');
      
      // In development mode, just simulate sending OTP
      if (DEV_MODE) {
        // Check if phone exists in test accounts
        const phoneExists = Object.values(TEST_ACCOUNTS).some(
          account => account.phone === phone
        );
        
        if (!phoneExists) {
          setError('Phone number not registered');
          return false;
        }
        
        console.log(`DEV MODE: OTP sent to ${phone}. Use any 6 digits to verify.`);
        return true;
      }
      
      // Regular API call for production
      const response = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Failed to send OTP');
        return false;
      }
      
      return true;
    } catch (err) {
      setError('An error occurred while sending OTP');
      console.error(err);
      return false;
    }
  };
  
  // Send email OTP
  const sendEmailOTP = async (email) => {
    try {
      setError('');
      
      // In development mode, just simulate sending OTP
      if (DEV_MODE) {
        // Check if email exists in test accounts
        const emailExists = Object.values(TEST_ACCOUNTS).some(
          account => account.email === email
        );
        
        if (!emailExists) {
          setError('Email not registered');
          return false;
        }
        
        console.log(`DEV MODE: OTP sent to ${email}. Use any 6 digits to verify.`);
        return true;
      }
      
      // Regular API call for production
      const response = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Failed to send OTP');
        return false;
      }
      
      return true;
    } catch (err) {
      setError('An error occurred while sending OTP');
      console.error(err);
      return false;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login: handleLogin,
    logout,
    authFetch,
    registerWithEmail,
    registerWithPhone,
    verifyEmailOTP,
    verifyPhoneOTP,
    sendPhoneOTP,
    sendEmailOTP
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 