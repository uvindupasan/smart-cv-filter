import React, { useEffect, useState } from 'react';
import {
  getLeaveBalance, getLeaveRequests, submitLeaveRequest,
  reviewLeaveRequest, updateLeaveEntitlement
} from '../utils/api';
import {
  FaPlaneDeparture, FaPlus, FaCheck, FaTimes, FaCalendarAlt,
  FaFileAlt, FaUserClock, FaCog, FaCheckCircle, FaTimesCircle,
  FaHourglassHalf, FaPaperclip, FaSearch, FaFilter
} from 'react-icons/fa';

export default function Leaves() {
  const [balance, setBalance]       = useState(null);
  const [requests, setRequests]     = useState([]);
  const [stats, setStats]           = useState({ totalPending: 0, totalApproved: 0, totalRejected: 0 });
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('my-requests'); // 'my-requests' or 'approval-queue'

  // Filters State
  const [statusFilter, setStatusFilter]       = useState('All');
  const [typeFilter, setTypeFilter]           = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [search, setSearch]                   = useState('');

  // Request Leave Form Modal
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [reqForm, setReqForm]           = useState({
    leaveType: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: '',
    department: 'Engineering'
  });
  const [docFile, setDocFile]           = useState(null);
  const [calcDays, setCalcDays]         = useState(1);
  const [submitting, setSubmitting]     = useState(false);

  // HR Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReq, setSelectedReq]         = useState(null);
  const [reviewAction, setReviewAction]       = useState('Approved'); // 'Approved' or 'Rejected'
  const [hrComment, setHrComment]             = useState('');

  // HR Entitlement Modal
  const [entitlementModalOpen, setEntitlementModalOpen] = useState(false);
  const [entitlementForm, setEntitlementForm]           = useState({ annualTotal: 14, casualTotal: 7, sickTotal: 7 });

  useEffect(() => {
    fetchBalance();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, typeFilter, departmentFilter, search, activeTab]);

  const fetchBalance = async () => {
    try {
      const res = await getLeaveBalance();
      setBalance(res.data.balance);
    } catch (err) {
      console.error('Failed to load leave balance:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter,
        leaveType: typeFilter,
        department: departmentFilter,
        search,
        myRequestsOnly: activeTab === 'my-requests' ? 'true' : 'false'
      };
      const res = await getLeaveRequests(params);
      setRequests(res.data.requests);
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Date Range Calculator helper
  const handleDateChange = (startStr, endStr, type) => {
    if (type === 'Half Day') {
      setCalcDays(0.5);
      return;
    }
    if (startStr && endStr) {
      const s = new Date(startStr);
      const e = new Date(endStr);
      if (e >= s) {
        const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
        setCalcDays(diff);
      } else {
        setCalcDays(1);
      }
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('leaveType', reqForm.leaveType);
      formData.append('startDate', reqForm.startDate);
      formData.append('endDate', reqForm.endDate);
      formData.append('reason', reqForm.reason);
      formData.append('department', reqForm.department);
      if (docFile) {
        formData.append('document', docFile);
      }

      const res = await submitLeaveRequest(formData);
      alert(res.data.message);
      setReqModalOpen(false);
      fetchBalance();
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await reviewLeaveRequest(selectedReq._id, {
        status: reviewAction,
        hrComment
      });
      alert(res.data.message);
      setReviewModalOpen(false);
      fetchBalance();
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Review submission failed');
    }
  };

  const handleSaveEntitlement = async (e) => {
    e.preventDefault();
    try {
      const res = await updateLeaveEntitlement(entitlementForm);
      alert(res.data.message);
      setEntitlementModalOpen(false);
      fetchBalance();
    } catch (err) {
      alert('Failed to update entitlements');
    }
  };

  const STATUS_CLASSES = {
    Pending: 'bg-amber-100 text-amber-800 border-amber-300',
    Approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Rejected: 'bg-rose-100 text-rose-800 border-rose-300'
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto font-sans text-gray-800">
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-primary/10 text-primary rounded-xl text-xl font-black">🏖️</span>
            <h1 className="text-2xl font-black text-navy m-0 tracking-tight">Leave Management System</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 m-0">
            Request time off, track yearly entitlement balances, and process HR approval workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setEntitlementModalOpen(true)}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs border-0 cursor-pointer flex items-center gap-2"
          >
            <FaCog /> HR Entitlement Settings
          </button>

          <button
            onClick={() => {
              const todayStr = new Date().toISOString().split('T')[0];
              setReqForm({ leaveType: 'Annual Leave', startDate: todayStr, endDate: todayStr, reason: '', department: 'Engineering' });
              setDocFile(null);
              setCalcDays(1);
              setReqModalOpen(true);
            }}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs shadow-md shadow-primary/30 border-0 cursor-pointer flex items-center gap-2"
          >
            <FaPlus /> Apply for Leave
          </button>
        </div>
      </div>

      {/* ── Leave Balance Summary Widgets ───────────── */}
      {balance && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          {/* Annual Leave */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Annual Leave</span>
              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                Total: {balance.annualTotal}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-navy m-0">{balance.annualTotal - balance.annualUsed}</h3>
              <span className="text-xs text-gray-500 font-semibold">days remaining</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${Math.min(100, (balance.annualUsed / balance.annualTotal) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Casual Leave */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Casual Leave</span>
              <span className="text-xs font-mono font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                Total: {balance.casualTotal}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-amber-600 m-0">{balance.casualTotal - balance.casualUsed}</h3>
              <span className="text-xs text-gray-500 font-semibold">days remaining</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${Math.min(100, (balance.casualUsed / balance.casualTotal) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Sick Leave */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Sick Leave</span>
              <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                Total: {balance.sickTotal}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-emerald-600 m-0">{balance.sickTotal - balance.sickUsed}</h3>
              <span className="text-xs text-gray-500 font-semibold">days remaining</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${Math.min(100, (balance.sickUsed / balance.sickTotal) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* No-pay Leave */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase">No-pay Leave</span>
              <span className="text-xs font-mono font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded">
                Unpaid
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-rose-600 m-0">{balance.nopayUsed}</h3>
              <span className="text-xs text-gray-500 font-semibold">days taken</span>
            </div>
            <p className="text-[10px] text-gray-400 m-0 mt-3">Does not deduct from paid balances</p>
          </div>

        </div>
      )}

      {/* ── Toolbar & Tabs ───────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 space-y-3 text-xs">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('my-requests')}
              className={`px-4 py-2 rounded-lg font-bold border-0 cursor-pointer transition-colors ${
                activeTab === 'my-requests' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
              }`}
            >
              📋 My Leave Requests
            </button>
            <button
              onClick={() => setActiveTab('approval-queue')}
              className={`px-4 py-2 rounded-lg font-bold border-0 cursor-pointer transition-colors flex items-center gap-2 ${
                activeTab === 'approval-queue' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
              }`}
            >
              🛡️ HR Approval Queue
              {stats.totalPending > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {stats.totalPending}
                </span>
              )}
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <FaSearch className="absolute left-3 top-3 text-gray-400 text-xs" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee, reason..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 font-medium"
            />
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Leave Type</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700"
            >
              <option value="All">All Leave Types</option>
              <option value="Annual Leave">Annual Leave</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="No-pay Leave">No-pay Leave</option>
              <option value="Half Day">Half Day</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Department</label>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="IT">IT</option>
            </select>
          </div>
        </div>

      </div>

      {/* ── Leave Requests Table ─────────────────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold text-xs">Loading leave requests...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">Start Date</th>
                <th className="py-3.5 px-4">End Date</th>
                <th className="py-3.5 px-4">Days</th>
                <th className="py-3.5 px-4">Reason & Document</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-400">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-navy">{req.employeeName}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{req.employeeId} ({req.department})</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-primary">{req.leaveType}</td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      {new Date(req.startDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-black text-navy">{req.totalDays} day(s)</td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="truncate font-medium text-gray-700">{req.reason}</div>
                      {req.documentUrl && (
                        <a
                          href={`http://localhost:5000${req.documentUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-primary flex items-center gap-1 mt-0.5 hover:underline"
                        >
                          <FaPaperclip /> Attached Document
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${STATUS_CLASSES[req.status]}`}>
                        {req.status}
                      </span>
                      {req.hrComment && (
                        <div className="text-[10px] text-gray-400 italic mt-0.5 truncate max-w-[150px]" title={req.hrComment}>
                          Note: {req.hrComment}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {activeTab === 'approval-queue' && req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedReq(req);
                              setReviewAction('Approved');
                              setHrComment('');
                              setReviewModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-[10px] border-0 cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReq(req);
                              setReviewAction('Rejected');
                              setHrComment('');
                              setReviewModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-[10px] border-0 cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── LEAVE APPLICATION MODAL ───────────────────── */}
      {reqModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-gray-100 text-xs">
            <h3 className="text-base font-bold text-navy mb-1">Apply for Time Off</h3>
            <p className="text-gray-500 mb-4">Submit a leave request for HR approval.</p>

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Leave Type *</label>
                <select
                  value={reqForm.leaveType}
                  onChange={e => {
                    const type = e.target.value;
                    setReqForm({ ...reqForm, leaveType: type });
                    handleDateChange(reqForm.startDate, reqForm.endDate, type);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-bold text-primary"
                >
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="No-pay Leave">No-pay Leave</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={reqForm.startDate}
                    onChange={e => {
                      const s = e.target.value;
                      setReqForm({ ...reqForm, startDate: s });
                      handleDateChange(s, reqForm.endDate, reqForm.leaveType);
                    }}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={reqForm.endDate}
                    onChange={e => {
                      const end = e.target.value;
                      setReqForm({ ...reqForm, endDate: end });
                      handleDateChange(reqForm.startDate, end, reqForm.leaveType);
                    }}
                    required
                    disabled={reqForm.leaveType === 'Half Day'}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                <span className="text-gray-500 font-bold">Total Days Requesting:</span>
                <span className="text-base font-black text-primary bg-primary/10 px-3 py-0.5 rounded-lg">
                  {calcDays} day(s)
                </span>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Reason for Leave *</label>
                <textarea
                  rows="3"
                  value={reqForm.reason}
                  onChange={e => setReqForm({ ...reqForm, reason: e.target.value })}
                  placeholder="Explain reason for leave request..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Supporting Document (Optional)</label>
                <input
                  type="file"
                  onChange={e => setDocFile(e.target.files[0])}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReqModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary text-white font-bold rounded-xl border-0 cursor-pointer shadow-md shadow-primary/30"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── HR APPROVAL / REJECTION MODAL ───────────── */}
      {reviewModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 text-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-navy m-0">HR Leave Review</h3>
              <p className="text-gray-500 m-0">Review request for <strong>{selectedReq.employeeName}</strong></p>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Leave Type:</span><span className="font-bold text-primary">{selectedReq.leaveType}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Duration:</span><span className="font-bold text-navy">{selectedReq.totalDays} day(s)</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Dates:</span><span className="font-mono text-gray-700">{new Date(selectedReq.startDate).toLocaleDateString()} - {new Date(selectedReq.endDate).toLocaleDateString()}</span></div>
              <div className="border-t border-gray-200/60 pt-1.5 text-gray-700"><strong>Reason:</strong> {selectedReq.reason}</div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Decision Action *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('Approved')}
                    className={`py-2 rounded-xl font-extrabold border-0 cursor-pointer transition-colors ${
                      reviewAction === 'Approved' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    ✓ Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('Rejected')}
                    className={`py-2 rounded-xl font-extrabold border-0 cursor-pointer transition-colors ${
                      reviewAction === 'Rejected' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">HR Remarks / Comments</label>
                <textarea
                  rows="3"
                  value={hrComment}
                  onChange={e => setHrComment(e.target.value)}
                  placeholder="Optional remarks for applicant..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold rounded-xl border-0 cursor-pointer ${
                    reviewAction === 'Approved' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  Confirm {reviewAction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── HR ENTITLEMENT SETTINGS MODAL ────────────── */}
      {entitlementModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 text-xs space-y-4">
            <h3 className="text-base font-bold text-navy m-0">Yearly Leave Entitlement Settings</h3>
            <p className="text-gray-500 m-0">Configure default annual leave allocations for all staff members.</p>

            <form onSubmit={handleSaveEntitlement} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Annual Leave (Days / Year)</label>
                <input
                  type="number"
                  value={entitlementForm.annualTotal}
                  onChange={e => setEntitlementForm({ ...entitlementForm, annualTotal: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Casual Leave (Days / Year)</label>
                <input
                  type="number"
                  value={entitlementForm.casualTotal}
                  onChange={e => setEntitlementForm({ ...entitlementForm, casualTotal: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-amber-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Sick Leave (Days / Year)</label>
                <input
                  type="number"
                  value={entitlementForm.sickTotal}
                  onChange={e => setEntitlementForm({ ...entitlementForm, sickTotal: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEntitlementModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white font-bold rounded-xl border-0 cursor-pointer"
                >
                  Save Entitlements
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
