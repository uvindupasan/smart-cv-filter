// routes/attendance.js — Complete Attendance Management API
const express    = require('express');
const Attendance = require('../models/Attendance');
const Employee   = require('../models/Employee');
const { protect } = require('../middleware/auth');
const router     = express.Router();

// Helper to seed sample attendance logs if empty
async function seedSampleAttendance() {
  const count = await Attendance.countDocuments();
  if (count > 0) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const sampleLogs = [
    {
      employeeId: 'EMP-1001',
      employeeName: 'Kasun Prasanga Bandara',
      department: 'Engineering',
      date: todayStr,
      checkInTime: new Date(todayStr + 'T08:45:00'),
      checkOutTime: new Date(todayStr + 'T17:15:00'),
      workingHours: 8.5,
      status: 'Present',
      workMode: 'Hybrid',
      notes: 'On time'
    },
    {
      employeeId: 'EMP-1002',
      employeeName: 'Nimali Ruwanthika Jayasinghe',
      department: 'Engineering',
      date: todayStr,
      checkInTime: new Date(todayStr + 'T09:25:00'),
      checkOutTime: null,
      workingHours: 0,
      status: 'Late',
      workMode: 'On-site',
      notes: 'Heavy traffic on Kandy road'
    },
    {
      employeeId: 'EMP-1003',
      employeeName: 'Samanthi Priyadarshani Silva',
      department: 'Marketing',
      date: todayStr,
      checkInTime: new Date(todayStr + 'T08:50:00'),
      checkOutTime: new Date(todayStr + 'T17:30:00'),
      workingHours: 8.67,
      status: 'Work From Home',
      workMode: 'Remote',
      notes: 'WFH approved'
    },
    {
      employeeId: 'EMP-1004',
      employeeName: 'Dilshan Madusanka Perera',
      department: 'IT',
      date: todayStr,
      checkInTime: null,
      checkOutTime: null,
      workingHours: 0,
      status: 'On Leave',
      workMode: 'Remote',
      notes: 'Casual leave requested'
    },
    {
      employeeId: 'EMP-1005',
      employeeName: 'Mahesh Senanayake',
      department: 'Finance',
      date: todayStr,
      checkInTime: new Date(todayStr + 'T08:30:00'),
      checkOutTime: new Date(todayStr + 'T17:00:00'),
      workingHours: 8.5,
      status: 'Present',
      workMode: 'On-site',
      notes: 'Normal shift'
    }
  ];

  await Attendance.insertMany(sampleLogs);
}

// ── GET /api/attendance/today ─────────────────────────────────
// Get current user / employee's attendance state for today
router.get('/today', protect, async (req, res) => {
  try {
    await seedSampleAttendance();
    const todayStr = new Date().toISOString().split('T')[0];
    const employeeId = req.user?.employeeId || 'EMP-1001';

    let record = await Attendance.findOne({ employeeId, date: todayStr });
    res.json({ success: true, todayRecord: record || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/attendance/check-in ──────────────────────────────
// Employee Check In action
router.post('/check-in', protect, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const employeeId = req.user?.employeeId || 'EMP-1001';
    const employeeName = req.user?.name || 'Kasun Prasanga Bandara';
    const department = req.body.department || 'Engineering';
    const workMode = req.body.workMode || 'Hybrid';

    // Check cutoff for Late status (09:00 AM)
    const cutoffTime = new Date(todayStr + 'T09:00:00');
    const isLate = now > cutoffTime;
    const status = isLate ? 'Late' : (workMode === 'Remote' ? 'Work From Home' : 'Present');

    let record = await Attendance.findOne({ employeeId, date: todayStr });
    if (record && record.checkInTime) {
      return res.status(400).json({ success: false, message: 'You have already checked in today.' });
    }

    if (record) {
      record.checkInTime = now;
      record.status = status;
      record.workMode = workMode;
      await record.save();
    } else {
      record = await Attendance.create({
        employeeId,
        employeeName,
        department,
        date: todayStr,
        checkInTime: now,
        status,
        workMode
      });
    }

    res.json({ success: true, record, message: `Checked in successfully as ${status}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ── POST /api/attendance/check-out ─────────────────────────────
// Employee Check Out action & Auto Calculation of working hours
router.post('/check-out', protect, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const employeeId = req.user?.employeeId || 'EMP-1001';

    const record = await Attendance.findOne({ employeeId, date: todayStr });
    if (!record || !record.checkInTime) {
      return res.status(400).json({ success: false, message: 'No check-in record found for today.' });
    }

    record.checkOutTime = now;
    
    // Automatically calculate working hours in decimal format (e.g., 8.5 hours)
    const diffMs = now - new Date(record.checkInTime);
    const hours = Math.max(0, diffMs / (1000 * 60 * 60));
    record.workingHours = parseFloat(hours.toFixed(2));

    await record.save();

    res.json({
      success: true,
      record,
      message: `Checked out successfully! Total working hours: ${record.workingHours} hrs`
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ── GET /api/attendance ───────────────────────────────────────
// HR Attendance Log Listing with multi-filtering by Date, Department, Status, Search
router.get('/', protect, async (req, res) => {
  try {
    await seedSampleAttendance();

    const { date, department, status, search } = req.query;
    const filter = {};

    if (date) filter.date = date;
    if (department && department !== 'All') filter.department = department;
    if (status && status !== 'All') filter.status = status;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { employeeName: regex },
        { employeeId: regex },
        { department: regex },
        { notes: regex }
      ];
    }

    const attendanceLogs = await Attendance.find(filter).sort({ date: -1, checkInTime: -1 });

    // Meta stats calculation
    const totalPresent = attendanceLogs.filter(a => a.status === 'Present' || a.status === 'Work From Home').length;
    const totalLate    = attendanceLogs.filter(a => a.status === 'Late').length;
    const totalOnLeave = attendanceLogs.filter(a => a.status === 'On Leave').length;
    const totalAbsent  = attendanceLogs.filter(a => a.status === 'Absent').length;

    res.json({
      success: true,
      count: attendanceLogs.length,
      stats: { totalPresent, totalLate, totalOnLeave, totalAbsent },
      logs: attendanceLogs
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── PUT /api/attendance/:id ────────────────────────────────────
// HR Authorized edit of attendance record
router.put('/:id', protect, async (req, res) => {
  try {
    const { status, checkInTime, checkOutTime, notes, workMode } = req.body;
    const updateData = {};

    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (workMode) updateData.workMode = workMode;

    if (checkInTime) updateData.checkInTime = new Date(checkInTime);
    if (checkOutTime) updateData.checkOutTime = new Date(checkOutTime);

    // Recalculate working hours if both exist
    if (updateData.checkInTime && updateData.checkOutTime) {
      const diffMs = updateData.checkOutTime - updateData.checkInTime;
      updateData.workingHours = parseFloat((Math.max(0, diffMs) / (1000 * 60 * 60)).toFixed(2));
    }

    const record = await Attendance.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, record, message: 'Attendance record updated by HR' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ── GET /api/attendance/monthly-report ────────────────────────
// Generate Monthly Attendance Summary Report
router.get('/monthly-report', protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentYear  = year || new Date().getFullYear();
    const currentMonth = month || (new Date().getMonth() + 1);

    // Match records in year-month
    const regex = new RegExp(`^${currentYear}-${String(currentMonth).padStart(2, '0')}`);
    const logs  = await Attendance.find({ date: regex });

    // Group logs by employee
    const summaryMap = {};
    logs.forEach(log => {
      if (!summaryMap[log.employeeId]) {
        summaryMap[log.employeeId] = {
          employeeId: log.employeeId,
          employeeName: log.employeeName,
          department: log.department,
          presentDays: 0,
          lateDays: 0,
          leaveDays: 0,
          absentDays: 0,
          wfhDays: 0,
          totalWorkingHours: 0
        };
      }

      const emp = summaryMap[log.employeeId];
      if (log.status === 'Present') emp.presentDays += 1;
      if (log.status === 'Late') emp.lateDays += 1;
      if (log.status === 'On Leave') emp.leaveDays += 1;
      if (log.status === 'Absent') emp.absentDays += 1;
      if (log.status === 'Work From Home') emp.wfhDays += 1;
      emp.totalWorkingHours += (log.workingHours || 0);
    });

    const report = Object.values(summaryMap);
    res.json({ success: true, report, period: `${currentYear}-${currentMonth}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
