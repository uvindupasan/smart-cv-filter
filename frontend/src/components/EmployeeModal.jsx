import React, { useState } from 'react';
import {
  FaUser, FaBriefcase, FaMoneyBillWave, FaTools, FaFileAlt,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaTimes,
  FaBuilding, FaUserCheck, FaAward, FaUniversity
} from 'react-icons/fa';

export default function EmployeeModal({ employee, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState('general');

  if (!employee) return null;

  const STATUS_CLASSES = {
    Active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Inactive: 'bg-gray-100 text-gray-700 border-gray-300',
    Resigned: 'bg-amber-100 text-amber-800 border-amber-300',
    Terminated: 'bg-rose-100 text-rose-800 border-rose-300'
  };

  const TYPE_CLASSES = {
    Permanent: 'bg-blue-50 text-blue-700 border-blue-200',
    Probation: 'bg-amber-50 text-amber-700 border-amber-200',
    Internship: 'bg-purple-50 text-purple-700 border-purple-200',
    Contract: 'bg-teal-50 text-teal-700 border-teal-200',
    'Part-time': 'bg-pink-50 text-pink-700 border-pink-200'
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Header Profile Cover */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border-0 cursor-pointer text-lg transition-colors"
          >
            <FaTimes />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 text-white font-black text-2xl flex items-center justify-center shadow-xl shadow-primary/30 border-2 border-white/20">
              {employee.fullName.charAt(0)}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-xs font-mono bg-white/10 text-emerald-300 font-bold px-2.5 py-0.5 rounded-md">
                  {employee.employeeId}
                </span>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md border ${STATUS_CLASSES[employee.status] || 'bg-gray-100'}`}>
                  {employee.status}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${TYPE_CLASSES[employee.employmentType] || 'bg-gray-100'}`}>
                  {employee.employmentType}
                </span>
              </div>

              <h2 className="text-2xl font-black text-white m-0 tracking-tight">{employee.fullName}</h2>
              <p className="text-sm text-slate-300 font-medium mt-1 m-0">
                {employee.designation} • <span className="text-emerald-400 font-bold">{employee.department}</span>
              </p>
            </div>

            {onEdit && (
              <button
                onClick={() => { onClose(); onEdit(employee); }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/30 border-0 cursor-pointer transition-all"
              >
                ✏️ Edit Employee
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/80 px-6 gap-2 overflow-x-auto">
          {[
            { id: 'general', label: 'Personal & Contact', icon: <FaUser /> },
            { id: 'job', label: 'Job & Employment', icon: <FaBriefcase /> },
            { id: 'financial', label: 'Salary & Bank', icon: <FaMoneyBillWave /> },
            { id: 'skills', label: 'Skills & Background', icon: <FaTools /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 bg-transparent cursor-pointer transition-colors whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-primary text-primary font-black'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
                }
              `}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: General & Contact Info */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider m-0">Basic Profile</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Gender:</span>
                    <span className="font-bold text-gray-800">{employee.gender || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Date of Birth:</span>
                    <span className="font-bold text-gray-800">
                      {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Personal Email:</span>
                    <span className="font-bold text-gray-800">{employee.personalEmail || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Company Email:</span>
                    <span className="font-bold text-primary">{employee.companyEmail}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider m-0">Contact & Address</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Phone Number:</span>
                    <span className="font-bold text-gray-800">{employee.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Address:</span>
                    <span className="font-bold text-gray-800 text-right max-w-[200px]">{employee.address || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Emergency Contact:</span>
                    <span className="font-bold text-rose-600">
                      {employee.emergencyContact?.name} ({employee.emergencyContact?.relation}) - {employee.emergencyContact?.phone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Job & Employment Details */}
          {activeTab === 'job' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider m-0">Work Placement</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Department:</span>
                    <span className="font-bold text-primary">{employee.department}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Designation:</span>
                    <span className="font-bold text-gray-800">{employee.designation}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Supervisor / Manager:</span>
                    <span className="font-bold text-gray-800">{employee.manager || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Working Location:</span>
                    <span className="font-bold text-gray-800">{employee.workingLocation}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Work Mode:</span>
                    <span className="font-bold text-emerald-600">{employee.workMode}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider m-0">Employment Dates & Probation</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Joining Date:</span>
                    <span className="font-bold text-gray-800">
                      {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Probation Start Date:</span>
                    <span className="font-bold text-gray-800">
                      {employee.probationStartDate ? new Date(employee.probationStartDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Probation End Date:</span>
                    <span className="font-bold text-amber-600">
                      {employee.probationEndDate ? new Date(employee.probationEndDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Salary & Bank Details */}
          {activeTab === 'financial' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider m-0">Compensation</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Basic Salary:</span>
                    <span className="font-bold text-gray-800">
                      {employee.salary?.currency || 'LKR'} {employee.salary?.basicSalary?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Allowances:</span>
                    <span className="font-bold text-gray-800">
                      {employee.salary?.currency || 'LKR'} {employee.salary?.allowance?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-sm font-black">
                    <span className="text-navy">Total Package:</span>
                    <span className="text-emerald-600">
                      {employee.salary?.currency || 'LKR'} {((employee.salary?.basicSalary || 0) + (employee.salary?.allowance || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider m-0">Bank Account Details</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Bank Name:</span>
                    <span className="font-bold text-gray-800">{employee.bankDetails?.bankName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Branch:</span>
                    <span className="font-bold text-gray-800">{employee.bankDetails?.branch || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Account Number:</span>
                    <span className="font-mono font-bold text-primary">{employee.bankDetails?.accountNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Account Name:</span>
                    <span className="font-bold text-gray-800">{employee.bankDetails?.accountName || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Skills & Background */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              {/* Skills & Technologies */}
              <div>
                <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2 m-0">Skills & Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {employee.skills?.map((s, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                      {s}
                    </span>
                  ))}
                  {employee.technologies?.map((t, idx) => (
                    <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                      ⚡ {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2 m-0">Education</h4>
                {employee.education?.length === 0 ? (
                  <p className="text-xs text-gray-400 m-0">No education entries.</p>
                ) : (
                  <div className="space-y-2">
                    {employee.education?.map((edu, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                        <span className="font-bold text-navy">{edu.degree}</span> — <span className="text-gray-600">{edu.institution}</span> ({edu.year})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs border-0 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
