const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    targetClass: {
      type: String,
    },
    targetSection: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
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

// Index
announcementSchema.index({ isActive: 1, createdAt: -1 });
announcementSchema.index({ targetClass: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
