const Student = require('../models/Student');
const Marks = require('../models/Marks');
const Announcement = require('../models/Announcement');

// ════════════════════════════════════════════════════════════
// STUDENT MANAGEMENT
// ════════════════════════════════════════════════════════════

// @desc    Get all students with pagination & filters
// @route   GET /api/admin/students
exports.getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const studentClass = req.query.class || '';
    const section = req.query.section || '';
    const status = req.query.status || '';

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (studentClass) query.class = studentClass;
    if (section) query.section = section;
    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add new student
// @route   POST /api/admin/students
exports.addStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      class: studentClass,
      section,
      rollNo,
      contactNumber,
      parentName,
      parentContact,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
    } = req.body;

    const existingStudent = await Student.findOne({ email: email.toLowerCase() });
    if (existingStudent) {
      return res
        .status(400)
        .json({ success: false, message: 'Email already registered' });
    }

    const student = await Student.create({
      name,
      email,
      password: password || 'spc123456',
      class: studentClass,
      section,
      rollNo,
      contactNumber,
      parentName,
      parentContact,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
    });

    res.status(201).json({
      success: true,
      student,
      studentId: student.studentId,
    });
  } catch (error) {
    console.error('Add student error:', error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: 'Duplicate entry found' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single student
// @route   GET /api/admin/students/:id
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, student });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update student
// @route   PUT /api/admin/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      class: studentClass,
      section,
      rollNo,
      contactNumber,
      parentName,
      parentContact,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      isActive,
    } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: 'Student not found' });
    }

    // Check duplicate email
    if (email && email !== student.email) {
      const existing = await Student.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: 'Email already in use' });
      }
    }

    student.name = name || student.name;
    student.email = email || student.email;
    student.class = studentClass || student.class;
    student.section = section !== undefined ? section : student.section;
    student.rollNo = rollNo || student.rollNo;
    student.contactNumber = contactNumber || student.contactNumber;
    student.parentName = parentName !== undefined ? parentName : student.parentName;
    student.parentContact = parentContact !== undefined ? parentContact : student.parentContact;
    student.dateOfBirth = dateOfBirth !== undefined ? dateOfBirth : student.dateOfBirth;
    student.gender = gender !== undefined ? gender : student.gender;
    student.bloodGroup = bloodGroup !== undefined ? bloodGroup : student.bloodGroup;
    student.address = address !== undefined ? address : student.address;
    student.isActive = isActive !== undefined ? isActive : student.isActive;

    await student.save();

    res.json({ success: true, student });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete student permanently
// @route   DELETE /api/admin/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: 'Student not found' });
    }

    // Also delete associated marks
    await Marks.deleteMany({ studentId: req.params.id });

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════
// MARKS MANAGEMENT
// ════════════════════════════════════════════════════════════

// @desc    Add marks for a student
// @route   POST /api/admin/marks
exports.addMarks = async (req, res) => {
  try {
    const {
      studentId,
      examName,
      examDate,
      examType,
      subject,
      marksObtained,
      totalMarks,
      remarks,
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: 'Student not found' });
    }

    if (marksObtained > totalMarks) {
      return res.status(400).json({
        success: false,
        message: 'Marks obtained cannot exceed total marks',
      });
    }

    const marks = await Marks.create({
      studentId: student._id,
      studentName: student.name,
      class: student.class,
      examName,
      examDate,
      examType,
      subject,
      marksObtained,
      totalMarks,
      remarks,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, marks });
  } catch (error) {
    console.error('Add marks error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get marks with filters
// @route   GET /api/admin/marks
exports.getMarks = async (req, res) => {
  try {
    const { studentId, class: studentClass, subject, examType } = req.query;
    const query = {};

    if (studentId) query.studentId = studentId;
    if (studentClass) query.class = studentClass;
    if (subject) query.subject = subject;
    if (examType) query.examType = examType;

    const marks = await Marks.find(query)
      .populate('studentId', 'studentId name class section')
      .sort({ examDate: -1 });

    res.json({ success: true, marks });
  } catch (error) {
    console.error('Get marks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update marks
// @route   PUT /api/admin/marks/:id
exports.updateMarks = async (req, res) => {
  try {
    const { marksObtained, totalMarks, remarks } = req.body;
    const marks = await Marks.findById(req.params.id);
    if (!marks) {
      return res
        .status(404)
        .json({ success: false, message: 'Marks entry not found' });
    }

    if (marksObtained !== undefined) marks.marksObtained = marksObtained;
    if (totalMarks !== undefined) marks.totalMarks = totalMarks;
    if (remarks !== undefined) marks.remarks = remarks;

    if (marks.marksObtained > marks.totalMarks) {
      return res.status(400).json({
        success: false,
        message: 'Marks obtained cannot exceed total marks',
      });
    }

    await marks.save();

    res.json({ success: true, marks });
  } catch (error) {
    console.error('Update marks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete marks
// @route   DELETE /api/admin/marks/:id
exports.deleteMarks = async (req, res) => {
  try {
    const marks = await Marks.findByIdAndDelete(req.params.id);
    if (!marks) {
      return res
        .status(404)
        .json({ success: false, message: 'Marks entry not found' });
    }
    res.json({ success: true, message: 'Marks entry deleted successfully' });
  } catch (error) {
    console.error('Delete marks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk upload marks
// @route   POST /api/admin/marks/bulk
exports.bulkUploadMarks = async (req, res) => {
  try {
    const { examName, examDate, examType, subject, totalMarks, students } =
      req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No students data provided' });
    }

    const marksEntries = [];

    for (const entry of students) {
      const student = await Student.findOne({
        $or: [{ _id: entry.studentId }, { studentId: entry.studentId }],
      });

      if (student) {
        marksEntries.push({
          studentId: student._id,
          studentName: student.name,
          class: student.class,
          examName,
          examDate,
          examType,
          subject,
          marksObtained: entry.marksObtained,
          totalMarks,
          createdBy: req.user._id,
        });
      }
    }

    const marks = await Marks.insertMany(marksEntries);

    // Recalculate percentages and grades (insertMany doesn't run pre-save)
    for (const mark of marks) {
      mark.percentage = parseFloat(
        ((mark.marksObtained / mark.totalMarks) * 100).toFixed(2)
      );
      if (mark.percentage >= 90) mark.grade = 'A+';
      else if (mark.percentage >= 80) mark.grade = 'A';
      else if (mark.percentage >= 70) mark.grade = 'B+';
      else if (mark.percentage >= 60) mark.grade = 'B';
      else if (mark.percentage >= 50) mark.grade = 'C';
      else if (mark.percentage >= 40) mark.grade = 'D';
      else mark.grade = 'F';
      await mark.save();
    }

    res.status(201).json({
      success: true,
      count: marks.length,
      marks,
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ════════════════════════════════════════════════════════════

// @desc    Create announcement
// @route   POST /api/admin/announcements
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority, targetClass, targetSection, expiryDate } =
      req.body;

    const announcement = await Announcement.create({
      title,
      content,
      priority,
      targetClass,
      targetSection,
      expiryDate,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, announcement });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all announcements
// @route   GET /api/admin/announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'fullName username');

    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update announcement
// @route   PUT /api/admin/announcements/:id
exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: 'Announcement not found' });
    }

    res.json({ success: true, announcement });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/admin/announcements/:id
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: 'Announcement not found' });
    }
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════
// DASHBOARD & ANALYTICS
// ════════════════════════════════════════════════════════════

// @desc    Dashboard stats
// @route   GET /api/admin/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ isActive: true });
    const totalExams = await Marks.distinct('examName').then((arr) => arr.length);

    // Class-wise count
    const classWiseCount = await Student.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$class', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Recent marks entries as activities
    const recentActivities = await Marks.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('studentName examName subject createdAt');

    // Average performance
    const avgPerformance = await Marks.aggregate([
      { $group: { _id: null, avgPercentage: { $avg: '$percentage' } } },
    ]);

    res.json({
      success: true,
      totalStudents,
      activeStudents,
      totalExams,
      averagePerformance:
        avgPerformance.length > 0
          ? parseFloat(avgPerformance[0].avgPercentage.toFixed(1))
          : 0,
      classWiseCount,
      recentActivities,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Performance analytics
// @route   GET /api/admin/analytics/performance
exports.getPerformanceAnalytics = async (req, res) => {
  try {
    const { class: studentClass, subject, examType } = req.query;
    const matchQuery = {};

    if (studentClass) matchQuery.class = studentClass;
    if (subject) matchQuery.subject = subject;
    if (examType) matchQuery.examType = examType;

    // Top performers
    const topPerformers = await Marks.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$studentId',
          studentName: { $first: '$studentName' },
          class: { $first: '$class' },
          avgPercentage: { $avg: '$percentage' },
          totalExams: { $sum: 1 },
        },
      },
      { $sort: { avgPercentage: -1 } },
      { $limit: 10 },
    ]);

    // Subject-wise analysis
    const subjectWiseAnalysis = await Marks.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$subject',
          avgPercentage: { $avg: '$percentage' },
          totalEntries: { $sum: 1 },
          maxScore: { $max: '$percentage' },
          minScore: { $min: '$percentage' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Monthly performance trend
    const monthlyTrend = await Marks.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$examDate' },
            month: { $month: '$examDate' },
          },
          avgPercentage: { $avg: '$percentage' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      topPerformers,
      subjectWiseAnalysis,
      monthlyTrend,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
