// routes/campaigns.js — Job Campaign CRUD
const express  = require('express');
const Campaign = require('../models/Campaign');
const CV       = require('../models/CV');
const { protect } = require('../middleware/auth');
const router   = express.Router();

// ── GET /api/campaigns ───────────────────────
// Get all campaigns for the logged-in HR admin
router.get('/', protect, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: campaigns.length, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/campaigns ──────────────────────
// Create a new job campaign
router.post('/', protect, async (req, res) => {
  try {
    const {
      position,
      department,
      jobDescription,
      companyExpectations,
      candidateResponsibilities,
      requiredSkills,
      requiredQualifications,
      deadline
    } = req.body;

    const campaign = await Campaign.create({
      createdBy: req.user._id,
      position,
      department,
      jobDescription,
      companyExpectations,
      candidateResponsibilities,
      requiredSkills: requiredSkills || [],
      requiredQualifications,
      deadline: deadline ? new Date(deadline) : null
    });

    res.status(201).json({
      success: true,
      campaign,
      applyUrl: `${process.env.FRONTEND_URL}/apply/${campaign.slug}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/campaigns/public/:slug ─────────
// Public route — get campaign details by slug (for the Apply form)
// Returns campaign even if inactive, so frontend can show "Applications Closed" screen
router.get('/public/:slug', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      slug: req.params.slug
    }).select('position department jobDescription companyExpectations candidateResponsibilities requiredSkills slug isActive deadline');

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ── GET /api/campaigns/:id ───────────────────
// Get a single campaign with its CVs
router.get('/:id', protect, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const cvs = await CV.find({ campaign: campaign._id })
      .select('-embedding')  // Don't send the embedding vector to frontend
      .sort({ createdAt: -1 });

    res.json({ success: true, campaign, cvs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── PUT /api/campaigns/:id ───────────────────
// Update a campaign; auto-reactivate if deadline extended to future
router.put('/:id', protect, async (req, res) => {
  try {
    const updateData = { ...req.body };

    // ── Smart deadline logic ──────────────────────────────────
    // If caller sends a new deadline, evaluate whether the campaign
    // should be auto-activated or auto-deactivated based on that date.
    if ('deadline' in updateData) {
      if (updateData.deadline) {
        const deadlineDate = new Date(updateData.deadline);
        const now          = new Date();

        if (deadlineDate > now) {
          // New deadline is in the future → re-open the campaign
          // (only if it was closed due to deadline, not manually closed)
          const existing = await Campaign.findOne({ _id: req.params.id, createdBy: req.user._id });
          if (existing && !existing.isActive) {
            updateData.isActive = true;
            console.log(`[Campaign] Auto-reactivated: ${existing.position} (deadline extended to ${deadlineDate.toDateString()})`);
          }
        } else {
          // New deadline is in the past → immediately close campaign
          updateData.isActive = false;
        }
      } else {
        // Deadline cleared (set to null/empty) — do NOT change isActive
        updateData.deadline = null;
      }
    }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ── DELETE /api/campaigns/:id ────────────────
// Deactivate (soft delete) a campaign
router.delete('/:id', protect, async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({ success: true, message: 'Campaign deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/campaigns/:id/download-zip ──────
// PROTECTED — Download all uploaded CVs for a campaign as a ZIP
router.get('/:id/download-zip', protect, async (req, res) => {
  const path     = require('path');
  const fs       = require('fs');
  const archiver = require('archiver');

  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const cvs = await CV.find({ campaign: campaign._id });
    const uploadsDir = path.join(__dirname, '..', 'uploads');

    // Filter CVs that have valid uploaded PDF files
    const cvsWithFiles = cvs.filter(cv =>
      cv.cvFile && cv.cvFile.filename &&
      fs.existsSync(path.join(uploadsDir, cv.cvFile.filename))
    );

    if (cvsWithFiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No uploaded CV files found for this campaign'
      });
    }

    // Stream ZIP to client
    const safePosition = campaign.position.replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="CVs_${safePosition}.zip"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', err => res.status(500).end(err.message));
    archive.pipe(res);

    cvsWithFiles.forEach((cv, index) => {
      const filePath = path.join(uploadsDir, cv.cvFile.filename);
      const safeName = cv.fullName.replace(/[^a-zA-Z0-9_-]/g, '_');
      archive.file(filePath, { name: `${index + 1}_${safeName}.pdf` });
    });

    await archive.finalize();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

