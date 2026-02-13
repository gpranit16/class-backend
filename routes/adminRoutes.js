const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getStudents,
  addStudent,
  getStudent,
  updateStudent,
  deleteStudent,
  addMarks,
  getMarks,
  updateMarks,
  deleteMarks,
  bulkUploadMarks,
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  getDashboardStats,
  getPerformanceAnalytics,
} = require('../controllers/adminController');

// All admin routes are protected
router.use(protect, adminOnly);

// Student management
router.route('/students').get(getStudents).post(addStudent);
router
  .route('/students/:id')
  .get(getStudent)
  .put(updateStudent)
  .delete(deleteStudent);

// Marks management
router.route('/marks').get(getMarks).post(addMarks);
router.post('/marks/bulk', bulkUploadMarks);
router.route('/marks/:id').put(updateMarks).delete(deleteMarks);

// Announcements
router.route('/announcements').get(getAnnouncements).post(createAnnouncement);
router
  .route('/announcements/:id')
  .put(updateAnnouncement)
  .delete(deleteAnnouncement);

// Dashboard & Analytics
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics/performance', getPerformanceAnalytics);

module.exports = router;
