const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    class: {
      type: String,
      required: [true, 'Class is required'],
      enum: ['6th', '7th', '8th', '9th', '10th', '11th', '12th'],
    },
    section: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
    },
    rollNo: {
      type: String,
      required: [true, 'Roll number is required'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    },
    parentName: {
      type: String,
      trim: true,
    },
    parentContact: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    address: {
      type: String,
    },
    profilePhoto: {
      type: String,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Auto-generate studentId before validation
studentSchema.pre('validate', async function (next) {
  if (this.isNew && !this.studentId) {
    const count = await mongoose.model('Student').countDocuments();
    this.studentId = `SPC${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes (studentId and email already indexed via unique: true)
studentSchema.index({ class: 1, section: 1 });

module.exports = mongoose.model('Student', studentSchema);
