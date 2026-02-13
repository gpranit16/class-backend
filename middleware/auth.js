const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role === 'admin') {
        req.user = await Admin.findById(decoded.id).select('-password');
        req.userRole = 'admin';
      } else {
        req.user = await Student.findById(decoded.id).select('-password');
        req.userRole = 'student';
      }

      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: 'User not found' });
      }

      next();
    } catch (error) {
      console.error('Auth error:', error.message);
      return res
        .status(401)
        .json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized, no token' });
  }
};

// Admin only
exports.adminOnly = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res
      .status(403)
      .json({ success: false, message: 'Access denied. Admin only.' });
  }
  next();
};

// Student only
exports.studentOnly = (req, res, next) => {
  if (req.userRole !== 'student') {
    return res
      .status(403)
      .json({ success: false, message: 'Access denied. Student only.' });
  }
  next();
};
