import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Test accounts for development
  const testAccounts = {
    'john.smith@example.com': {
      _id: 'doctor123',
      name: 'Dr. John Smith',
      email: 'john.smith@example.com',
      role: 'doctor',
      password: 'password123',
      specialization: 'Cardiology',
      phone: '1234567890'
    },
    'alex@example.com': {
      _id: 'patient123',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      role: 'patient',
      password: 'password123',
      phone: '9876543210',
      medicalHistory: [
        {
          title: 'Annual Checkup',
          description: 'Regular checkup, all vitals normal',
          date: '2023-01-15'
        }
      ],
      emergencyContact: {
        name: 'Sarah Johnson',
        phone: '5551234567',
        relationship: 'Spouse'
      }
    }
  };

  useEffect(() => {
    // Check if there's a token in localStorage and fetch user data
    const fetchUser = async () => {
      if (token) {
        try {
          // For a real app, we would fetch from the server
          // const response = await fetch('/api/users/me', {
          //   headers: {
          //     Authorization: `Bearer ${token}`
          //   }
          // });

          // For development with test accounts
          const userData = JSON.parse(localStorage.getItem('currentUser'));
          if (userData) {
            setCurrentUser(userData);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Failed to authenticate user');
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  // Login function with role parameter
  const login = async (email, password, role) => {
    setLoading(true);
    setError(null);
    
    try {
      // For development with test accounts
      const testUser = testAccounts[email];
      
      if (testUser && testUser.password === password) {
        // Check if role matches
        if (testUser.role !== role) {
          setError(`The selected role does not match this account. This is a ${testUser.role} account.`);
          setLoading(false);
          return false;
        }
        
        // Generate a mock token
        const mockToken = `mock-token-${Date.now()}`;
        localStorage.setItem('token', mockToken);
        localStorage.setItem('currentUser', JSON.stringify(testUser));
        localStorage.setItem('userRole', testUser.role);
        
        setToken(mockToken);
        setCurrentUser(testUser);
        
        return true;
      }
      
      // For a real app, we would make an API call
      // const response = await fetch('/api/users/login', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ email, password, role })
      // });
      
      // const data = await response.json();
      
      // if (response.ok) {
      //   localStorage.setItem('token', data.token);
      //   setToken(data.token);
      //   
      //   // Store user role in localStorage for persistence
      //   localStorage.setItem('userRole', data.user.role);
      //   
      //   // Set current user with data from response
      //   setCurrentUser(data.user);
      //   
      //   return true;
      // }

      // If we reach here with test accounts, credentials are invalid
      setError('Invalid email or password');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      // For development with test accounts
      // Check if email already exists
      if (testAccounts[userData.email]) {
        setError('Email already exists');
        return false;
      }
      
      // Create a new test user
      const newUser = {
        _id: `user${Date.now()}`,
        ...userData
      };
      
      // Update test accounts (this is just for demo, in a real app we'd persist to a database)
      // testAccounts[userData.email] = newUser;
      
      // Generate a mock token
      const mockToken = `mock-token-${Date.now()}`;
      localStorage.setItem('token', mockToken);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      localStorage.setItem('userRole', newUser.role);
      
      setToken(mockToken);
      setCurrentUser(newUser);
      
      return true;
      
      // For a real app, we would make an API call
      // const response = await fetch('/api/users/register', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(userData)
      // });
      // 
      // const data = await response.json();
      // 
      // if (response.ok) {
      //   localStorage.setItem('token', data.token);
      //   setToken(data.token);
      //   
      //   // Store user role in localStorage for persistence
      //   localStorage.setItem('userRole', data.user.role);
      //   
      //   // Set current user with data from response
      //   setCurrentUser(data.user);
      //   
      //   return true;
      // } else {
      //   setError(data.msg || 'Registration failed');
      //   return false;
      // }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred during registration');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
    setToken(null);
    setCurrentUser(null);
  };

  // Helper function for authenticated API requests
  const authFetch = async (url, options = {}) => {
    if (!token) {
      throw new Error('No authentication token');
    }

    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`
      }
    };

    // For a real app, we would make an actual API call
    // const response = await fetch(url, authOptions);
    
    // For development with test accounts, we'll mock responses
    let response;
    
    // Mock appointment data
    if (url === '/api/appointments') {
      const mockAppointments = {
        appointments: [
          {
            _id: 'appt1',
            patientId: testAccounts['alex@example.com'],
            doctorId: testAccounts['john.smith@example.com'],
            date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            timeSlot: '10:00 AM',
            reason: 'Annual checkup',
            status: 'scheduled'
          },
          {
            _id: 'appt2',
            patientId: testAccounts['alex@example.com'],
            doctorId: testAccounts['john.smith@example.com'],
            date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            timeSlot: '02:00 PM',
            reason: 'Follow-up',
            status: 'completed',
            notes: 'Patient is recovering well'
          }
        ]
      };
      
      response = {
        ok: true,
        json: async () => mockAppointments
      };
    } else {
      // Default mock response
      response = {
        ok: true,
        json: async () => ({ message: 'Mock response' })
      };
    }
    
    if (response.status === 401) {
      // Token expired or invalid
      logout();
      throw new Error('Session expired. Please login again.');
    }
    
    return response;
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    authFetch
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 