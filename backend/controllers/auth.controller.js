const User = require('../models/User');
const OTPService = require('../services/otp.service');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Register a new user with email
 * @route   POST /api/auth/register/email
 * @access  Public
 */
exports.registerWithEmail = asyncHandler(async (req, res, next) => {
  const { name, username, email, password, role, specialization } = req.body;

  // Validate required fields
  if (!name || !username || !email || !password) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }

  // Check if user already exists with this email or username
  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return next(new ErrorResponse('Email already in use', 400));
    }
    if (existingUser.username === username) {
      return next(new ErrorResponse('Username already in use', 400));
    }
  }

  // Create user
  const user = await User.create({
    name,
    username,
    email,
    password,
    role,
    specialization
  });

  // Send verification OTP to email
  const otpResult = await OTPService.createEmailOTP(email);
  
  if (!otpResult.success) {
    return next(new ErrorResponse('Failed to send verification email', 500));
  }

  // Response should not contain the verification token yet
  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email address.',
    email: user.email
  });
});

/**
 * @desc    Register a new user with phone
 * @route   POST /api/auth/register/phone
 * @access  Public
 */
exports.registerWithPhone = asyncHandler(async (req, res, next) => {
  const { name, username, phone, password, role, specialization } = req.body;

  // Validate required fields
  if (!name || !username || !phone || !password) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }

  // Check if user already exists with this phone or username
  const existingUser = await User.findOne({ 
    $or: [{ phone }, { username }]
  });

  if (existingUser) {
    if (existingUser.phone === phone) {
      return next(new ErrorResponse('Phone number already in use', 400));
    }
    if (existingUser.username === username) {
      return next(new ErrorResponse('Username already in use', 400));
    }
  }

  // Create user
  const user = await User.create({
    name,
    username,
    phone,
    password,
    role,
    specialization
  });

  // Send verification OTP to phone
  const otpResult = await OTPService.createPhoneOTP(phone);
  
  if (!otpResult.success) {
    return next(new ErrorResponse('Failed to send verification SMS', 500));
  }

  // Response should not contain the verification token yet
  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your phone number.',
    phone: user.phone
  });
});

/**
 * @desc    Login user with username/email and password
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { identifier, password } = req.body;

  // Validate identifier & password
  if (!identifier || !password) {
    return next(new ErrorResponse('Please provide login credentials', 400));
  }

  // Check for user using either username or email
  const user = await User.findOne({
    $or: [
      { email: identifier },
      { username: identifier },
      { phone: identifier }
    ]
  }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Send OTP to user's phone
 * @route   POST /api/auth/send-phone-otp
 * @access  Public
 */
exports.sendPhoneOTP = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new ErrorResponse('Please provide a phone number', 400));
  }

  const result = await OTPService.createPhoneOTP(phone);

  if (!result.success) {
    return next(new ErrorResponse(result.message, 400));
  }

  res.status(200).json({
    success: true,
    message: result.message,
    phone: result.phone
  });
});

/**
 * @desc    Send OTP to user's email
 * @route   POST /api/auth/send-email-otp
 * @access  Public
 */
exports.sendEmailOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Please provide an email address', 400));
  }

  const result = await OTPService.createEmailOTP(email);

  if (!result.success) {
    return next(new ErrorResponse(result.message, 400));
  }

  res.status(200).json({
    success: true,
    message: result.message,
    email: result.email
  });
});

/**
 * @desc    Verify phone OTP and login
 * @route   POST /api/auth/verify-phone-otp
 * @access  Public
 */
exports.verifyPhoneOTP = asyncHandler(async (req, res, next) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return next(new ErrorResponse('Please provide phone number and OTP', 400));
  }

  const result = await OTPService.verifyPhoneOTP(phone, otp);

  if (!result.success) {
    return next(new ErrorResponse(result.message, 400));
  }

  res.status(200).json({
    success: true,
    message: result.message,
    token: result.token,
    user: result.user
  });
});

/**
 * @desc    Verify email OTP and login
 * @route   POST /api/auth/verify-email-otp
 * @access  Public
 */
exports.verifyEmailOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new ErrorResponse('Please provide email and OTP', 400));
  }

  const result = await OTPService.verifyEmailOTP(email, otp);

  if (!result.success) {
    return next(new ErrorResponse(result.message, 400));
  }

  res.status(200).json({
    success: true,
    message: result.message,
    token: result.token,
    user: result.user
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Log user out / clear cookie
 * @route   GET /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone, 
      role: user.role,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified
    }
  });
}; 