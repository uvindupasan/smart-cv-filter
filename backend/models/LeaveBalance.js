// models/LeaveBalance.js — Leave Entitlement & Balance Schema
const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  year: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  annualTotal: {
    type: Number,
    default: 14
  },
  annualUsed: {
    type: Number,
    default: 0
  },
  casualTotal: {
    type: Number,
    default: 7
  },
  casualUsed: {
    type: Number,
    default: 0
  },
  sickTotal: {
    type: Number,
    default: 7
  },
  sickUsed: {
    type: Number,
    default: 0
  },
  nopayUsed: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
