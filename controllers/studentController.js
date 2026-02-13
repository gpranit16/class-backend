const Student = require('../models/Student');
const Marks = require('../models/Marks');
const Announcement = require('../models/Announcement');
const bcrypt = require('bcryptjs');

// @desc    Get student profile
// @route   GET /api/student/profile
exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, student });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update profile (limited fields)
// @route   PUT /api/student/profile
exports.updateProfile = async (req, res) => {
  try {
    const { contactNumber, address, email } = req.body;
    const student = await Student.findById(req.user._id);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: 'Student not found' });
    }

    if (email && email !== student.email) {
      const existing = await Student.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: 'Email already in use' });
      }
      student.email = email;
    }

    if (contactNumber) student.contactNumber = contactNumber;
    if (address !== undefined) student.address = address;

    await student.save();
    res.json({ success: true, student });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Change password
// @route   PUT /api/student/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const student = await Student.findById(req.user._id).select('+password');
    const isMatch = await student.matchPassword(currentPassword);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Current password is incorrect' });
    }

    student.password = newPassword;
    await student.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get student marks
// @route   GET /api/student/marks
exports.getMarks = async (req, res) => {
  try {
    const { examType, subject, fromDate, toDate } = req.query;
    const query = { studentId: req.user._id };

    if (examType) query.examType = examType;
    if (subject) query.subject = subject;
    if (fromDate || toDate) {
      query.examDate = {};
      if (fromDate) query.examDate.$gte = new Date(fromDate);
      if (toDate) query.examDate.$lte = new Date(toDate);
    }

    const marks = await Marks.find(query).sort({ examDate: -1 });

    // Calculate overall percentage
    let overallPercentage = 0;
    if (marks.length > 0) {
      const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
      const totalMax = marks.reduce((sum, m) => sum + m.totalMarks, 0);
      overallPercentage = parseFloat(
        ((totalObtained / totalMax) * 100).toFixed(2)
      );
    }

    res.json({
      success: true,
      marks,
      overallPercentage,
      totalExams: marks.length,
    });
  } catch (error) {
    console.error('Get marks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get results summary
// @route   GET /api/student/results/summary
exports.getResultsSummary = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Subject-wise average
    const subjectWiseAverage = await Marks.aggregate([
      { $match: { studentId: studentId } },
      {
        $group: {
          _id: '$subject',
          avgPercentage: { $avg: '$percentage' },
          totalExams: { $sum: 1 },
          highestScore: { $max: '$percentage' },
          lowestScore: { $min: '$percentage' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Exam-wise performance
    const examWisePerformance = await Marks.aggregate([
      { $match: { studentId: studentId } },
      {
        $group: {
          _id: '$examName',
          avgPercentage: { $avg: '$percentage' },
          examDate: { $first: '$examDate' },
          examType: { $first: '$examType' },
          subjects: { $sum: 1 },
        },
      },
      { $sort: { examDate: -1 } },
    ]);

    // Overall
    const overallStats = await Marks.aggregate([
      { $match: { studentId: studentId } },
      {
        $group: {
          _id: null,
          avgPercentage: { $avg: '$percentage' },
          totalExams: { $sum: 1 },
        },
      },
    ]);

    // Strengths & improvements
    const strengths = subjectWiseAverage
      .filter((s) => s.avgPercentage >= 80)
      .map((s) => s._id);
    const improvements = subjectWiseAverage
      .filter((s) => s.avgPercentage < 60)
      .map((s) => s._id);

    // Overall grade
    const avgPct =
      overallStats.length > 0 ? overallStats[0].avgPercentage : 0;
    let overallGrade = 'F';
    if (avgPct >= 90) overallGrade = 'A+';
    else if (avgPct >= 80) overallGrade = 'A';
    else if (avgPct >= 70) overallGrade = 'B+';
    else if (avgPct >= 60) overallGrade = 'B';
    else if (avgPct >= 50) overallGrade = 'C';
    else if (avgPct >= 40) overallGrade = 'D';

    // Class rank
    const classMarks = await Marks.aggregate([
      { $match: { class: req.user.class } },
      {
        $group: {
          _id: '$studentId',
          avgPercentage: { $avg: '$percentage' },
        },
      },
      { $sort: { avgPercentage: -1 } },
    ]);

    const rank = classMarks.findIndex(
      (m) => m._id.toString() === studentId.toString()
    ) + 1;
    const totalInClass = classMarks.length;

    res.json({
      success: true,
      subjectWiseAverage,
      examWisePerformance,
      overallGrade,
      overallPercentage: avgPct ? parseFloat(avgPct.toFixed(1)) : 0,
      rank: `${rank || '-'}/${totalInClass}`,
      strengths,
      improvements,
    });
  } catch (error) {
    console.error('Results summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get announcements for student
// @route   GET /api/student/announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const student = req.user;
    const now = new Date();

    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { targetClass: null },
        { targetClass: '' },
        { targetClass: { $exists: false } },
        { targetClass: student.class },
      ],
      $and: [
        {
          $or: [
            { expiryDate: null },
            { expiryDate: { $exists: false } },
            { expiryDate: { $gte: now } },
          ],
        },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'fullName username');

    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
