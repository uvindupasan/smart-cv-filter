import React, { useEffect, useState } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../utils/api';
import EmployeeModal from '../components/EmployeeModal';
import EmployeeFormModal from '../components/EmployeeFormModal';
import {
  FaUsers, FaUserCheck, FaHourglassHalf, FaUserGraduate, FaSearch,
  FaFilter, FaPlus, FaEye, FaEdit, FaTrash, FaThLarge, FaList,
  FaCalendarAlt, FaSortAmountDown, FaBriefcase, FaBuilding
} from 'react-icons/fa';

export default function EmployeesList() {
  const [employees, setEmployees]   = useState([]);
  const [meta, setMeta]             = useState({ totalCount: 0, activeCount: 0, probationCount: 0, internCount: 0 });
  const [loading, setLoading]       = useState(true);
  const [viewMode, setViewMode]     = useState('grid'); // 'grid' or 'table'

  // Filters State
  const [search, setSearch]                 = useState('');
  const [department, setDepartment]         = useState('All');
  const [designation, setDesignation]       = useState('All');
  const [employmentType, setEmploymentType] = useState('All');
  const [status, setStatus]                 = useState('All');
  const [joiningDateFrom, setJoiningDateFrom] = useState('');
  const [joiningDateTo, setJoiningDateTo]     = useState('');
  const [sortBy, setSortBy]                 = useState('joining_new');

  // Modals
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isFormOpen, setIsFormOpen]             = useState(false);
  const [employeeToEdit, setEmployeeToEdit]     = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, [search, department, designation, employmentType, status, joiningDateFrom, joiningDateTo, sortBy]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        department,
        designation,
        employmentType,
        status,
        joiningDateFrom,
        joiningDateTo,
        sortBy
      };
      const res = await getEmployees(params);
      setEmployees(res.data.employees);
      setMeta(res.data.meta);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (data, id) => {
    if (id) {
      await updateEmployee(id, data);
    } else {
      await createEmployee(data);
    }
    fetchEmployees();
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete or deactivate record for "${name}"?`)) {
      try {
        await deleteEmployee(id);
        fetchEmployees();
      } catch (err) {
        alert('Failed to delete employee: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDepartment('All');
    setDesignation('All');
    setEmploymentType('All');
    setStatus('All');
    setJoiningDateFrom('');
    setJoiningDateTo('');
    setSortBy('joining_new');
  };

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto font-sans text-gray-800">
      
      {/* ── Page Title Header ───────────────────────── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-primary/10 text-primary rounded-xl text-xl font-black">👥</span>
            <h1 className="text-2xl font-black text-navy m-0 tracking-tight">Employee Directory & HR Database</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 m-0">
            Manage comprehensive workforce profiles, employment types, bank details, and status updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setEmployeeToEdit(null); setIsFormOpen(true); }}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs shadow-md shadow-primary/30 border-0 cursor-pointer flex items-center gap-2 transition-all"
          >
            <FaPlus /> Add New Employee
          </button>
        </div>
      </div>

      {/* ── Top Metric Stat Cards ───────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            <FaUsers />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">Total Employees</p>
            <h3 className="text-2xl font-black text-navy m-0">{meta.totalCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <FaUserCheck />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">Active Staff</p>
            <h3 className="text-2xl font-black text-emerald-600 m-0">{meta.activeCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            <FaHourglassHalf />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">On Probation</p>
            <h3 className="text-2xl font-black text-amber-600 m-0">{meta.probationCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
            <FaUserGraduate />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">Interns</p>
            <h3 className="text-2xl font-black text-purple-600 m-0">{meta.internCount}</h3>
          </div>
        </div>
      </div>

      {/* ── Search, Filter & Sort Toolbar ─────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6 space-y-4">
        
        {/* Row 1: Search + View Mode Toggle + Reset */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-3.5 top-3 text-gray-400 text-xs" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ID, designation, skills..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={resetFilters}
              className="text-xs text-gray-500 hover:text-gray-800 font-bold bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl border-0 cursor-pointer transition-colors"
            >
              Reset Filters
            </button>

            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg text-xs border-0 cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-primary shadow-sm font-bold' : 'text-gray-500'
                }`}
                title="Grid View"
              >
                <FaThLarge />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs border-0 cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-primary shadow-sm font-bold' : 'text-gray-500'
                }`}
                title="Table View"
              >
                <FaList />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: 5 Key Filter Dropdowns + Sort */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-gray-100 text-xs">
          
          {/* Filter 1: Department */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Department</label>
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700"
            >
              <option value="All">All Departments</option>
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

          {/* Filter 2: Employment Type */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Employment Type</label>
            <select
              value={employmentType}
              onChange={e => setEmploymentType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700"
            >
              <option value="All">All Types</option>
              <option value="Permanent">Permanent</option>
              <option value="Probation">Probation</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
              <option value="Part-time">Part-time</option>
            </select>
          </div>

          {/* Filter 3: Employee Status */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Resigned">Resigned</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>

          {/* Filter 4: Joining Date From */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Joined From</label>
            <input
              type="date"
              value={joiningDateFrom}
              onChange={e => setJoiningDateFrom(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
            />
          </div>

          {/* Filter 5: Joining Date To */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Joined To</label>
            <input
              type="date"
              value={joiningDateTo}
              onChange={e => setJoiningDateTo(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
            />
          </div>

          {/* Sort Selector */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-bold text-primary"
            >
              <option value="joining_new">Joined (Newest)</option>
              <option value="joining_old">Joined (Oldest)</option>
              <option value="name_asc">Name (A - Z)</option>
              <option value="name_desc">Name (Z - A)</option>
              <option value="id_asc">Employee ID</option>
              <option value="department">Department</option>
            </select>
          </div>

        </div>
      </div>

      {/* ── Employee Content Area (Grid or Table) ────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold text-xs">Loading employee database...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center max-w-md mx-auto my-8">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-base font-bold text-navy mb-1">No employees found</h3>
          <p className="text-xs text-gray-500 mb-4">Try clearing filters or search query to view staff records.</p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl border-0 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map((emp) => (
            <div
              key={emp._id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-emerald-400 text-white font-black text-lg flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-navy truncate m-0 group-hover:text-primary transition-colors">
                        {emp.fullName}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium truncate m-0">{emp.designation}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${STATUS_CLASSES[emp.status] || 'bg-gray-100'}`}>
                    {emp.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 border-t border-b border-gray-100 py-3 mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">ID:</span>
                    <span className="font-mono font-bold text-gray-800">{emp.employeeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Department:</span>
                    <span className="font-bold text-primary">{emp.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded text-[10px] border ${TYPE_CLASSES[emp.employmentType] || 'bg-gray-100'}`}>
                      {emp.employmentType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="font-medium text-gray-700 truncate max-w-[180px]">{emp.companyEmail}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => setSelectedEmployee(emp)}
                  className="flex-1 py-1.5 bg-gray-50 hover:bg-primary/10 hover:text-primary text-gray-700 text-xs font-bold rounded-lg border border-gray-200/80 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <FaEye /> View
                </button>
                <button
                  onClick={() => { setEmployeeToEdit(emp); setIsFormOpen(true); }}
                  className="py-1.5 px-3 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 text-gray-700 text-xs font-bold rounded-lg border border-gray-200/80 cursor-pointer transition-colors"
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(emp._id, emp.fullName)}
                  className="py-1.5 px-3 bg-gray-50 hover:bg-rose-50 hover:text-rose-600 text-gray-700 text-xs font-bold rounded-lg border border-gray-200/80 cursor-pointer transition-colors"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>

            </div>
          ))}
        </div>

      ) : (

        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Name & Designation</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Employment Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joining Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => (
                <tr key={emp._id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary">{emp.employeeId}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-navy text-xs">{emp.fullName}</div>
                    <div className="text-[11px] text-gray-500">{emp.designation}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-700">{emp.department}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${TYPE_CLASSES[emp.employmentType] || 'bg-gray-100'}`}>
                      {emp.employmentType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${STATUS_CLASSES[emp.status] || 'bg-gray-100'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => setSelectedEmployee(emp)}
                      className="p-1.5 text-gray-600 hover:text-primary border-0 bg-transparent cursor-pointer text-sm"
                      title="View"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => { setEmployeeToEdit(emp); setIsFormOpen(true); }}
                      className="p-1.5 text-gray-600 hover:text-emerald-600 border-0 bg-transparent cursor-pointer text-sm"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(emp._id, emp.fullName)}
                      className="p-1.5 text-gray-600 hover:text-rose-600 border-0 bg-transparent cursor-pointer text-sm"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      )}

      {/* Profile Detail View Modal */}
      {selectedEmployee && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onEdit={(emp) => { setEmployeeToEdit(emp); setIsFormOpen(true); }}
        />
      )}

      {/* Add / Edit Form Modal */}
      <EmployeeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleCreateOrUpdate}
        employeeToEdit={employeeToEdit}
      />

    </div>
  );
}
