const express = require('express');
const router = express.Router();
const {
  adminLogin,
  studentLogin,
  studentLoginByEmail,
  studentSignup,
  verifyToken,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/admin/login', adminLogin);
router.post('/student/login', studentLogin);
router.post('/student/login-by-email', studentLoginByEmail);
router.post('/student/signup', studentSignup);
router.post('/verify-token', protect, verifyToken);

module.exports = router;
