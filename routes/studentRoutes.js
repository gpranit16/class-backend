const express = require('express');
const router = express.Router();
const { protect, studentOnly } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  changePassword,
  getMarks,
  getResultsSummary,
  getAnnouncements,
} = require('../controllers/studentController');

// All student routes are protected
router.use(protect, studentOnly);

// Profile
router.route('/profile').get(getProfile).put(updateProfile);
router.put('/change-password', changePassword);

// Marks & Results
router.get('/marks', getMarks);
router.get('/results/summary', getResultsSummary);

// Announcements
router.get('/announcements', getAnnouncements);

module.exports = router;
