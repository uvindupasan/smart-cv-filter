// models/Onboarding.js — Employee Onboarding Checklist Schema
const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Documentation', 'IT Setup', 'HR & Access', 'Orientation'],
    default: 'HR & Access'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
});

const onboardingSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  employeeName: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    default: 'Software Development'
  },
  designation: {
    type: String,
    default: 'Software Engineer'
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['In Progress', 'Completed'],
    default: 'In Progress'
  },
  progressPercentage: {
    type: Number,
    default: 0
  },
  completedTasksCount: {
    type: Number,
    default: 0
  },
  totalTasksCount: {
    type: Number,
    default: 9
  },
  checklist: [checklistItemSchema]
}, { timestamps: true });

// Pre-save hook to calculate progress percentage & status
onboardingSchema.pre('save', function(next) {
  if (this.checklist && this.checklist.length > 0) {
    this.totalTasksCount = this.checklist.length;
    this.completedTasksCount = this.checklist.filter(item => item.isCompleted).length;
    this.progressPercentage = Math.round((this.completedTasksCount / this.totalTasksCount) * 100);
    this.status = this.completedTasksCount === this.totalTasksCount ? 'Completed' : 'In Progress';
  }
  next();
});

module.exports = mongoose.model('Onboarding', onboardingSchema);
