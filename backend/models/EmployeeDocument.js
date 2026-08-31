// models/EmployeeDocument.js — Secure Employee Documents Schema
const mongoose = require('mongoose');

const employeeDocumentSchema = new mongoose.Schema({
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
  documentName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'CV',
      'NIC / Passport',
      'Educational certificates',
      'Employment contract',
      'Offer letter',
      'Medical certificates',
      'Service letters',
      'Warning letters',
      'Performance documents',
      'Other HR documents'
    ],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileOriginalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String,
    default: 'application/pdf'
  },
  uploadedBy: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeDocument', employeeDocumentSchema);
