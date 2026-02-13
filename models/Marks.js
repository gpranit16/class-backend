const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    studentName: {
      type: String,
    },
    class: {
      type: String,
    },
    examType: {
      type: String,
      required: true,
      enum: ['Unit Test', 'Mid Term', 'Final', 'Monthly Test', 'Weekly Test'],
    },
    examName: {
      type: String,
      required: [true, 'Exam name is required'],
    },
    examDate: {
      type: Date,
      required: [true, 'Exam date is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    marksObtained: {
      type: Number,
      required: [true, 'Marks obtained is required'],
      min: 0,
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      min: 1,
    },
    percentage: {
      type: Number,
    },
    grade: {
      type: String,
    },
    remarks: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

// Calculate percentage and grade before saving
marksSchema.pre('save', function (next) {
  this.percentage = parseFloat(
    ((this.marksObtained / this.totalMarks) * 100).toFixed(2)
  );

  if (this.percentage >= 90) this.grade = 'A+';
  else if (this.percentage >= 80) this.grade = 'A';
  else if (this.percentage >= 70) this.grade = 'B+';
  else if (this.percentage >= 60) this.grade = 'B';
  else if (this.percentage >= 50) this.grade = 'C';
  else if (this.percentage >= 40) this.grade = 'D';
  else this.grade = 'F';

  next();
});

// Indexes
marksSchema.index({ studentId: 1, examDate: -1 });
marksSchema.index({ class: 1, subject: 1 });
marksSchema.index({ examName: 1 });

module.exports = mongoose.model('Marks', marksSchema);
