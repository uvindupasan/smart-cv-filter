// models/Designation.js — Designation Schema
const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    enum: ['Junior', 'Mid-Level', 'Senior', 'Lead', 'Executive'],
    default: 'Mid-Level'
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Designation', designationSchema);
