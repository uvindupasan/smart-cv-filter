// models/Campaign.js — Job Campaign data
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const campaignSchema = new mongoose.Schema({
  // Unique slug for the public apply link
  slug: {
    type: String,
    unique: true,
    default: () => uuidv4().split('-')[0] + uuidv4().split('-')[1]
  },
  // HR admin who created this campaign
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Job details
  position: {
    type: String,
    required: [true, 'Position title is required'],
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  jobDescription: {
    type: String,
    required: [true, 'Job description is required']
  },
  companyExpectations: {
    type: String,
    required: [true, 'Company expectations are required']
  },
  candidateResponsibilities: {
    type: String,
    required: [true, 'Candidate responsibilities are required']
  },
  requiredSkills: {
    type: [String],
    default: []
  },
  requiredQualifications: {
    type: String
  },
  // ── Deadline ──────────────────────────────────
  deadline: {
    type: Date,
    default: null
  },
  // Campaign status
  isActive: {
    type: Boolean,
    default: true
  },
  // Application count (denormalized for performance)
  applicationCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Virtual for the public apply URL
campaignSchema.virtual('applyUrl').get(function() {
  return `${process.env.FRONTEND_URL}/apply/${this.slug}`;
});

campaignSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Campaign', campaignSchema);
