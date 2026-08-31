import React, { useEffect, useState } from 'react';
import {
  getOnboardings, initiateOnboarding, updateOnboardingTask, addCustomOnboardingTask
} from '../utils/api';
import {
  FaUserCheck, FaPlus, FaCheckCircle, FaHourglassHalf, FaSearch,
  FaTasks, FaLaptopCode, FaFileContract, FaUserShield, FaGraduationCap,
  FaChevronRight, FaTimes, FaCommentAlt, FaSpinner
} from 'react-icons/fa';

export default function Onboarding() {
  const [onboardings, setOnboardings] = useState([]);
  const [stats, setStats]             = useState({ totalCount: 0, inProgressCount: 0, completedCount: 0, avgProgress: 0 });
  const [loading, setLoading]         = useState(true);

  // Filters State
  const [statusFilter, setStatusFilter]         = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [search, setSearch]                     = useState('');

  // Initiate Onboarding Modal
  const [initModalOpen, setInitModalOpen] = useState(false);
  const [initForm, setInitForm]           = useState({
    employeeId: '',
    employeeName: '',
    department: 'Software Development',
    designation: 'Software Engineer',
    joiningDate: new Date().toISOString().split('T')[0]
  });

  // Checklist Detail Modal
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);
  const [activeCategory, setActiveCategory]         = useState('All');
  const [updatingTaskId, setUpdatingTaskId]         = useState(null);

  // Custom Task Modal State
  const [customTaskModalOpen, setCustomTaskModalOpen] = useState(false);
  const [customTaskForm, setCustomTaskForm]           = useState({ title: '', category: 'HR & Access', notes: '' });

  useEffect(() => {
    fetchOnboardings();
  }, [statusFilter, departmentFilter, search]);

  const fetchOnboardings = async () => {
    try {
      setLoading(true);
      const res = await getOnboardings({
        status: statusFilter,
        department: departmentFilter,
        search
      });
      setOnboardings(res.data.onboardings);
      setStats(res.data.stats);

      // Refresh currently open checklist if any
      if (selectedOnboarding) {
        const updated = res.data.onboardings.find(o => o._id === selectedOnboarding._id);
        if (updated) setSelectedOnboarding(updated);
      }
    } catch (err) {
      console.error('Failed to load onboarding profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiate = async (e) => {
    e.preventDefault();
    try {
      const res = await initiateOnboarding(initForm);
      alert(res.data.message);
      setInitModalOpen(false);
      fetchOnboardings();
    } catch (err) {
      alert(err.response?.data?.message || 'Initiation failed');
    }
  };

  const handleTaskToggle = async (taskId, currentStatus, currentNotes) => {
    if (!selectedOnboarding) return;
    try {
      setUpdatingTaskId(taskId);
      const res = await updateOnboardingTask(selectedOnboarding._id, taskId, {
        isCompleted: !currentStatus,
        notes: currentNotes || ''
      });
      setSelectedOnboarding(res.data.onboarding);
      fetchOnboardings();
    } catch (err) {
      alert('Failed to update task');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleAddCustomTask = async (e) => {
    e.preventDefault();
    if (!selectedOnboarding) return;
    try {
      const res = await addCustomOnboardingTask(selectedOnboarding._id, customTaskForm);
      setSelectedOnboarding(res.data.onboarding);
      setCustomTaskModalOpen(false);
      setCustomTaskForm({ title: '', category: 'HR & Access', notes: '' });
      fetchOnboardings();
    } catch (err) {
      alert('Failed to add custom task');
    }
  };

  const CATEGORY_ICONS = {
    Documentation: <FaFileContract className="text-blue-500" />,
    'IT Setup': <FaLaptopCode className="text-purple-500" />,
    'HR & Access': <FaUserShield className="text-emerald-500" />,
    Orientation: <FaGraduationCap className="text-amber-500" />
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto font-sans text-gray-800">
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-primary/10 text-primary rounded-xl text-xl font-black">🚀</span>
            <h1 className="text-2xl font-black text-navy m-0 tracking-tight">Employee Onboarding Management</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 m-0">
            Initiate new hires, track 9-step onboarding checklists, IT setups, and orientation progress.
          </p>
        </div>

        <button
          onClick={() => {
            const nextEmpId = `EMP-${1000 + onboardings.length + 1}`;
            setInitForm({
              employeeId: nextEmpId,
              employeeName: '',
              department: 'Software Development',
              designation: 'Software Engineer',
              joiningDate: new Date().toISOString().split('T')[0]
            });
            setInitModalOpen(true);
          }}
          className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs shadow-md shadow-primary/30 border-0 cursor-pointer flex items-center gap-2"
        >
          <FaPlus /> Initiate Onboarding
        </button>
      </div>

      {/* ── Stat Summary Overview ──────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            <FaTasks />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">Total Active Profiles</p>
            <h3 className="text-2xl font-black text-navy m-0">{stats.totalCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            <FaHourglassHalf />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">In Progress</p>
            <h3 className="text-2xl font-black text-amber-600 m-0">{stats.inProgressCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <FaCheckCircle />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">Fully Onboarded</p>
            <h3 className="text-2xl font-black text-emerald-600 m-0">{stats.completedCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
            <FaUserCheck />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">Avg Onboard Completion</p>
            <h3 className="text-2xl font-black text-purple-600 m-0">{stats.avgProgress}%</h3>
          </div>
        </div>
      </div>

      {/* ── Toolbar & Filters ───────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700"
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700"
            >
              <option value="All">All Departments</option>
              <option value="Software Development">Software Development</option>
              <option value="Quality Assurance">Quality Assurance</option>
              <option value="Business Analysis">Business Analysis</option>
              <option value="Human Resources">Human Resources</option>
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <FaSearch className="absolute left-3 top-3 text-gray-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employee name, ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs font-medium"
          />
        </div>

      </div>

      {/* ── Onboarding Employee Profiles Grid ────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold text-xs">Loading onboarding profiles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {onboardings.map((ob) => (
            <div key={ob._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              
              <div>
                {/* Status Badge & ID */}
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono font-bold text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-md">
                    {ob.employeeId}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border ${
                    ob.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {ob.status}
                  </span>
                </div>

                {/* Name & Title */}
                <h3 className="text-base font-bold text-navy m-0">{ob.employeeName}</h3>
                <p className="text-xs text-gray-500 font-semibold m-0 mt-0.5">{ob.designation} • <span className="text-primary">{ob.department}</span></p>

                {/* Progress Bar */}
                <div className="mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-600">Onboarding Progress</span>
                    <span className="font-black text-primary">{ob.progressPercentage}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        ob.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-primary'
                      }`}
                      style={{ width: `${ob.progressPercentage}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold pt-1">
                    <span>{ob.completedTasksCount} / {ob.totalTasksCount} Tasks Done</span>
                    <span>Joined: {new Date(ob.joiningDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <button
                onClick={() => {
                  setSelectedOnboarding(ob);
                  setActiveCategory('All');
                }}
                className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-primary hover:text-white text-gray-700 text-xs font-bold rounded-xl border-0 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <FaTasks /> Manage Checklist & Progress <FaChevronRight className="text-[10px]" />
              </button>

            </div>
          ))}
        </div>
      )}

      {/* ── INITIATE ONBOARDING MODAL ────────────────── */}
      {initModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 text-xs">
            <h3 className="text-base font-bold text-navy mb-1">Initiate Employee Onboarding</h3>
            <p className="text-gray-500 mb-4">Start onboarding workflow with default 9 checklist items.</p>

            <form onSubmit={handleInitiate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    value={initForm.employeeId}
                    onChange={e => setInitForm({ ...initForm, employeeId: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">Joining Date *</label>
                  <input
                    type="date"
                    value={initForm.joiningDate}
                    onChange={e => setInitForm({ ...initForm, joiningDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Full Employee Name *</label>
                <input
                  type="text"
                  value={initForm.employeeName}
                  onChange={e => setInitForm({ ...initForm, employeeName: e.target.value })}
                  placeholder="e.g. Kasun Prasanga Bandara"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Department *</label>
                <select
                  value={initForm.department}
                  onChange={e => setInitForm({ ...initForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-semibold"
                >
                  <option value="Software Development">Software Development</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Business Analysis">Business Analysis</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Designation Title</label>
                <input
                  type="text"
                  value={initForm.designation}
                  onChange={e => setInitForm({ ...initForm, designation: e.target.value })}
                  placeholder="e.g. Lead Engineer"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setInitModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white font-bold rounded-xl border-0 cursor-pointer shadow-md shadow-primary/30"
                >
                  Initiate Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── INTERACTIVE CHECKLIST MODAL ─────────────── */}
      {selectedOnboarding && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 border border-gray-100 text-xs space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-navy m-0">{selectedOnboarding.employeeName}</h3>
                  <span className="font-mono font-bold text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {selectedOnboarding.employeeId}
                  </span>
                </div>
                <p className="text-gray-500 m-0 text-xs mt-0.5">
                  {selectedOnboarding.designation} ({selectedOnboarding.department})
                </p>
              </div>

              <button
                onClick={() => setSelectedOnboarding(null)}
                className="text-gray-400 hover:text-gray-700 border-0 bg-transparent text-lg cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Live Progress Bar Banner */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Onboarding Completion</span>
                <div className="text-xl font-black font-mono text-emerald-400">
                  {selectedOnboarding.progressPercentage}% Completed ({selectedOnboarding.completedTasksCount} / {selectedOnboarding.totalTasksCount})
                </div>
              </div>

              <button
                onClick={() => setCustomTaskModalOpen(true)}
                className="px-3 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs border-0 cursor-pointer flex items-center gap-1.5 shadow-md shadow-primary/30"
              >
                <FaPlus /> Add Custom Task
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              {['All', 'Documentation', 'IT Setup', 'HR & Access', 'Orientation'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer transition-colors ${
                    activeCategory === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Checklist Items Scrollable List */}
            <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
              {selectedOnboarding.checklist
                .filter(item => activeCategory === 'All' || item.category === activeCategory)
                .map((task) => (
                  <div
                    key={task.taskId}
                    className={`p-3.5 rounded-xl border transition-colors flex items-start gap-3 ${
                      task.isCompleted ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={task.isCompleted}
                      disabled={updatingTaskId === task.taskId}
                      onChange={() => handleTaskToggle(task.taskId, task.isCompleted, task.notes)}
                      className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary cursor-pointer"
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{CATEGORY_ICONS[task.category] || <FaTasks />}</span>
                          <span className={`font-bold text-xs ${task.isCompleted ? 'line-through text-gray-500' : 'text-navy'}`}>
                            {task.title}
                          </span>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {task.category}
                        </span>
                      </div>

                      {/* Task Notes / Logged Status */}
                      <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
                        <span>{task.notes || 'No specific notes'}</span>
                        {task.isCompleted && task.completedBy && (
                          <span className="text-emerald-700 font-semibold">
                            ✓ Done by {task.completedBy} ({new Date(task.completedAt).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

          </div>
        </div>
      )}

      {/* ── ADD CUSTOM TASK MODAL ────────────────────── */}
      {customTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 text-xs space-y-4">
            <h3 className="text-base font-bold text-navy m-0">Add Custom Onboarding Task</h3>
            <form onSubmit={handleAddCustomTask} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={customTaskForm.title}
                  onChange={e => setCustomTaskForm({ ...customTaskForm, title: e.target.value })}
                  placeholder="e.g. Issue Security Access Smartcard"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Category</label>
                <select
                  value={customTaskForm.category}
                  onChange={e => setCustomTaskForm({ ...customTaskForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-semibold"
                >
                  <option value="Documentation">Documentation</option>
                  <option value="IT Setup">IT Setup</option>
                  <option value="HR & Access">HR & Access</option>
                  <option value="Orientation">Orientation</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Notes / Instructions</label>
                <textarea
                  rows="2"
                  value={customTaskForm.notes}
                  onChange={e => setCustomTaskForm({ ...customTaskForm, notes: e.target.value })}
                  placeholder="Details..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCustomTaskModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white font-bold rounded-xl border-0 cursor-pointer shadow-md shadow-primary/30"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
