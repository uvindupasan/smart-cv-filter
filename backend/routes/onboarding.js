// routes/onboarding.js — Employee Onboarding Checklist REST API
const express    = require('express');
const Onboarding = require('../models/Onboarding');
const Employee   = require('../models/Employee');
const { protect } = require('../middleware/auth');
const router     = express.Router();

const DEFAULT_CHECKLIST = [
  { taskId: 'task-1', title: 'Personal details completed', category: 'Documentation', isCompleted: true, notes: 'Verified NIC and Emergency contacts' },
  { taskId: 'task-2', title: 'Employment agreement uploaded', category: 'Documentation', isCompleted: true, notes: 'Signed NDA and offer letter received' },
  { taskId: 'task-3', title: 'Company email created', category: 'IT Setup', isCompleted: true, notes: 'Google Workspace account active' },
  { taskId: 'task-4', title: 'HR system account created', category: 'HR & Access', isCompleted: true, notes: 'Portal credentials sent' },
  { taskId: 'task-5', title: 'Laptop assigned', category: 'IT Setup', isCompleted: false, notes: 'MacBook Pro M2 serial #MP89234' },
  { taskId: 'task-6', title: 'Software access provided', category: 'IT Setup', isCompleted: false, notes: 'GitHub, Slack, Jira access pending' },
  { taskId: 'task-7', title: 'Company policies shared', category: 'HR & Access', isCompleted: false, notes: 'Employee handbook sent' },
  { taskId: 'task-8', title: 'Orientation completed', category: 'Orientation', isCompleted: false, notes: 'Scheduled for Monday 10 AM' },
  { taskId: 'task-9', title: 'Department introduction completed', category: 'Orientation', isCompleted: false, notes: 'Team intro session' }
];

// Helper to seed sample onboarding data
async function seedSampleOnboarding() {
  const count = await Onboarding.countDocuments();
  if (count === 0) {
    await Onboarding.create({
      employeeId: 'EMP-1001',
      employeeName: 'Kasun Prasanga Bandara',
      department: 'Software Development',
      designation: 'Senior Full Stack Engineer',
      joiningDate: new Date('2026-08-01'),
      checklist: DEFAULT_CHECKLIST
    });

    await Onboarding.create({
      employeeId: 'EMP-1002',
      employeeName: 'Nimali Ruwanthika Jayasinghe',
      department: 'Quality Assurance',
      designation: 'QA Lead Automation Specialist',
      joiningDate: new Date('2026-08-15'),
      checklist: DEFAULT_CHECKLIST.map((item, idx) => ({ ...item, isCompleted: idx < 8 }))
    });
  }
}

// ── GET /api/onboarding ───────────────────────────────────────
// Get all onboarding checklists (with filters)
router.get('/', protect, async (req, res) => {
  try {
    await seedSampleOnboarding();
    const { status, department, search } = req.query;
    const filter = {};

    if (status && status !== 'All') filter.status = status;
    if (department && department !== 'All') filter.department = department;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { employeeName: regex },
        { employeeId: regex },
        { designation: regex },
        { department: regex }
      ];
    }

    const onboardings = await Onboarding.find(filter).sort({ createdAt: -1 });

    const totalCount     = onboardings.length;
    const inProgressCount = onboardings.filter(o => o.status === 'In Progress').length;
    const completedCount  = onboardings.filter(o => o.status === 'Completed').length;
    const avgProgress     = totalCount > 0 ? Math.round(onboardings.reduce((acc, o) => acc + o.progressPercentage, 0) / totalCount) : 0;

    res.json({
      success: true,
      count: totalCount,
      stats: { totalCount, inProgressCount, completedCount, avgProgress },
      onboardings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/onboarding/:employeeId ───────────────────────────
// Get single employee onboarding details
router.get('/:employeeId', protect, async (req, res) => {
  try {
    const onboarding = await Onboarding.findOne({ employeeId: req.params.employeeId });
    if (!onboarding) {
      return res.status(404).json({ success: false, message: 'Onboarding record not found.' });
    }
    res.json({ success: true, onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/onboarding/initiate ─────────────────────────────
// HR Manually initiate onboarding for an employee
router.post('/initiate', protect, async (req, res) => {
  try {
    const { employeeId, employeeName, department, designation, joiningDate } = req.body;

    if (!employeeId || !employeeName) {
      return res.status(400).json({ success: false, message: 'Employee ID and Name are required.' });
    }

    const existing = await Onboarding.findOne({ employeeId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Onboarding already initiated for this employee.' });
    }

    const newOnboarding = await Onboarding.create({
      employeeId,
      employeeName,
      department: department || 'Software Development',
      designation: designation || 'Software Engineer',
      joiningDate: joiningDate || new Date(),
      checklist: DEFAULT_CHECKLIST.map(item => ({ ...item, isCompleted: false, notes: '' }))
    });

    res.status(201).json({
      success: true,
      onboarding: newOnboarding,
      message: `Onboarding checklist initiated for ${employeeName}!`
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ── PUT /api/onboarding/:id/task/:taskId ──────────────────────
// Toggle checklist task completion status
router.put('/:id/task/:taskId', protect, async (req, res) => {
  try {
    const { isCompleted, notes } = req.body;
    const onboarding = await Onboarding.findById(req.params.id);

    if (!onboarding) {
      return res.status(404).json({ success: false, message: 'Onboarding profile not found.' });
    }

    const task = onboarding.checklist.find(t => t.taskId === req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task item not found in checklist.' });
    }

    task.isCompleted = isCompleted;
    if (notes !== undefined) task.notes = notes;
    if (isCompleted) {
      task.completedAt = new Date();
      task.completedBy = req.user?.name || 'HR Admin';
    } else {
      task.completedAt = undefined;
      task.completedBy = '';
    }

    await onboarding.save();

    res.json({
      success: true,
      onboarding,
      message: `Task "${task.title}" updated!`
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ── POST /api/onboarding/:id/custom-task ──────────────────────
// Add custom task to employee's onboarding checklist
router.post('/:id/custom-task', protect, async (req, res) => {
  try {
    const { title, category, notes } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const onboarding = await Onboarding.findById(req.params.id);
    if (!onboarding) {
      return res.status(404).json({ success: false, message: 'Onboarding profile not found.' });
    }

    const taskId = 'task-' + Date.now();
    onboarding.checklist.push({
      taskId,
      title,
      category: category || 'HR & Access',
      isCompleted: false,
      notes: notes || ''
    });

    await onboarding.save();

    res.status(201).json({
      success: true,
      onboarding,
      message: `Custom task "${title}" added to checklist!`
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
