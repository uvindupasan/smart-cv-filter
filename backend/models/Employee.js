// models/Employee.js — Complete Enterprise HR Employee Schema
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  dateOfBirth: {
    type: Date
  },
  personalEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  companyEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relation: { type: String, default: '' }
  },
  department: {
    type: String,
    required: true,
    enum: ['Engineering', 'Marketing', 'Human Resources', 'Finance', 'Operations', 'Product', 'Sales', 'IT'],
    default: 'Engineering'
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  employmentType: {
    type: String,
    required: true,
    enum: ['Permanent', 'Probation', 'Internship', 'Contract', 'Part-time'],
    default: 'Permanent'
  },
  joiningDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  probationStartDate: {
    type: Date
  },
  probationEndDate: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive', 'Resigned', 'Terminated'],
    default: 'Active'
  },
  manager: {
    type: String,
    default: 'N/A'
  },
  workingLocation: {
    type: String,
    default: 'Colombo HQ'
  },
  workMode: {
    type: String,
    enum: ['On-site', 'Hybrid', 'Remote'],
    default: 'Hybrid'
  },
  salary: {
    basicSalary: { type: Number, default: 0 },
    allowance: { type: Number, default: 0 },
    currency: { type: String, default: 'LKR' }
  },
  skills: [{ type: String }],
  technologies: [{ type: String }],
  education: [{
    degree: { type: String },
    institution: { type: String },
    year: { type: String }
  }],
  experience: [{
    company: { type: String },
    role: { type: String },
    duration: { type: String }
  }],
  bankDetails: {
    bankName: { type: String, default: '' },
    branch: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    accountName: { type: String, default: '' }
  },
  documents: [{
    name: { type: String },
    fileUrl: { type: String },
    type: { type: String }
  }]
}, { timestamps: true });

// Index search fields for performance
employeeSchema.index({ fullName: 'text', companyEmail: 'text', employeeId: 'text', designation: 'text' });

module.exports = mongoose.model('Employee', employeeSchema);
