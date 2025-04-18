const express = require('express');
const {
  registerWithEmail,
  registerWithPhone,
  login,
  sendPhoneOTP,
  sendEmailOTP,
  verifyPhoneOTP,
  verifyEmailOTP,
  getMe,
  logout
} = require('../controllers/auth.controller');

const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Registration routes
router.post('/register/email', registerWithEmail);
router.post('/register/phone', registerWithPhone);

// Login routes
router.post('/login', login);

// OTP verification routes
router.post('/send-phone-otp', sendPhoneOTP);
router.post('/send-email-otp', sendEmailOTP);
router.post('/verify-phone-otp', verifyPhoneOTP);
router.post('/verify-email-otp', verifyEmailOTP);

// Protected routes
router.get('/me', isAuthenticated, getMe);
router.get('/logout', isAuthenticated, logout);

module.exports = router; 