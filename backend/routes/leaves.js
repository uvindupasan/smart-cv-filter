// routes/leaves.js — Complete Leave Management REST API
const express      = require('express');
const multer       = require('multer');
const path         = require('path');
const fs           = require('fs');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const Employee     = require('../models/Employee');
const { protect }   = require('../middleware/auth');
const router       = express.Router();

// Configure Multer for supporting document uploads
const uploadDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Helper to seed initial leave balances & sample requests
async function seedSampleLeaves() {
  const empId = 'EMP-1001';
  let balance = await LeaveBalance.findOne({ employeeId: empId });
  if (!balance) {
    await LeaveBalance.create({
      employeeId: empId,
      year: new Date().getFullYear(),
      annualTotal: 14,
      annualUsed: 2,
      casualTotal: 7,
      casualUsed: 1,
      sickTotal: 7,
      sickUsed: 1,
      nopayUsed: 0
    });
  }

  const reqCount = await LeaveRequest.countDocuments();
  if (reqCount === 0) {
    const today = new Date();
    await LeaveRequest.insertMany([
      {
        employeeId: 'EMP-1001',
        employeeName: 'Kasun Prasanga Bandara',
        department: 'Engineering',
        leaveType: 'Annual Leave',
        startDate: new Date(today.getFullYear(), today.getMonth(), 10),
        endDate: new Date(today.getFullYear(), today.getMonth(), 12),
        totalDays: 2,
        reason: 'Family vacation to Nuwara Eliya',
        status: 'Approved',
        hrComment: 'Approved as per annual entitlement.',
        reviewedBy: 'HR Admin',
        reviewedAt: new Date()
      },
      {
        employeeId: 'EMP-1002',
        employeeName: 'Nimali Ruwanthika Jayasinghe',
        department: 'Engineering',
        leaveType: 'Sick Leave',
        startDate: new Date(today.getFullYear(), today.getMonth(), 15),
        endDate: new Date(today.getFullYear(), today.getMonth(), 15),
        totalDays: 1,
        reason: 'Doctor recommended rest for viral fever',
        status: 'Approved',
        hrComment: 'Medical certificate verified.',
        reviewedBy: 'HR Admin',
        reviewedAt: new Date()
      },
      {
        employeeId: 'EMP-1003',
        employeeName: 'Samanthi Priyadarshani Silva',
        department: 'Marketing',
        leaveType: 'Casual Leave',
        startDate: new Date(today.getFullYear(), today.getMonth(), 20),
        endDate: new Date(today.getFullYear(), today.getMonth(), 21),
        totalDays: 2,
        reason: 'Personal urgent matter at bank',
        status: 'Pending',
        hrComment: ''
      }
    ]);
  }
}

// ── GET /api/leaves/balance ────────────────────────────────────
// Get current employee's leave balance
router.get('/balance', protect, async (req, res) => {
  try {
    await seedSampleLeaves();
    const employeeId = req.query.employeeId || req.user?.employeeId || 'EMP-1001';
    let balance = await LeaveBalance.findOne({ employeeId });

    if (!balance) {
      balance = await LeaveBalance.create({
        employeeId,
        year: new Date().getFullYear(),
        annualTotal: 14,
        casualTotal: 7,
        sickTotal: 7
      });
    }

    res.json({ success: true, balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/leaves ───────────────────────────────────────────
// List all leave requests (with filters)
router.get('/', protect, async (req, res) => {
  try {
    await seedSampleLeaves();
    const { status, leaveType, department, search, myRequestsOnly } = req.query;
    const filter = {};

    if (myRequestsOnly === 'true') {
      filter.employeeId = req.user?.employeeId || 'EMP-1001';
    }

    if (status && status !== 'All') filter.status = status;
    if (leaveType && leaveType !== 'All') filter.leaveType = leaveType;
    if (department && department !== 'All') filter.department = department;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { employeeName: regex },
        { employeeId: regex },
        { reason: regex },
        { department: regex }
      ];
    }

    const requests = await LeaveRequest.find(filter).sort({ createdAt: -1 });

    const totalPending  = await LeaveRequest.countDocuments({ status: 'Pending' });
    const totalApproved = await LeaveRequest.countDocuments({ status: 'Approved' });
    const totalRejected = await LeaveRequest.countDocuments({ status: 'Rejected' });

    res.json({
      success: true,
      count: requests.length,
      stats: { totalPending, totalApproved, totalRejected },
      requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/leaves/request ──────────────────────────────────
// Submit a new leave request (supporting optional document attachment)
router.post('/request', protect, upload.single('document'), async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const employeeId = req.user?.employeeId || 'EMP-1001';
    const employeeName = req.user?.name || 'Kasun Prasanga Bandara';
    const department = req.body.department || 'Engineering';

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please complete all required fields.' });
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be prior to start date.' });
    }

    // Automatically calculate number of leave days
    let totalDays = 1;
    if (leaveType === 'Half Day') {
      totalDays = 0.5;
    } else {
      const diffTime = Math.abs(end - start);
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const documentUrl = req.file ? `/uploads/documents/${req.file.filename}` : '';

    const newRequest = await LeaveRequest.create({
      employeeId,
      employeeName,
      department,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      documentUrl,
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      request: newRequest,
      message: `Leave request for ${totalDays} day(s) submitted successfully!`
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ── PUT /api/leaves/:id/review ─────────────────────────────────
// HR or Manager Approve or Reject Leave Request & Update Leave Balance
router.put('/:id/review', protect, async (req, res) => {
  try {
    const { status, hrComment } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected.' });
    }

    const leaveReq = await LeaveRequest.findById(req.params.id);
    if (!leaveReq) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    leaveReq.status = status;
    leaveReq.hrComment = hrComment || '';
    leaveReq.reviewedBy = req.user?.name || 'HR Manager';
    leaveReq.reviewedAt = new Date();

    await leaveReq.save();

    // If Approved, automatically update and deduct from Leave Balance
    if (status === 'Approved') {
      let balance = await LeaveBalance.findOne({ employeeId: leaveReq.employeeId });
      if (!balance) {
        balance = await LeaveBalance.create({ employeeId: leaveReq.employeeId });
      }

      if (leaveReq.leaveType === 'Annual Leave') {
        balance.annualUsed += leaveReq.totalDays;
      } else if (leaveReq.leaveType === 'Casual Leave' || leaveReq.leaveType === 'Half Day') {
        balance.casualUsed += leaveReq.totalDays;
      } else if (leaveReq.leaveType === 'Sick Leave') {
        balance.sickUsed += leaveReq.totalDays;
      } else if (leaveReq.leaveType === 'No-pay Leave') {
        balance.nopayUsed += leaveReq.totalDays;
      }

      await balance.save();
    }

    res.json({
      success: true,
      request: leaveReq,
      message: `Leave request ${status.toLowerCase()} successfully!`
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ── PUT /api/leaves/entitlement ────────────────────────────────
// HR Configure yearly leave entitlement settings
router.put('/entitlement', protect, async (req, res) => {
  try {
    const { annualTotal, casualTotal, sickTotal } = req.body;
    const year = new Date().getFullYear();

    await LeaveBalance.updateMany(
      { year },
      { $set: { annualTotal: Number(annualTotal), casualTotal: Number(casualTotal), sickTotal: Number(sickTotal) } }
    );

    res.json({ success: true, message: 'Yearly leave entitlement updated for all staff.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
