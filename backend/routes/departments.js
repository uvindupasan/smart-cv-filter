// routes/departments.js — Department & Designation CRUD API
const express     = require('express');
const Department  = require('../models/Department');
const Designation = require('../models/Designation');
const { protect } = require('../middleware/auth');
const router      = express.Router();

// Seed initial default departments & designations if empty
async function seedDefaults() {
  const deptCount = await Department.countDocuments();
  if (deptCount === 0) {
    const sampleDepts = [
      { name: 'Software Development', code: 'DEV', head: 'Kasun Prasanga Bandara', description: 'Core Engineering & Cloud Architecture', status: 'Active' },
      { name: 'Quality Assurance', code: 'QA', head: 'Nimmi Jayatilleke', description: 'Software Testing & Automation', status: 'Active' },
      { name: 'Business Analysis', code: 'BA', head: 'Ruwan Wijesinghe', description: 'Requirements & Client Liaison', status: 'Active' },
      { name: 'UI/UX', code: 'UIUX', head: 'Nimali Ruwanthika', description: 'User Interface & Design System', status: 'Active' },
      { name: 'Project Management', code: 'PMO', head: 'Sunil Wickramasinghe', description: 'Agile Delivery & Program Management', status: 'Active' },
      { name: 'Human Resources', code: 'HR', head: 'Anusha Fernando', description: 'Talent Acquisition & Workforce', status: 'Active' },
      { name: 'Finance', code: 'FIN', head: 'Mahesh Senanayake', description: 'Corporate Accounting & Payroll', status: 'Active' },
      { name: 'Administration', code: 'ADM', head: 'Chitra Perera', description: 'Office Facilities & Logistics', status: 'Active' }
    ];
    await Department.insertMany(sampleDepts);
  }

  const desigCount = await Designation.countDocuments();
  if (desigCount === 0) {
    const sampleDesigs = [
      { title: 'Lead Software Architect', department: 'Software Development', level: 'Lead', description: 'Leads system architecture and SBERT AI models', status: 'Active' },
      { title: 'Senior Full Stack Engineer', department: 'Software Development', level: 'Senior', description: 'Node.js & React developer', status: 'Active' },
      { title: 'QA Automation Lead', department: 'Quality Assurance', level: 'Lead', description: 'End-to-end UAT & Jest testing', status: 'Active' },
      { title: 'Senior Business Analyst', department: 'Business Analysis', level: 'Senior', description: 'Enterprise requirements gathering', status: 'Active' },
      { title: 'Frontend UI/UX Specialist', department: 'UI/UX', level: 'Mid-Level', description: 'Crafts responsive web dashboards', status: 'Active' },
      { title: 'Agile Project Manager', department: 'Project Management', level: 'Lead', description: 'Manages sprints and release roadmaps', status: 'Active' },
      { title: 'Senior HR Manager', department: 'Human Resources', level: 'Executive', description: 'Oversees ATS and employee relations', status: 'Active' },
      { title: 'Senior Financial Controller', department: 'Finance', level: 'Executive', description: 'Manages financial compliance and audits', status: 'Active' }
    ];
    await Designation.insertMany(sampleDesigs);
  }
}

// ── GET /api/departments ─────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    await seedDefaults();
    const departments  = await Department.find().sort({ name: 1 });
    const designations = await Designation.find().sort({ title: 1 });

    res.json({
      success: true,
      departments,
      designations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Department CRUD ──────────────────────────────────────────
router.post('/department', protect, async (req, res) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).json({ success: true, department });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/department/:id', protect, async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, department });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/department/:id', protect, async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Designation CRUD ─────────────────────────────────────────
router.post('/designation', protect, async (req, res) => {
  try {
    const designation = await Designation.create(req.body);
    res.status(201).json({ success: true, designation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/designation/:id', protect, async (req, res) => {
  try {
    const designation = await Designation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, designation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/designation/:id', protect, async (req, res) => {
  try {
    await Designation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Designation deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
