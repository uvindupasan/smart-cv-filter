require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes            = require('./routes/auth');
const campaignRoutes        = require('./routes/campaigns');
const cvRoutes              = require('./routes/cvs');
const analyticsRoutes       = require('./routes/analytics');
const employeeRoutes        = require('./routes/employees');
const departmentRoutes      = require('./routes/departments');
const attendanceRoutes      = require('./routes/attendance');
const leaveRoutes           = require('./routes/leaves');
const onboardingRoutes      = require('./routes/onboarding');
const documentRoutes        = require('./routes/documents');
const startDeadlineScheduler = require('./scheduler');
const path                   = require('path');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/uploads/documents', express.static(path.join(__dirname, 'uploads/documents')));
app.use('/uploads/emp_documents', express.static(path.join(__dirname, 'uploads/emp_documents')));

// ── Routes ────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/campaigns',   campaignRoutes);
app.use('/api/cvs',         cvRoutes);
app.use('/api/analytics',   analyticsRoutes);
app.use('/api/employees',   employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/attendance',  attendanceRoutes);
app.use('/api/leaves',      leaveRoutes);
app.use('/api/onboarding',  onboardingRoutes);
app.use('/api/documents',   documentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart CV Filter API running' });
});

// ── MongoDB Connection ────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    // Start deadline auto-close scheduler (runs hourly + on startup)
    startDeadlineScheduler();
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

