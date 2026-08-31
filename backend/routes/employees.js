// routes/employees.js — Complete Employee CRUD & Advanced Filtering API
const express  = require('express');
const Employee = require('../models/Employee');
const { protect } = require('../middleware/auth');
const router   = express.Router();

// Helper to seed sample comprehensive employees if empty
async function seedComprehensiveEmployees() {
  const count = await Employee.countDocuments();
  if (count > 0) return;

  const sampleEmployees = [
    {
      employeeId: 'EMP-1001',
      fullName: 'Kasun Prasanga Bandara',
      gender: 'Male',
      dateOfBirth: new Date('1993-05-14'),
      personalEmail: 'kasun.bandara.personal@gmail.com',
      companyEmail: 'kasun.b@axcertro.com',
      phoneNumber: '+94 77 123 4567',
      address: 'No. 45, Temple Road, Nugegoda, Sri Lanka',
      emergencyContact: { name: 'Sunethra Bandara', phone: '+94 71 987 6543', relation: 'Spouse' },
      department: 'Engineering',
      designation: 'Lead Software Architect',
      employmentType: 'Permanent',
      joiningDate: new Date('2022-03-01'),
      status: 'Active',
      manager: 'Sunil Wickramasinghe',
      workingLocation: 'Colombo HQ',
      workMode: 'Hybrid',
      salary: { basicSalary: 350000, allowance: 50000, currency: 'LKR' },
      skills: ['System Design', 'Node.js', 'React', 'Cloud Architecture'],
      technologies: ['MongoDB', 'Docker', 'AWS', 'Python SBERT'],
      education: [{ degree: 'B.Sc (Hons) in Computer Science', institution: 'University of Moratuwa', year: '2016' }],
      experience: [{ company: 'WSO2', role: 'Senior Software Engineer', duration: '4 Years' }],
      bankDetails: { bankName: 'Commercial Bank', branch: 'Nugegoda', accountNumber: '8004561234', accountName: 'K P Bandara' }
    },
    {
      employeeId: 'EMP-1002',
      fullName: 'Nimali Ruwanthika Jayasinghe',
      gender: 'Female',
      dateOfBirth: new Date('1996-09-05'),
      personalEmail: 'nimali.j.priv@gmail.com',
      companyEmail: 'nimali.j@axcertro.com',
      phoneNumber: '+94 76 555 8899',
      address: 'No. 12/A, Kandy Road, Malabe',
      emergencyContact: { name: 'K. Jayasinghe', phone: '+94 77 444 3322', relation: 'Father' },
      department: 'Engineering',
      designation: 'Frontend UI/UX Specialist',
      employmentType: 'Probation',
      joiningDate: new Date('2026-03-01'),
      probationStartDate: new Date('2026-03-01'),
      probationEndDate: new Date('2026-09-01'),
      status: 'Active',
      manager: 'Kasun Prasanga Bandara',
      workingLocation: 'Colombo HQ',
      workMode: 'On-site',
      salary: { basicSalary: 180000, allowance: 25000, currency: 'LKR' },
      skills: ['React.js', 'Tailwind CSS', 'Figma Design', 'TypeScript'],
      technologies: ['React', 'Redux', 'Jest', 'Webpack'],
      education: [{ degree: 'B.Sc in Software Engineering', institution: 'SLIIT', year: '2022' }],
      experience: [{ company: 'Virtusa', role: 'Associate UI Engineer', duration: '2 Years' }],
      bankDetails: { bankName: 'Sampath Bank', branch: 'Malabe', accountNumber: '1102938475', accountName: 'N R Jayasinghe' }
    },
    {
      employeeId: 'EMP-1003',
      fullName: 'Samanthi Priyadarshani Silva',
      gender: 'Female',
      dateOfBirth: new Date('1990-11-20'),
      personalEmail: 'samanthi.s@yahoo.com',
      companyEmail: 'samanthi.s@axcertro.com',
      phoneNumber: '+94 71 888 1122',
      address: 'No. 88, Galle Road, Dehiwala',
      emergencyContact: { name: 'Dhammika Silva', phone: '+94 77 222 9988', relation: 'Brother' },
      department: 'Marketing',
      designation: 'Head of Global Marketing',
      employmentType: 'Permanent',
      joiningDate: new Date('2021-06-15'),
      status: 'Active',
      manager: 'CEO Office',
      workingLocation: 'Colombo HQ',
      workMode: 'Hybrid',
      salary: { basicSalary: 280000, allowance: 40000, currency: 'LKR' },
      skills: ['Brand Strategy', 'Digital Marketing', 'SEO Optimization', 'Campaigns'],
      technologies: ['Google Analytics', 'HubSpot', 'Meta Ads Manager'],
      education: [{ degree: 'MBA in Marketing', institution: 'University of Colombo', year: '2018' }],
      experience: [{ company: 'Dialog Axiata', role: 'Marketing Manager', duration: '5 Years' }],
      bankDetails: { bankName: 'HNB', branch: 'Dehiwala', accountNumber: '0030104859', accountName: 'S P Silva' }
    },
    {
      employeeId: 'EMP-1004',
      fullName: 'Dilshan Madusanka Perera',
      gender: 'Male',
      dateOfBirth: new Date('1998-02-14'),
      personalEmail: 'dilshan.m.perera@gmail.com',
      companyEmail: 'dilshan.p@axcertro.com',
      phoneNumber: '+94 75 333 4455',
      address: 'No. 34, Peradeniya Road, Kandy',
      emergencyContact: { name: 'Rohini Perera', phone: '+94 81 222 3344', relation: 'Mother' },
      department: 'IT',
      designation: 'Cloud Infrastructure & DevOps Engineer',
      employmentType: 'Contract',
      joiningDate: new Date('2025-01-10'),
      status: 'Active',
      manager: 'Kasun Prasanga Bandara',
      workingLocation: 'Remote',
      workMode: 'Remote',
      salary: { basicSalary: 220000, allowance: 30000, currency: 'LKR' },
      skills: ['CI/CD Pipelines', 'Kubernetes', 'Linux SysAdmin', 'Terraform'],
      technologies: ['AWS', 'Docker', 'Jenkins', 'Bash Scripting'],
      education: [{ degree: 'B.Sc in Information Technology', institution: 'University of Kelaniya', year: '2021' }],
      experience: [{ company: 'Sysco LABS', role: 'DevOps Associate', duration: '2.5 Years' }],
      bankDetails: { bankName: 'Nations Trust Bank', branch: 'Kandy', accountNumber: '5029384710', accountName: 'D M Perera' }
    },
    {
      employeeId: 'EMP-1005',
      fullName: 'Mahesh Senanayake',
      gender: 'Male',
      dateOfBirth: new Date('1988-07-28'),
      personalEmail: 'mahesh.sena@gmail.com',
      companyEmail: 'mahesh.s@axcertro.com',
      phoneNumber: '+94 77 666 5544',
      address: 'No. 15, Station Road, Maharagama',
      emergencyContact: { name: 'Chitra Senanayake', phone: '+94 71 333 2211', relation: 'Wife' },
      department: 'Finance',
      designation: 'Senior Financial Controller',
      employmentType: 'Permanent',
      joiningDate: new Date('2020-09-01'),
      status: 'Active',
      manager: 'Board of Directors',
      workingLocation: 'Colombo HQ',
      workMode: 'On-site',
      salary: { basicSalary: 320000, allowance: 45000, currency: 'LKR' },
      skills: ['Financial Audit', 'Taxation', 'Corporate Finance', 'Budgeting'],
      technologies: ['QuickBooks', 'SAP ERP', 'Advanced Excel'],
      education: [{ degree: 'Chartered Accountant (FCMA / CA Sri Lanka)', institution: 'CA Sri Lanka', year: '2014' }],
      experience: [{ company: 'Ernst & Young', role: 'Audit Manager', duration: '6 Years' }],
      bankDetails: { bankName: 'Bank of Ceylon', branch: 'Maharagama', accountNumber: '774839201', accountName: 'M Senanayake' }
    },
    {
      employeeId: 'EMP-1006',
      fullName: 'Kavindi Malsha Fonseka',
      gender: 'Female',
      dateOfBirth: new Date('2002-09-08'),
      personalEmail: 'kavindi.fonseka@gmail.com',
      companyEmail: 'kavindi.f@axcertro.com',
      phoneNumber: '+94 70 111 2233',
      address: 'No. 90, Baseline Road, Kirulapone',
      emergencyContact: { name: 'Bandula Fonseka', phone: '+94 77 999 8877', relation: 'Father' },
      department: 'Sales',
      designation: 'Junior Business Development Intern',
      employmentType: 'Internship',
      joiningDate: new Date('2026-05-15'),
      probationStartDate: new Date('2026-05-15'),
      probationEndDate: new Date('2026-11-15'),
      status: 'Active',
      manager: 'Samanthi Priyadarshani Silva',
      workingLocation: 'Colombo HQ',
      workMode: 'Hybrid',
      salary: { basicSalary: 50000, allowance: 10000, currency: 'LKR' },
      skills: ['Lead Generation', 'Client Relations', 'Sales Presentations'],
      technologies: ['Salesforce', 'LinkedIn Sales Navigator', 'PowerPoint'],
      education: [{ degree: 'Undergraduate BBA', institution: 'University of Sri Jayewardenepura', year: 'Present' }],
      experience: [],
      bankDetails: { bankName: 'Commercial Bank', branch: 'Kirulapone', accountNumber: '9081726354', accountName: 'K M Fonseka' }
    }
  ];

  await Employee.insertMany(sampleEmployees);
}

// ── GET /api/employees ───────────────────────────────────────
// Get all employees with search, multi-filtering & sorting
router.get('/', protect, async (req, res) => {
  try {
    await seedComprehensiveEmployees();

    const {
      search,
      department,
      designation,
      employmentType,
      status,
      joiningDateFrom,
      joiningDateTo,
      sortBy
    } = req.query;

    const filter = {};

    // 1. Search Query
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { fullName: regex },
        { employeeId: regex },
        { companyEmail: regex },
        { designation: regex },
        { department: regex },
        { skills: regex },
        { technologies: regex }
      ];
    }

    // 2. Department Filter
    if (department && department !== 'All') {
      filter.department = department;
    }

    // 3. Designation Filter
    if (designation && designation !== 'All') {
      filter.designation = designation;
    }

    // 4. Employment Type Filter (Permanent, Probation, Internship, Contract, Part-time)
    if (employmentType && employmentType !== 'All') {
      filter.employmentType = employmentType;
    }

    // 5. Employee Status Filter (Active, Inactive, Resigned, Terminated)
    if (status && status !== 'All') {
      filter.status = status;
    }

    // 6. Joining Date Range Filter
    if (joiningDateFrom || joiningDateTo) {
      filter.joiningDate = {};
      if (joiningDateFrom) filter.joiningDate.$gte = new Date(joiningDateFrom);
      if (joiningDateTo)   filter.joiningDate.$lte = new Date(joiningDateTo);
    }

    // 7. Sorting
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'name_asc')    sortOptions = { fullName: 1 };
    if (sortBy === 'name_desc')   sortOptions = { fullName: -1 };
    if (sortBy === 'id_asc')      sortOptions = { employeeId: 1 };
    if (sortBy === 'joining_new') sortOptions = { joiningDate: -1 };
    if (sortBy === 'joining_old') sortOptions = { joiningDate: 1 };
    if (sortBy === 'department')  sortOptions = { department: 1 };

    const employees = await Employee.find(filter).sort(sortOptions);

    // Get metadata counts for filter badges
    const totalCount = await Employee.countDocuments();
    const activeCount = await Employee.countDocuments({ status: 'Active' });
    const probationCount = await Employee.countDocuments({ employmentType: 'Probation' });
    const internCount = await Employee.countDocuments({ employmentType: 'Internship' });

    res.json({
      success: true,
      count: employees.length,
      meta: {
        totalCount,
        activeCount,
        probationCount,
        internCount
      },
      employees
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/employees/:id ────────────────────────────────────
// Get single employee profile details
router.get('/:id', protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/employees ──────────────────────────────────────
// Add a new employee
router.post('/', protect, async (req, res) => {
  try {
    const existing = await Employee.findOne({
      $or: [{ employeeId: req.body.employeeId }, { companyEmail: req.body.companyEmail }]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID or Company Email already registered.'
      });
    }

    const employee = await Employee.create(req.body);
    res.status(201).json({ success: true, employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ── PUT /api/employees/:id ───────────────────────────────────
// Edit / Update an existing employee
router.put('/:id', protect, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ── DELETE /api/employees/:id ────────────────────────────────
// Deactivate or Delete an employee
router.delete('/:id', protect, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, message: 'Employee record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
