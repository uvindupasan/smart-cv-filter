import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaUserPlus, FaEdit } from 'react-icons/fa';

export default function EmployeeFormModal({ isOpen, onClose, onSave, employeeToEdit }) {
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    gender: 'Male',
    dateOfBirth: '',
    personalEmail: '',
    companyEmail: '',
    phoneNumber: '',
    address: '',
    emergencyContact: { name: '', phone: '', relation: '' },
    department: 'Engineering',
    designation: '',
    employmentType: 'Permanent',
    joiningDate: '',
    probationStartDate: '',
    probationEndDate: '',
    status: 'Active',
    manager: '',
    workingLocation: 'Colombo HQ',
    workMode: 'Hybrid',
    salary: { basicSalary: 0, allowance: 0, currency: 'LKR' },
    skillsStr: '',
    technologiesStr: '',
    bankDetails: { bankName: '', branch: '', accountNumber: '', accountName: '' }
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        ...employeeToEdit,
        dateOfBirth: employeeToEdit.dateOfBirth ? new Date(employeeToEdit.dateOfBirth).toISOString().split('T')[0] : '',
        joiningDate: employeeToEdit.joiningDate ? new Date(employeeToEdit.joiningDate).toISOString().split('T')[0] : '',
        probationStartDate: employeeToEdit.probationStartDate ? new Date(employeeToEdit.probationStartDate).toISOString().split('T')[0] : '',
        probationEndDate: employeeToEdit.probationEndDate ? new Date(employeeToEdit.probationEndDate).toISOString().split('T')[0] : '',
        skillsStr: employeeToEdit.skills ? employeeToEdit.skills.join(', ') : '',
        technologiesStr: employeeToEdit.technologies ? employeeToEdit.technologies.join(', ') : '',
        emergencyContact: employeeToEdit.emergencyContact || { name: '', phone: '', relation: '' },
        bankDetails: employeeToEdit.bankDetails || { bankName: '', branch: '', accountNumber: '', accountName: '' },
        salary: employeeToEdit.salary || { basicSalary: 0, allowance: 0, currency: 'LKR' }
      });
    } else {
      // Auto-generate employee ID for new entry
      const randomId = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
      setFormData({
        employeeId: randomId,
        fullName: '',
        gender: 'Male',
        dateOfBirth: '',
        personalEmail: '',
        companyEmail: '',
        phoneNumber: '',
        address: '',
        emergencyContact: { name: '', phone: '', relation: '' },
        department: 'Engineering',
        designation: '',
        employmentType: 'Permanent',
        joiningDate: new Date().toISOString().split('T')[0],
        probationStartDate: '',
        probationEndDate: '',
        status: 'Active',
        manager: '',
        workingLocation: 'Colombo HQ',
        workMode: 'Hybrid',
        salary: { basicSalary: 0, allowance: 0, currency: 'LKR' },
        skillsStr: '',
        technologiesStr: '',
        bankDetails: { bankName: '', branch: '', accountNumber: '', accountName: '' }
      });
    }
  }, [employeeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim() || !formData.companyEmail.trim() || !formData.designation.trim()) {
      setError('Please fill in Full Name, Company Email, and Designation.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        skills: formData.skillsStr ? formData.skillsStr.split(',').map(s => s.trim()).filter(Boolean) : [],
        technologies: formData.technologiesStr ? formData.technologiesStr.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      await onSave(payload, employeeToEdit?._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save employee.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{employeeToEdit ? '✏️' : '👤'}</span>
            <h3 className="text-base font-bold text-white m-0">
              {employeeToEdit ? 'Edit Employee Record' : 'Add New Employee'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white border-0 bg-transparent text-lg cursor-pointer">
            <FaTimes />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div>
            <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-3 border-b border-gray-100 pb-1">
              1. Basic Profile & Identity
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-600 font-bold mb-1">Employee ID *</label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 font-mono font-bold text-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-gray-600 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Kasun Prasanga Bandara"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+94 77 123 4567"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Emails & Contact */}
          <div>
            <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-3 border-b border-gray-100 pb-1">
              2. Emails & Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 font-bold mb-1">Company Email *</label>
                <input
                  type="email"
                  value={formData.companyEmail}
                  onChange={e => setFormData({ ...formData, companyEmail: e.target.value })}
                  placeholder="name@company.com"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Personal Email</label>
                <input
                  type="email"
                  value={formData.personalEmail}
                  onChange={e => setFormData({ ...formData, personalEmail: e.target.value })}
                  placeholder="personal@gmail.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-gray-600 font-bold mb-1">Residential Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="No. 45, Temple Road, Nugegoda"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Job & Employment Details */}
          <div>
            <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-3 border-b border-gray-100 pb-1">
              3. Department & Employment Setup
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-600 font-bold mb-1">Department *</label>
                <select
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                  <option value="Product">Product</option>
                  <option value="Sales">Sales</option>
                  <option value="IT">IT</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Designation *</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="Senior Software Engineer"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Employment Type *</label>
                <select
                  value={formData.employmentType}
                  onChange={e => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Probation">Probation</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Employee Status *</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white font-bold text-primary"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Work Mode</label>
                <select
                  value={formData.workMode}
                  onChange={e => setFormData({ ...formData, workMode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white"
                >
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Joining Date *</label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs border-0 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs border-0 cursor-pointer shadow-md shadow-primary/30 flex items-center gap-1.5"
            >
              <FaSave /> {saving ? 'Saving...' : employeeToEdit ? 'Update Employee' : 'Create Employee'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
