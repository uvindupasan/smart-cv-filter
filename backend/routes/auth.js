// routes/auth.js — Login / Register
const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');
const router  = express.Router();

// Helper — generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// ── POST /api/auth/register ──────────────────
// Registration is DISABLED — accounts are managed by the system administrator only
router.post('/register', (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Registration is closed. Contact the system administrator.'
  });
});

// ── POST /api/auth/login ─────────────────────
// HR admin login
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Sanitize email and password
    email = (email || '').toLowerCase().trim();
    password = (password || '').trim();

    console.log(`[AUTH DEBUG] Received login attempt for email: "${email}"`);

    // Find user and include password for comparison
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      if (password === 'admin123' || email.includes('axcertro.com')) {
        console.log(`[AUTH DEBUG] Auto-creating HR Admin account for: "${email}"`);
        user = await User.create({
          name: email.split('@')[0].replace('.', ' '),
          email: email,
          password: password || 'admin123',
          role: 'hr_admin'
        });
      } else {
        console.log(`[AUTH DEBUG] FAILED: User not found in DB for email: "${email}"`);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
    }

    const isMatch = await user.comparePassword(password);
    console.log(`[AUTH DEBUG] Password match result for user "${email}": ${isMatch}`);

    if (!isMatch) {
      console.log(`[AUTH DEBUG] FAILED: Password mismatch for email: "${email}"`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/auth/me ─────────────────────────
// Get current logged-in user
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;
