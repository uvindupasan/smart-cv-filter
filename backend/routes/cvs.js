const express  = require('express');
const axios    = require('axios');
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const { PDFParse } = require('pdf-parse');
async function pdfParse(pdfBuffer) {
  const u8 = new Uint8Array(pdfBuffer);
  const parser = new PDFParse(u8);
  await parser.load();
  const result = await parser.getText();
  const text = result.pages ? result.pages.map(page => page.text).join('\n') : '';
  return { text };
}
const Campaign = require('../models/Campaign');
const CV       = require('../models/CV');
const { protect } = require('../middleware/auth');
const router   = express.Router();

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ── Multer Setup ──────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cv-${uniqueSuffix}.pdf`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Multer error-handling wrapper so route errors don't bypass our JSON response
function handleUpload(req, res, next) {
  upload.single('cvFile')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum size is 5MB.'
        : err.message;
      return res.status(400).json({ success: false, message: msg });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}

// ── POST /api/cvs/submit/:slug ───────────────
// PUBLIC — Candidate submits their CV (multipart/form-data)
router.post('/submit/:slug', handleUpload, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ slug: req.params.slug, isActive: true });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found or closed' });
    }

    const {
      fullName, gender, address, email, phone,
      educationalInstitute, degree, graduationYear,
      skills, whyHireYou
    } = req.body;

    // skills arrives as a comma-separated string from FormData
    const skillsArray = typeof skills === 'string'
      ? skills.split(',').map(s => s.trim()).filter(Boolean)
      : (skills || []);

    const cvData = {
      campaign: campaign._id,
      fullName, gender, address, email, phone,
      educationalInstitute, degree, graduationYear,
      skills: skillsArray,
      whyHireYou,
    };

    // ── Extract text from uploaded PDF ──────────────────────────
    // Reads the PDF bytes and extracts plain text so SBERT can search
    // through the actual CV document content (not just form fields).
    if (req.file) {
      cvData.cvFile = {
        originalName: req.file.originalname,
        filename:     req.file.filename,
        size:         req.file.size,
        mimetype:     req.file.mimetype,
      };

      try {
        const pdfBuffer = fs.readFileSync(req.file.path);
        const parsed    = await pdfParse(pdfBuffer);
        // Store extracted text — pre-save hook will append it to skillsText
        cvData.pdfText  = parsed.text || '';
        console.log(`[PDF] Extracted ${cvData.pdfText.length} chars from ${req.file.originalname}`);
      } catch (pdfErr) {
        // Non-critical: if extraction fails, still save the CV without PDF text
        console.warn(`[PDF] Text extraction failed for ${req.file.originalname}: ${pdfErr.message}`);
        cvData.pdfText = '';
      }
    }

    const cv = await CV.create(cvData);

    await Campaign.findByIdAndUpdate(campaign._id, { $inc: { applicationCount: 1 } });

    generateEmbedding(cv._id, cv.skillsText).catch(err => {
      console.error('Embedding generation failed:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! We will contact you soon.',
      cvId: cv._id,
    });
  } catch (error) {
    // Delete uploaded file if CV creation fails
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper — call AI service to generate embedding
async function generateEmbedding(cvId, text) {
  try {
    const response = await axios.post(`${AI_URL}/embed`, { text });
    await CV.findByIdAndUpdate(cvId, { embedding: response.data.embedding });
    console.log(`Embedding generated for CV: ${cvId}`);
  } catch (err) {
    console.error(`Embedding failed for CV ${cvId}:`, err.message);
  }
}

// ── POST /api/cvs/reindex-pdfs ───────────────
// PROTECTED (Admin) — Re-extract PDF text and regenerate embeddings
// for all existing CVs that have uploaded PDF files.
// Useful after enabling PDF search to update historical submissions.
router.post('/reindex-pdfs', protect, async (req, res) => {
  try {
    // Find CVs with an uploaded PDF but no pdfText yet
    const cvs = await CV.find({
      'cvFile.filename': { $exists: true, $ne: null },
      $or: [{ pdfText: '' }, { pdfText: { $exists: false } }]
    });

    let processed = 0, failed = 0, skipped = 0;

    for (const cv of cvs) {
      const filePath = path.join(uploadsDir, cv.cvFile.filename);

      if (!fs.existsSync(filePath)) {
        skipped++;
        continue;
      }

      try {
        const buffer  = fs.readFileSync(filePath);
        const parsed  = await pdfParse(buffer);
        const pdfText = parsed.text || '';

        // Rebuild skillsText with PDF content
        const parts = [];
        if (cv.skills && cv.skills.length > 0) parts.push(cv.skills.join(', '));
        if (cv.degree)                parts.push(cv.degree);
        if (cv.educationalInstitute)  parts.push(cv.educationalInstitute);
        if (cv.whyHireYou)            parts.push(cv.whyHireYou);
        if (pdfText.trim())           parts.push(pdfText.replace(/\s+/g, ' ').trim().slice(0, 2000));

        const skillsText = parts.join('. ');

        await CV.findByIdAndUpdate(cv._id, { pdfText, skillsText });

        // Regenerate SBERT embedding with richer text
        await generateEmbedding(cv._id, skillsText);
        processed++;
      } catch (err) {
        console.warn(`[Reindex] Failed for CV ${cv._id}: ${err.message}`);
        failed++;
      }
    }

    res.json({
      success: true,
      message: `Re-indexing complete. Processed: ${processed}, Failed: ${failed}, Skipped (file missing): ${skipped}`,
      stats: { processed, failed, skipped, total: cvs.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});



// ── GET /api/cvs/search ──────────────────────
// PROTECTED — AI-powered semantic search across CVs
router.get('/search', protect, async (req, res) => {
  try {
    const { query, campaignId } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    let campaignIds;
    if (campaignId) {
      const campaign = await Campaign.findOne({ _id: campaignId, createdBy: req.user._id });
      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Campaign not found' });
      }
      campaignIds = [campaignId];
    } else {
      const campaigns = await Campaign.find({ createdBy: req.user._id });
      campaignIds = campaigns.map(c => c._id);
    }

    // 'embedding.0' checks the first element exists — correctly excludes null AND empty []
    const cvs = await CV.find({
      campaign: { $in: campaignIds },
      'embedding.0': { $exists: true },
    }).select('-__v').populate('campaign', 'position slug');

    // Safety-net: drop any document whose embedding is empty after Mongoose hydration
    const validCvs = cvs.filter(cv => Array.isArray(cv.embedding) && cv.embedding.length > 0);

    if (validCvs.length === 0) {
      return res.json({
        success: true, query, resultCount: 0, results: [],
        message: 'No CVs have been indexed yet. Embeddings are generated after submission.',
      });
    }

    const aiResponse = await axios.post(`${AI_URL}/search`, {
      query,
      cv_ids:     validCvs.map(cv => cv._id.toString()),
      embeddings: validCvs.map(cv => cv.embedding),
    });

    const { ranked_ids, scores } = aiResponse.data;

    const cvMap = {};
    validCvs.forEach(cv => { cvMap[cv._id.toString()] = cv; });

    const results = ranked_ids.map((id, index) => {
      const cv = cvMap[id];
      const cvObj = cv.toObject();
      delete cvObj.embedding;
      return { ...cvObj, matchScore: Math.round(scores[index] * 100) };
    }).filter(r => r.matchScore > 10);

    res.json({ success: true, query, resultCount: results.length, results });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/cvs/:id/file ────────────────────
// PROTECTED — Stream the uploaded PDF file to the HR admin
router.get('/:id/file', protect, async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id)
      .populate('campaign', 'position createdBy');

    if (!cv) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }
    if (cv.campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!cv.cvFile || !cv.cvFile.filename) {
      return res.status(404).json({ success: false, message: 'No uploaded CV file for this application' });
    }

    const filePath = path.join(uploadsDir, cv.cvFile.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${cv.cvFile.originalName}"`);
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/cvs/:id ─────────────────────────
// PROTECTED — Get a single CV's full details
router.get('/:id', protect, async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id)
      .select('-embedding')
      .populate('campaign', 'position slug createdBy');

    if (!cv) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }
    if (cv.campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, cv });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── PUT /api/cvs/:id/status ──────────────────
// PROTECTED — Update CV status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'applied', 'reviewed', 'shortlisted', 'interview', 'selected', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const cv = await CV.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-embedding').populate('campaign', 'position createdBy');

    if (!cv || cv.campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }

    res.json({ success: true, cv });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/cvs/:id/notes ──────────────────
// PROTECTED — Add a recruiter note
router.post('/:id/notes', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Note text required' });
    }

    const cv = await CV.findById(req.params.id).populate('campaign', 'createdBy');
    if (!cv || cv.campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }

    cv.notes = cv.notes || [];
    cv.notes.push({ text: text.trim(), createdAt: new Date() });
    await cv.save();

    res.json({ success: true, cv });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── PUT /api/cvs/:id/rating ─────────────────
// PROTECTED — Update candidate rating (0-5 stars)
router.put('/:id/rating', protect, async (req, res) => {
  try {
    const { rating } = req.body;
    const rNum = Number(rating);
    if (isNaN(rNum) || rNum < 0 || rNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 0 and 5' });
    }

    const cv = await CV.findByIdAndUpdate(
      req.params.id,
      { rating: rNum },
      { new: true }
    ).select('-embedding').populate('campaign', 'position createdBy');

    if (!cv || cv.campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }

    res.json({ success: true, cv });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
