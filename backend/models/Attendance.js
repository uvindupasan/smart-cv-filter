// models/Attendance.js — Attendance Log Schema
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
    required: true,
    default: 'Engineering'
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  workingHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Absent', 'Half Day', 'On Leave', 'Work From Home'],
    default: 'Present'
  },
  workMode: {
    type: String,
    enum: ['On-site', 'Hybrid', 'Remote'],
    default: 'On-site'
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Ensure unique attendance entry per employee per date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
