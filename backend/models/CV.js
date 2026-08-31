const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },

  // ── Candidate Personal Info ─────────────────
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    required: [true, 'Gender is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },

  // ── Education & Skills ───────────────────────
  educationalInstitute: {
    type: String,
    required: [true, 'Educational institute is required']
  },
  degree: { type: String },
  graduationYear: { type: String },

  skills: {
    type: [String],
    required: [true, 'At least one skill is required']
  },
  skillsText: {
    type: String
  },

  // ── Statement ───────────────────────────────
  whyHireYou: {
    type: String,
    required: [true, 'Why hire you statement is required']
  },

  // ── Uploaded CV File ─────────────────────────
  cvFile: {
    originalName: { type: String },
    filename:     { type: String },
    size:         { type: Number },
    mimetype:     { type: String },
  },

  // ── Extracted PDF Text ───────────────────────
  // Full plain-text content extracted from the uploaded PDF.
  // Combined with form fields for richer SBERT semantic search.
  pdfText: {
    type:    String,
    default: ''
  },

  // ── AI Embedding ─────────────────────────────
  // default: undefined keeps the field absent until the AI service writes it,
  // avoiding Mongoose casting null → [] which breaks the search filter.
  embedding: {
    type: [Number],
    default: undefined,
  },

  // ── Status ──────────────────────────────────
  status: {
    type: String,
    enum: ['new', 'applied', 'reviewed', 'shortlisted', 'interview', 'selected', 'rejected'],
    default: 'applied'
  },

  // ── CRM Fields ──────────────────────────────
  notes: [{
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  }
}, { timestamps: true });

cvSchema.pre('save', function(next) {
  // Build a rich text representation for SBERT embedding.
  // Includes: form fields + full extracted PDF text for PDF content-aware search.
  const parts = [];
  if (this.skills && this.skills.length > 0) parts.push(this.skills.join(', '));
  if (this.degree) parts.push(this.degree);
  if (this.educationalInstitute) parts.push(this.educationalInstitute);
  if (this.whyHireYou) parts.push(this.whyHireYou);
  // Append extracted PDF content (limited to 2000 chars to keep embedding focused)
  if (this.pdfText && this.pdfText.trim()) {
    const cleanedPdfText = this.pdfText.replace(/\s+/g, ' ').trim().slice(0, 2000);
    parts.push(cleanedPdfText);
  }
  this.skillsText = parts.join('. ');
  next();
});

module.exports = mongoose.model('CV', cvSchema);
