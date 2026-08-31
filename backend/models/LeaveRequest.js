// models/LeaveRequest.js — Leave Request Schema
const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    trim: true
  },
  employeeName: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    default: 'Engineering'
  },
  leaveType: {
    type: String,
    enum: ['Annual Leave', 'Casual Leave', 'Sick Leave', 'No-pay Leave', 'Half Day', 'Other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true,
    default: 1
  },
  reason: {
    type: String,
    required: true
  },
  documentUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  hrComment: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
