const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  phone: {
    type: String,
    sparse: true
  },
  email: {
    type: String,
    sparse: true
  },
  otp: {
    type: String,
    required: [true, 'OTP is required']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // OTP expires after 10 minutes (600 seconds)
  },
  verified: {
    type: Boolean,
    default: false
  }
});

// Ensure either phone or email is provided
OTPSchema.pre('save', function(next) {
  if (!this.phone && !this.email) {
    return next(new Error('Either phone or email must be provided'));
  }
  next();
});

module.exports = mongoose.model('OTP', OTPSchema); 