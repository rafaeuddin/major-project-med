const OTP = require('../models/OTP');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Twilio configuration - replace with your Twilio credentials in production
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client if credentials are available
let twilioClient;
if (accountSid && authToken) {
  twilioClient = require('twilio')(accountSid, authToken);
}

// Email transporter
let emailTransporter;
const setupEmailTransporter = () => {
  if (!emailTransporter && process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    emailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
};
setupEmailTransporter();

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send OTP via Twilio SMS
 */
const sendSmsOTP = async (phone, otp) => {
  // Check if Twilio is configured
  if (!twilioClient) {
    console.log(`[DEV MODE] Would send OTP ${otp} to ${phone}`);
    return { success: true, message: 'OTP would be sent in production' };
  }

  try {
    await twilioClient.messages.create({
      body: `Your verification code is: ${otp}. Valid for 10 minutes.`,
      from: twilioPhone,
      to: phone
    });

    return { success: true, message: 'OTP sent successfully via SMS' };
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    return { success: false, message: 'Failed to send OTP via SMS' };
  }
};

/**
 * Send OTP via Email
 */
const sendEmailOTP = async (email, otp) => {
  if (!emailTransporter) {
    console.log(`[DEV MODE] Would send OTP ${otp} to ${email}`);
    return { success: true, message: 'OTP would be sent in production' };
  }

  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Your Verification Code</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Please use the following code to verify your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; padding: 10px 20px; background-color: #f5f5f5; border-radius: 5px;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #777; line-height: 1.5;">This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
        </div>
      `
    });
    
    return { success: true, message: 'OTP sent successfully via email' };
  } catch (error) {
    console.error('Error sending email OTP:', error);
    return { success: false, message: 'Failed to send OTP via email' };
  }
};

/**
 * Generate and store OTP for a phone number
 */
const createPhoneOTP = async (phone) => {
  try {
    // Check if phone number exists
    const user = await User.findOne({ phone });
    
    if (!user) {
      return { 
        success: false, 
        message: 'Phone number not registered' 
      };
    }

    // Generate a new OTP
    const newOTP = generateOTP();
    
    // Save OTP to database
    await OTP.findOneAndUpdate(
      { phone },
      { phone, otp: newOTP, verified: false },
      { upsert: true, new: true }
    );
    
    // Send OTP to user
    const sendResult = await sendSmsOTP(phone, newOTP);
    
    if (!sendResult.success) {
      return { 
        success: false, 
        message: 'Failed to send OTP' 
      };
    }
    
    return { 
      success: true, 
      message: 'OTP generated and sent successfully',
      phone
    };
  } catch (error) {
    console.error('Error creating phone OTP:', error);
    return { 
      success: false, 
      message: 'Internal server error' 
    };
  }
};

/**
 * Generate and store OTP for an email
 */
const createEmailOTP = async (email) => {
  try {
    // Check if email exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return { 
        success: false, 
        message: 'Email not registered' 
      };
    }

    // Generate a new OTP
    const newOTP = generateOTP();
    
    // Save OTP to database
    await OTP.findOneAndUpdate(
      { email },
      { email, otp: newOTP, verified: false },
      { upsert: true, new: true }
    );
    
    // Send OTP to user
    const sendResult = await sendEmailOTP(email, newOTP);
    
    if (!sendResult.success) {
      return { 
        success: false, 
        message: 'Failed to send OTP' 
      };
    }
    
    return { 
      success: true, 
      message: 'OTP generated and sent successfully to your email',
      email
    };
  } catch (error) {
    console.error('Error creating email OTP:', error);
    return { 
      success: false, 
      message: 'Internal server error' 
    };
  }
};

/**
 * Verify phone OTP entered by user
 */
const verifyPhoneOTP = async (phone, userOTP) => {
  try {
    // Find the OTP record
    const otpRecord = await OTP.findOne({ phone });
    
    if (!otpRecord) {
      return { 
        success: false, 
        message: 'OTP not found or expired' 
      };
    }
    
    // Check if OTP matches
    if (otpRecord.otp !== userOTP) {
      return { 
        success: false, 
        message: 'Invalid OTP' 
      };
    }
    
    // Check if OTP is already verified
    if (otpRecord.verified) {
      return { 
        success: false, 
        message: 'OTP already used' 
      };
    }
    
    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();
    
    // Get user details for token generation
    const user = await User.findOne({ phone });
    
    if (!user) {
      return { 
        success: false, 
        message: 'User not found' 
      };
    }

    // Mark user's phone as verified
    user.isPhoneVerified = true;
    await user.save();
    
    // Generate JWT token
    const token = user.getSignedJwtToken();
    
    return { 
      success: true, 
      message: 'Phone verification successful',
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
    };
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    return { 
      success: false, 
      message: 'Internal server error' 
    };
  }
};

/**
 * Verify email OTP entered by user
 */
const verifyEmailOTP = async (email, userOTP) => {
  try {
    // Find the OTP record
    const otpRecord = await OTP.findOne({ email });
    
    if (!otpRecord) {
      return { 
        success: false, 
        message: 'OTP not found or expired' 
      };
    }
    
    // Check if OTP matches
    if (otpRecord.otp !== userOTP) {
      return { 
        success: false, 
        message: 'Invalid OTP' 
      };
    }
    
    // Check if OTP is already verified
    if (otpRecord.verified) {
      return { 
        success: false, 
        message: 'OTP already used' 
      };
    }
    
    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();
    
    // Get user details for token generation
    const user = await User.findOne({ email });
    
    if (!user) {
      return { 
        success: false, 
        message: 'User not found' 
      };
    }

    // Mark user's email as verified
    user.isEmailVerified = true;
    await user.save();
    
    // Generate JWT token
    const token = user.getSignedJwtToken();
    
    return { 
      success: true, 
      message: 'Email verification successful',
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
    };
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    return { 
      success: false, 
      message: 'Internal server error' 
    };
  }
};

module.exports = {
  createPhoneOTP,
  createEmailOTP,
  verifyPhoneOTP,
  verifyEmailOTP
}; 