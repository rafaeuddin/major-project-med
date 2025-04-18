const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
exports.isAuthenticated = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extract token from Bearer token
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ msg: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user to req.user
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ msg: 'Not authorized to access this route' });
  }
};

// Middleware for role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        msg: `User role ${req.user ? req.user.role : 'undefined'} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { isAuthenticated, authorize }; 