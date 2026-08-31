import React, { useEffect, useState } from 'react';
import {
  getTodayAttendance, checkInAttendance, checkOutAttendance,
  getAttendanceLogs, updateAttendanceLog, getMonthlyReport
} from '../utils/api';
import {
  FaClock, FaSignInAlt, FaSignOutAlt, FaCalendarCheck, FaUserCheck,
  FaHourglassHalf, FaExclamationTriangle, FaFileDownload, FaSearch,
  FaFilter, FaEdit, FaTimes, FaBuilding
} from 'react-icons/fa';

export default function Attendance() {
  const [todayRecord, setTodayRecord] = useState(null);
  const [logs, setLogs]               = useState([]);
  const [stats, setStats]             = useState({ totalPresent: 0, totalLate: 0, totalOnLeave: 0, totalAbsent: 0 });
  const [loading, setLoading]         = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Filters State
  const [dateFilter, setDateFilter]             = useState(new Date().toISOString().split('T')[0]);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter]         = useState('All');
  const [search, setSearch]                     = useState('');
  const [workMode, setWorkMode]                 = useState('Hybrid');

  // Modals State
  const [editModalOpen, setEditModalOpen]       = useState(false);
  const [selectedRecord, setSelectedRecord]     = useState(null);
  const [editForm, setEditForm]                 = useState({ status: 'Present', workMode: 'On-site', notes: '' });

  const [reportModalOpen, setReportModalOpen]   = useState(false);
  const [reportData, setReportData]             = useState([]);
  const [reportMonth, setReportMonth]           = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear]             = useState(new Date().getFullYear());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodayRecord();
    fetchLogs();
  }, [dateFilter, departmentFilter, statusFilter, search]);

  const fetchTodayRecord = async () => {
    try {
      const res = await getTodayAttendance();
      setTodayRecord(res.data.todayRecord);
    } catch (err) {
      console.error('Failed to load today record:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getAttendanceLogs({
        date: dateFilter,
        department: departmentFilter,
        status: statusFilter,
        search
      });
      setLogs(res.data.logs);
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to load attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await checkInAttendance({ workMode, department: 'Engineering' });
      alert(res.data.message);
      fetchTodayRecord();
      fetchLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await checkOutAttendance();
      alert(res.data.message);
      fetchTodayRecord();
      fetchLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateAttendanceLog(selectedRecord._id, editForm);
      setEditModalOpen(false);
      fetchLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update record');
    }
  };

  const handleGenerateReport = async () => {
    try {
      const res = await getMonthlyReport({ month: reportMonth, year: reportYear });
      setReportData(res.data.report);
      setReportModalOpen(true);
    } catch (err) {
      alert('Failed to generate monthly report');
    }
  };

  const STATUS_CLASSES = {
    Present: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Late: 'bg-amber-100 text-amber-800 border-amber-300',
    Absent: 'bg-rose-100 text-rose-800 border-rose-300',
    'Half Day': 'bg-orange-100 text-orange-800 border-orange-300',
    'On Leave': 'bg-blue-100 text-blue-800 border-blue-300',
    'Work From Home': 'bg-purple-100 text-purple-800 border-purple-300'
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto font-sans text-gray-800">
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-primary/10 text-primary rounded-xl text-xl font-black">🕒</span>
            <h1 className="text-2xl font-black text-navy m-0 tracking-tight">Attendance Management System</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 m-0">
            Real-time check-in/check-out tracking, working hours calculation, and monthly reports.
          </p>
        </div>

        <button
          onClick={handleGenerateReport}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 border-0 cursor-pointer flex items-center gap-2"
        >
          <FaFileDownload /> Monthly Attendance Report
        </button>
      </div>

      {/* ── Employee Punch In / Punch Out Widget ─────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-slate-800 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl text-emerald-400 font-mono font-bold shadow-inner">
            <FaClock />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">Live System Clock</span>
            <h2 className="text-3xl font-black text-white font-mono m-0 tracking-tight">{currentTime}</h2>
            <p className="text-xs text-slate-300 m-0 mt-0.5">
              Today: <span className="text-emerald-400 font-bold">{new Date().toDateString()}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[10px] text-slate-300 font-bold uppercase mb-1">Work Mode</label>
            <select
              value={workMode}
              onChange={e => setWorkMode(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/10 text-white border border-white/20 text-xs font-bold focus:outline-none"
            >
              <option value="Hybrid" className="text-gray-800">Hybrid Mode</option>
              <option value="On-site" className="text-gray-800">On-site Office</option>
              <option value="Remote" className="text-gray-800">Remote WFH</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {!todayRecord || !todayRecord.checkInTime ? (
              <button
                onClick={handleCheckIn}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-500/30 border-0 cursor-pointer flex items-center gap-2 transition-all"
              >
                <FaSignInAlt /> Check In Now
              </button>
            ) : !todayRecord.checkOutTime ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  In at: {new Date(todayRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={handleCheckOut}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-rose-500/30 border-0 cursor-pointer flex items-center gap-2 transition-all"
                >
                  <FaSignOutAlt /> Check Out
                </button>
              </div>
            ) : (
              <div className="text-right">
                <span className="text-xs font-extrabold bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-xl border border-blue-500/30 block">
                  Completed ({todayRecord.workingHours} hrs)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Overview Cards ─────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <FaUserCheck />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">Present / WFH</p>
            <h3 className="text-2xl font-black text-emerald-600 m-0">{stats.totalPresent}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            <FaExclamationTriangle />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">Late Check-ins</p>
            <h3 className="text-2xl font-black text-amber-600 m-0">{stats.totalLate}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            <FaCalendarCheck />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">On Leave</p>
            <h3 className="text-2xl font-black text-blue-600 m-0">{stats.totalOnLeave}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
            <FaHourglassHalf />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">Absent / Half Day</p>
            <h3 className="text-2xl font-black text-rose-600 m-0">{stats.totalAbsent}</h3>
          </div>
        </div>
      </div>

      {/* ── Filters Toolbar ─────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6 space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Date Picker Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Select Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 font-semibold text-gray-700 bg-white"
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Department</label>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="IT">IT</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Half Day">Half Day</option>
              <option value="On Leave">On Leave</option>
              <option value="Work From Home">Work From Home</option>
            </select>
          </div>

          {/* Search Bar */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Search Employee</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400 text-xs" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 font-medium"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Attendance Log Table ─────────────────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold text-xs">Loading attendance records...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Employee ID & Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Check-In</th>
                <th className="py-3.5 px-4">Check-Out</th>
                <th className="py-3.5 px-4">Working Hours</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400">
                    No attendance records match the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-gray-600">{log.date}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-navy">{log.employeeName}</div>
                      <div className="text-[10px] font-mono text-primary">{log.employeeId}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-700">{log.department}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                      {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">
                      {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>
                    <td className="py-3 px-4 font-black text-navy">{log.workingHours || 0} hrs</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${STATUS_CLASSES[log.status] || 'bg-gray-100'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        {log.workMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedRecord(log);
                          setEditForm({ status: log.status, workMode: log.workMode, notes: log.notes || '' });
                          setEditModalOpen(true);
                        }}
                        className="p-1.5 text-gray-600 hover:text-primary border-0 bg-transparent cursor-pointer text-sm"
                        title="Authorized Edit"
                      >
                        <FaEdit />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* HR AUTHORIZED EDIT MODAL */}
      {editModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 text-xs">
            <h3 className="text-base font-bold text-navy mb-1">HR Authorized Attendance Edit</h3>
            <p className="text-gray-500 mb-4">Editing log for <strong>{selectedRecord.employeeName}</strong> ({selectedRecord.date})</p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Attendance Status *</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white font-bold text-primary"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="Half Day">Half Day</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Work From Home">Work From Home</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Work Mode</label>
                <select
                  value={editForm.workMode}
                  onChange={e => setEditForm({ ...editForm, workMode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white"
                >
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">HR Override Notes</label>
                <textarea
                  rows="3"
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Reason for manual edit..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white font-bold rounded-xl border-0 cursor-pointer"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MONTHLY REPORT MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl p-6 border border-gray-100 text-xs space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-navy m-0">Monthly Attendance Report</h3>
                <p className="text-gray-500 m-0 text-xs">Summary breakdown of employee attendance, leaves, and total hours.</p>
              </div>
              <button onClick={() => setReportModalOpen(false)} className="text-gray-400 hover:text-gray-700 border-0 bg-transparent text-lg cursor-pointer">
                <FaTimes />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Present Days</th>
                    <th className="py-2.5 px-3">Late Days</th>
                    <th className="py-2.5 px-3">WFH Days</th>
                    <th className="py-2.5 px-3">Leaves</th>
                    <th className="py-2.5 px-3">Total Working Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.map((r) => (
                    <tr key={r.employeeId}>
                      <td className="py-2.5 px-3 font-bold text-navy">{r.employeeName} ({r.employeeId})</td>
                      <td className="py-2.5 px-3 text-gray-600">{r.department}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-600">{r.presentDays} days</td>
                      <td className="py-2.5 px-3 font-bold text-amber-600">{r.lateDays} days</td>
                      <td className="py-2.5 px-3 font-bold text-purple-600">{r.wfhDays} days</td>
                      <td className="py-2.5 px-3 font-bold text-blue-600">{r.leaveDays} days</td>
                      <td className="py-2.5 px-3 font-black text-navy">{r.totalWorkingHours.toFixed(1)} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button onClick={() => window.print()} className="px-4 py-2 bg-primary text-white font-bold rounded-xl border-0 cursor-pointer">
                🖨️ Print / Export PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
