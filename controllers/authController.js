const Admin = require('../models/Admin');
const Student = require('../models/Student');
const generateToken = require('../utils/generateToken');

// @desc    Admin Login
// @route   POST /api/auth/admin/login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide email and password' });
    }

    const admin = await Admin.findOne({
      $or: [{ email }, { username: email }],
    }).select('+password');

    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(admin._id, 'admin');

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Student Login
// @route   POST /api/auth/student/login
exports.studentLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Student ID/Email and password',
      });
    }

    const student = await Student.findOne({
      $or: [{ email: identifier.toLowerCase() }, { studentId: identifier }],
      isActive: true,
    }).select('+password');

    if (!student) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await student.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(student._id, 'student');

    res.json({
      success: true,
      token,
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        class: student.class,
        section: student.section,
      },
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Student Signup
// @route   POST /api/auth/student/signup
exports.studentSignup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      contactNumber,
      class: studentClass,
      section,
      rollNo,
      parentName,
      parentContact,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
    } = req.body;

    if (!name || !email || !password || !contactNumber || !studentClass || !rollNo) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ email: email.toLowerCase() });
    if (existingStudent) {
      return res
        .status(400)
        .json({ success: false, message: 'Email already registered' });
    }

    const student = await Student.create({
      name,
      email,
      password,
      contactNumber,
      class: studentClass,
      section,
      rollNo,
      parentName,
      parentContact,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      studentId: student.studentId,
    });
  } catch (error) {
    console.error('Student signup error:', error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: 'Email or Student ID already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Verify token
// @route   POST /api/auth/verify-token
exports.verifyToken = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
      role: req.userRole,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
