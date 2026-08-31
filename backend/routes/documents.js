// routes/documents.js — Secure Employee Document Management API
const express          = require('express');
const multer           = require('multer');
const path             = require('path');
const fs               = require('fs');
const EmployeeDocument = require('../models/EmployeeDocument');
const { protect }      = require('../middleware/auth');
const router           = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/emp_documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'doc-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Helper to seed sample document records if empty
async function seedSampleDocuments() {
  const count = await EmployeeDocument.countDocuments();
  if (count === 0) {
    const dummyFile = path.join(uploadDir, 'sample-contract.pdf');
    if (!fs.existsSync(dummyFile)) {
      fs.writeFileSync(dummyFile, '%PDF-1.4 Employee Agreement Sample Document Content');
    }

    await EmployeeDocument.create({
      employeeId: 'EMP-1001',
      employeeName: 'Kasun Prasanga Bandara',
      documentName: 'Employment Agreement 2026.pdf',
      category: 'Employment contract',
      fileUrl: '/uploads/emp_documents/sample-contract.pdf',
      fileOriginalName: 'Employment_Agreement_Kasun.pdf',
      fileSize: 1024 * 250,
      mimeType: 'application/pdf',
      uploadedBy: 'admin@axcertro.com',
      notes: 'Signed NDA and Non-compete included'
    });

    await EmployeeDocument.create({
      employeeId: 'EMP-1001',
      employeeName: 'Kasun Prasanga Bandara',
      documentName: 'National ID Copy (NIC).pdf',
      category: 'NIC / Passport',
      fileUrl: '/uploads/emp_documents/sample-contract.pdf',
      fileOriginalName: 'NIC_Kasun_931200421V.pdf',
      fileSize: 1024 * 120,
      mimeType: 'application/pdf',
      uploadedBy: 'admin@axcertro.com',
      notes: 'Verified against original card'
    });

    await EmployeeDocument.create({
      employeeId: 'EMP-1002',
      employeeName: 'Nimali Ruwanthika Jayasinghe',
      documentName: 'B.Sc Software Engineering Degree Certificate.pdf',
      category: 'Educational certificates',
      fileUrl: '/uploads/emp_documents/sample-contract.pdf',
      fileOriginalName: 'BSc_Degree_Nimali.pdf',
      fileSize: 1024 * 540,
      mimeType: 'application/pdf',
      uploadedBy: 'admin@axcertro.com',
      notes: 'First Class Honors - University of Moratuwa'
    });
  }
}

// ── GET /api/documents ───────────────────────────────────────
// Get all employee documents with filtering & stats
router.get('/', protect, async (req, res) => {
  try {
    await seedSampleDocuments();
    const { employeeId, category, search } = req.query;
    const filter = {};

    if (employeeId && employeeId !== 'All') filter.employeeId = employeeId;
    if (category && category !== 'All') filter.category = category;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { documentName: regex },
        { employeeName: regex },
        { employeeId: regex },
        { category: regex },
        { notes: regex }
      ];
    }

    const documents = await EmployeeDocument.find(filter).sort({ createdAt: -1 });

    const totalCount = documents.length;
    const categoriesCount = {
      contracts: documents.filter(d => d.category === 'Employment contract' || d.category === 'Offer letter').length,
      identity: documents.filter(d => d.category === 'NIC / Passport').length,
      academic: documents.filter(d => d.category === 'Educational certificates' || d.category === 'CV').length,
      medicalAndOther: documents.filter(d => d.category === 'Medical certificates' || d.category === 'Warning letters' || d.category === 'Other HR documents').length
    };

    res.json({
      success: true,
      count: totalCount,
      stats: { totalCount, ...categoriesCount },
      documents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/documents/upload ───────────────────────────────
// Upload a new confidential employee document
router.post('/upload', protect, upload.single('documentFile'), async (req, res) => {
  try {
    const { employeeId, employeeName, documentName, category, notes } = req.body;

    if (!employeeId || !documentName || !category) {
      return res.status(400).json({ success: false, message: 'Employee ID, Document Name, and Category are required.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a document file to upload.' });
    }

    const fileUrl = `/uploads/emp_documents/${req.file.filename}`;

    const newDoc = await EmployeeDocument.create({
      employeeId,
      employeeName: employeeName || 'Employee ' + employeeId,
      documentName,
      category,
      fileUrl,
      fileOriginalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user?.name || req.user?.email || 'HR Admin',
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      document: newDoc,
      message: `Document "${documentName}" uploaded securely!`
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ── GET /api/documents/:id/download ──────────────────────────
// Stream / download document securely for authorized users
router.get('/:id/download', protect, async (req, res) => {
  try {
    const doc = await EmployeeDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const filename = path.basename(doc.fileUrl);
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Physical document file missing on server.' });
    }

    res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileOriginalName}"`);
    fs.createReadStream(filePath).pipe(res);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── DELETE /api/documents/:id ────────────────────────────────
// Delete document record & file
router.delete('/:id', protect, async (req, res) => {
  try {
    const doc = await EmployeeDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const filename = path.basename(doc.fileUrl);
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await doc.deleteOne();

    res.json({ success: true, message: 'Document removed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
