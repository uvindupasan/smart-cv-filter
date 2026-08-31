import React, { useEffect, useState } from 'react';
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  createDesignation, updateDesignation, deleteDesignation
} from '../utils/api';
import {
  FaBuilding, FaBriefcase, FaPlus, FaEdit, FaTrash, FaCheckCircle,
  FaTimesCircle, FaSearch, FaUserTie, FaLayerGroup
} from 'react-icons/fa';

export default function Departments() {
  const [departments, setDepartments]   = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('departments'); // 'departments' or 'designations'
  const [search, setSearch]             = useState('');

  // Modals state
  const [deptModalOpen, setDeptModalOpen]   = useState(false);
  const [editingDept, setEditingDept]       = useState(null);
  const [deptForm, setDeptForm]             = useState({ name: '', code: '', head: '', description: '', status: 'Active' });

  const [desigModalOpen, setDesigModalOpen] = useState(false);
  const [editingDesig, setEditingDesig]     = useState(null);
  const [desigForm, setDesigForm]           = useState({ title: '', department: 'Software Development', level: 'Mid-Level', description: '', status: 'Active' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getDepartments();
      setDepartments(res.data.departments);
      setDesignations(res.data.designations);
    } catch (err) {
      console.error('Failed to load departments data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Department Handlers
  const handleSaveDept = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await updateDepartment(editingDept._id, deptForm);
      } else {
        await createDepartment(deptForm);
      }
      setDeptModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving department');
    }
  };

  const handleDeleteDept = async (id, name) => {
    if (window.confirm(`Delete department "${name}"?`)) {
      await deleteDepartment(id);
      fetchData();
    }
  };

  // Designation Handlers
  const handleSaveDesig = async (e) => {
    e.preventDefault();
    try {
      if (editingDesig) {
        await updateDesignation(editingDesig._id, desigForm);
      } else {
        await createDesignation(desigForm);
      }
      setDesigModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving designation');
    }
  };

  const handleDeleteDesig = async (id, title) => {
    if (window.confirm(`Delete designation "${title}"?`)) {
      await deleteDesignation(id);
      fetchData();
    }
  };

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase()) ||
    d.head.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDesignations = designations.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto font-sans text-gray-800">
      
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-primary/10 text-primary rounded-xl text-xl font-black">🏢</span>
            <h1 className="text-2xl font-black text-navy m-0 tracking-tight">Departments & Designation Management</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 m-0">
            Define organizational structure, department codes, heads of department, and job titles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'departments' ? (
            <button
              onClick={() => {
                setEditingDept(null);
                setDeptForm({ name: '', code: '', head: '', description: '', status: 'Active' });
                setDeptModalOpen(true);
              }}
              className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs shadow-md shadow-primary/30 border-0 cursor-pointer flex items-center gap-2"
            >
              <FaPlus /> Add Department
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingDesig(null);
                setDesigForm({ title: '', department: departments[0]?.name || 'Software Development', level: 'Mid-Level', description: '', status: 'Active' });
                setDesigModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 border-0 cursor-pointer flex items-center gap-2"
            >
              <FaPlus /> Add Designation
            </button>
          )}
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            <FaBuilding />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">Total Departments</p>
            <h3 className="text-2xl font-black text-navy m-0">{departments.length}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
            <FaBriefcase />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">Job Designations</p>
            <h3 className="text-2xl font-black text-purple-600 m-0">{designations.length}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <FaUserTie />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold m-0 uppercase">Active Units</p>
            <h3 className="text-2xl font-black text-emerald-600 m-0">
              {departments.filter(d => d.status === 'Active').length}
            </h3>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2 rounded-lg text-xs font-bold border-0 cursor-pointer transition-colors ${
              activeTab === 'departments' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            🏢 Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('designations')}
            className={`px-4 py-2 rounded-lg text-xs font-bold border-0 cursor-pointer transition-colors ${
              activeTab === 'designations' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            💼 Designations ({designations.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <FaSearch className="absolute left-3 top-3 text-gray-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold text-xs">Loading organizational units...</p>
        </div>
      ) : activeTab === 'departments' ? (

        /* DEPARTMENTS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepartments.map((dept) => (
            <div key={dept._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                        {dept.code}
                      </span>
                      <h3 className="text-base font-bold text-navy m-0">{dept.name}</h3>
                    </div>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                    dept.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-600 border-gray-300'
                  }`}>
                    {dept.status}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mb-4 line-clamp-2">{dept.description || 'No description provided.'}</p>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs space-y-1">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Department Head</span>
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <FaUserTie className="text-primary" /> {dept.head}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setEditingDept(dept);
                    setDeptForm(dept);
                    setDeptModalOpen(true);
                  }}
                  className="py-1.5 px-3 bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-700 text-xs font-bold rounded-lg border-0 cursor-pointer transition-colors"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => handleDeleteDept(dept._id, dept.name)}
                  className="py-1.5 px-3 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-700 text-xs font-bold rounded-lg border-0 cursor-pointer transition-colors"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

      ) : (

        /* DESIGNATIONS TABLE */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Designation Title</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Job Level</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDesignations.map((desig) => (
                <tr key={desig._id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-navy">{desig.title}</td>
                  <td className="py-3 px-4 font-semibold text-primary">{desig.department}</td>
                  <td className="py-3 px-4">
                    <span className="bg-purple-50 text-purple-700 font-bold text-[10px] px-2 py-0.5 rounded border border-purple-200">
                      {desig.level}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                      desig.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {desig.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{desig.description || 'N/A'}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingDesig(desig);
                        setDesigForm(desig);
                        setDesigModalOpen(true);
                      }}
                      className="p-1.5 text-gray-600 hover:text-primary border-0 bg-transparent cursor-pointer text-sm"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteDesig(desig._id, desig.title)}
                      className="p-1.5 text-gray-600 hover:text-rose-600 border-0 bg-transparent cursor-pointer text-sm"
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

      {/* DEPARTMENT MODAL */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 text-xs">
            <h3 className="text-base font-bold text-navy mb-4">
              {editingDept ? 'Edit Department' : 'Create New Department'}
            </h3>
            <form onSubmit={handleSaveDept} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Department Name *</label>
                <input
                  type="text"
                  value={deptForm.name}
                  onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Software Development"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Department Code *</label>
                  <input
                    type="text"
                    value={deptForm.code}
                    onChange={e => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. DEV"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Status</label>
                  <select
                    value={deptForm.status}
                    onChange={e => setDeptForm({ ...deptForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Department Head</label>
                <input
                  type="text"
                  value={deptForm.head}
                  onChange={e => setDeptForm({ ...deptForm, head: e.target.value })}
                  placeholder="Manager / Head of Dept"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={deptForm.description}
                  onChange={e => setDeptForm({ ...deptForm, description: e.target.value })}
                  placeholder="Department scope..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white font-bold rounded-xl border-0 cursor-pointer"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DESIGNATION MODAL */}
      {desigModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 text-xs">
            <h3 className="text-base font-bold text-navy mb-4">
              {editingDesig ? 'Edit Designation' : 'Create New Designation'}
            </h3>
            <form onSubmit={handleSaveDesig} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Job Title *</label>
                <input
                  type="text"
                  value={desigForm.title}
                  onChange={e => setDesigForm({ ...desigForm, title: e.target.value })}
                  placeholder="e.g. Lead Software Architect"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Department *</label>
                  <select
                    value={desigForm.department}
                    onChange={e => setDesigForm({ ...desigForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white"
                  >
                    {departments.map(d => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">Job Level</label>
                  <select
                    value={desigForm.level}
                    onChange={e => setDesigForm({ ...desigForm, level: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white"
                  >
                    <option value="Junior">Junior</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Status</label>
                <select
                  value={desigForm.status}
                  onChange={e => setDesigForm({ ...desigForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={desigForm.description}
                  onChange={e => setDesigForm({ ...desigForm, description: e.target.value })}
                  placeholder="Role description..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDesigModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl border-0 cursor-pointer"
                >
                  Save Designation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
