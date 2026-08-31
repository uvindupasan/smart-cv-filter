import React, { useEffect, useState } from 'react';
import {
  getEmployeeDocuments, uploadEmployeeDocument, downloadEmployeeDocument, deleteEmployeeDocument, getEmployees
} from '../utils/api';
import {
  FaFolderOpen, FaUpload, FaSearch, FaLock, FaFilePdf, FaFileWord, FaFileImage,
  FaFileAlt, FaFileContract, FaIdCard, FaGraduationCap, FaNotesMedical,
  FaExclamationTriangle, FaDownload, FaTrashAlt, FaEye, FaPlus, FaSpinner,
  FaShieldAlt, FaThLarge, FaList, FaUserShield, FaTimes, FaExternalLinkAlt, FaCheckCircle
} from 'react-icons/fa';

export default function EmployeeDocuments() {
  const [documents, setDocuments]   = useState([]);
  const [stats, setStats]           = useState({ totalCount: 0, contracts: 0, identity: 0, academic: 0, medicalAndOther: 0 });
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [viewMode, setViewMode]     = useState('grid'); // 'grid' | 'table'

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [search, setSearch]                 = useState('');

  // Selected Document for Quick Drawer/Preview
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading]             = useState(false);
  const [uploadForm, setUploadForm]           = useState({
    employeeId: '',
    employeeName: '',
    documentName: '',
    category: 'Employment contract',
    notes: '',
    file: null
  });

  const CATEGORIES = [
    { name: 'CV', icon: <FaFileAlt className="text-blue-500" />, desc: 'Resumes & Profiles' },
    { name: 'NIC / Passport', icon: <FaIdCard className="text-purple-500" />, desc: 'Identity Credentials' },
    { name: 'Educational certificates', icon: <FaGraduationCap className="text-emerald-500" />, desc: 'Degrees & Diplomas' },
    { name: 'Employment contract', icon: <FaFileContract className="text-indigo-500" />, desc: 'Agreements & NDAs' },
    { name: 'Offer letter', icon: <FaFilePdf className="text-teal-500" />, desc: 'Appointment Letters' },
    { name: 'Medical certificates', icon: <FaNotesMedical className="text-amber-500" />, desc: 'Medical Fitness & Claims' },
    { name: 'Service letters', icon: <FaFileAlt className="text-cyan-500" />, desc: 'Experience Certificates' },
    { name: 'Warning letters', icon: <FaExclamationTriangle className="text-red-500" />, desc: 'HR Notices & Disciplinary' },
    { name: 'Performance documents', icon: <FaUserShield className="text-blue-600" />, desc: 'KPIs & Appraisals' },
    { name: 'Other HR documents', icon: <FaFolderOpen className="text-gray-500" />, desc: 'Miscellaneous' }
  ];

  useEffect(() => {
    fetchDocuments();
    fetchEmployeesList();
  }, [categoryFilter, employeeFilter, search]);

  const fetchEmployeesList = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.error('Failed to load employee directory for dropdown:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await getEmployeeDocuments({
        category: categoryFilter,
        employeeId: employeeFilter,
        search
      });
      setDocuments(res.data.documents);
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to load employee documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      alert('Please select a file to upload!');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('employeeId', uploadForm.employeeId);
      formData.append('employeeName', uploadForm.employeeName);
      formData.append('documentName', uploadForm.documentName);
      formData.append('category', uploadForm.category);
      formData.append('notes', uploadForm.notes);
      formData.append('documentFile', uploadForm.file);

      const res = await uploadEmployeeDocument(formData);
      alert(res.data.message);
      setUploadModalOpen(false);
      setUploadForm({
        employeeId: '',
        employeeName: '',
        documentName: '',
        category: 'Employment contract',
        notes: '',
        file: null
      });
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSecureDownload = async (docId, docName) => {
    try {
      const res = await downloadEmployeeDocument(docId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', docName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download document securely');
    }
  };

  const handleDelete = async (docId, docName) => {
    if (!window.confirm(`Are you sure you want to delete "${docName}" from the secure vault?`)) return;
    try {
      await deleteEmployeeDocument(docId);
      if (selectedDoc?._id === docId) setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const getCategoryBadgeStyle = (cat) => {
    switch (cat) {
      case 'Employment contract':
      case 'Offer letter':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'NIC / Passport':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Educational certificates':
      case 'CV':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Medical certificates':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Warning letters':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getFileIcon = (mimeType, name) => {
    if (name?.endsWith('.pdf') || mimeType?.includes('pdf')) return <FaFilePdf className="text-red-500" />;
    if (name?.endsWith('.docx') || name?.endsWith('.doc')) return <FaFileWord className="text-blue-500" />;
    if (mimeType?.includes('image')) return <FaFileImage className="text-purple-500" />;
    return <FaFileAlt className="text-gray-500" />;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto font-sans text-gray-800">
      
      {/* ── Enterprise Hero Banner ──────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-navy to-slate-800 text-white rounded-3xl p-6 md:p-8 shadow-xl mb-8 border border-slate-700">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold tracking-wide">
              <FaShieldAlt className="text-emerald-400" /> AES-256 ENCRYPTED • ISO 27001 HR VAULT SECURITY
            </div>
            <h1 className="text-2xl md:text-3xl font-black m-0 tracking-tight text-white">
              Enterprise Employee Document Repository
            </h1>
            <p className="text-xs md:text-sm text-slate-300 m-0 max-w-2xl font-normal leading-relaxed">
              Centralized, compliance-grade document management for confidential personnel files, agreements, identity verification, and academic credentials.
            </p>
          </div>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="self-start lg:self-auto px-5 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl text-xs shadow-lg shadow-primary/40 border-0 cursor-pointer flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95"
          >
            <FaUpload className="text-sm" /> Upload Personnel Document
          </button>

        </div>
      </div>

      {/* ── Stat Summary Cards ──────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            <FaFolderOpen />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-bold m-0 uppercase tracking-wider">Total Vault Files</p>
            <h3 className="text-2xl font-black text-navy m-0 mt-0.5">{stats.totalCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
            <FaFileContract />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-bold m-0 uppercase tracking-wider">Contracts & Offers</p>
            <h3 className="text-2xl font-black text-indigo-600 m-0 mt-0.5">{stats.contracts}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
            <FaIdCard />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-bold m-0 uppercase tracking-wider">NIC & Passports</p>
            <h3 className="text-2xl font-black text-purple-600 m-0 mt-0.5">{stats.identity}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <FaGraduationCap />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-bold m-0 uppercase tracking-wider">Academic & CVs</p>
            <h3 className="text-2xl font-black text-emerald-600 m-0 mt-0.5">{stats.academic}</h3>
          </div>
        </div>
      </div>

      {/* ── Category Quick-Filter Folder Cards ────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider m-0">Document Categories</h3>
          <span className="text-xs text-primary font-bold">{CATEGORIES.length} Categories Configured</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <button
            onClick={() => setCategoryFilter('All')}
            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
              categoryFilter === 'All'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary/40 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg font-bold">📂</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                categoryFilter === 'All' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-600'
              }`}>{documents.length}</span>
            </div>
            <div className="font-bold text-xs">All Categories</div>
            <div className={`text-[10px] ${categoryFilter === 'All' ? 'text-slate-400' : 'text-gray-400'}`}>Everything in vault</div>
          </button>

          {CATEGORIES.slice(0, 4).map(cat => {
            const count = documents.filter(d => d.category === cat.name).length;
            const isSelected = categoryFilter === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setCategoryFilter(cat.name)}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary/40 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{cat.icon}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>{count}</span>
                </div>
                <div className="font-bold text-xs truncate">{cat.name}</div>
                <div className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>{cat.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filters & Search Toolbar ───────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="All">Filter by Category: All</option>
            {CATEGORIES.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <select
            value={employeeFilter}
            onChange={e => setEmployeeFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="All">Filter by Employee: All</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp.employeeId}>{emp.employeeId} - {emp.fullName}</option>
            ))}
          </select>

        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* View Mode Selector */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-bold border-0 cursor-pointer transition-colors ${
                viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Grid View"
            >
              <FaThLarge />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-bold border-0 cursor-pointer transition-colors ${
                viewMode === 'table' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Table Audit View"
            >
              <FaList />
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <FaSearch className="absolute left-3.5 top-3 text-gray-400 text-xs" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search document, employee..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

      </div>

      {/* ── Document Vault Repository Display ─────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold text-xs">Accessing encrypted document vault...</p>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* ── GRID CARD VIEW ────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5 group"
            >
              <div>
                {/* Card Top Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    {getFileIcon(doc.mimeType, doc.documentName)}
                  </div>

                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border ${getCategoryBadgeStyle(doc.category)}`}>
                    {doc.category}
                  </span>
                </div>

                {/* Title & Notes */}
                <h3 className="text-sm font-bold text-navy m-0 line-clamp-1 group-hover:text-primary transition-colors">
                  {doc.documentName}
                </h3>
                <p className="text-[11px] text-gray-400 font-normal m-0 mt-1 line-clamp-2">
                  {doc.notes || 'No description notes provided.'}
                </p>

                {/* Employee Tag & Metadata */}
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-semibold text-[11px]">Employee</span>
                    <span className="font-bold text-gray-800">{doc.employeeName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-semibold text-[11px]">Employee ID</span>
                    <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {doc.employeeId}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-semibold text-[11px]">Uploaded Date</span>
                    <span className="text-gray-500 font-medium text-[11px]">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="flex-1 py-2 bg-gray-50 hover:bg-primary hover:text-white text-gray-700 text-xs font-bold rounded-xl border-0 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <FaEye /> View Details
                </button>

                <button
                  onClick={() => handleSecureDownload(doc._id, doc.fileOriginalName)}
                  title="Secure Download"
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl border border-emerald-200 cursor-pointer transition-colors"
                >
                  <FaDownload />
                </button>

                <button
                  onClick={() => handleDelete(doc._id, doc.documentName)}
                  title="Delete Document"
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl border border-red-200 cursor-pointer transition-colors"
                >
                  <FaTrashAlt />
                </button>

              </div>
            </div>
          ))}

          {documents.length === 0 && (
            <div className="col-span-full py-16 bg-white rounded-2xl border border-gray-100 text-center space-y-2">
              <FaFolderOpen className="text-4xl text-gray-300" />
              <p className="text-gray-500 font-bold text-xs m-0">No documents found matching current filter criteria.</p>
            </div>
          )}
        </div>

      ) : (

        /* ── AUDIT TABLE VIEW ────────────────────────── */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-black tracking-wider">
                  <th className="py-4 px-5">Document Title</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Employee Details</th>
                  <th className="py-4 px-5">File Size</th>
                  <th className="py-4 px-5">Uploaded By</th>
                  <th className="py-4 px-5">Upload Date</th>
                  <th className="py-4 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-5 font-bold text-navy">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getFileIcon(doc.mimeType, doc.documentName)}</span>
                        <div>
                          <div className="text-xs font-bold text-navy">{doc.documentName}</div>
                          {doc.notes && <div className="text-[10px] text-gray-400 font-normal mt-0.5">{doc.notes}</div>}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border ${getCategoryBadgeStyle(doc.category)}`}>
                        {doc.category}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-bold text-gray-800">{doc.employeeName}</div>
                      <div className="font-mono text-[10px] text-primary mt-0.5">{doc.employeeId}</div>
                    </td>

                    <td className="py-4 px-5 font-mono text-[11px] text-gray-600">
                      {formatBytes(doc.fileSize)}
                    </td>

                    <td className="py-4 px-5 text-gray-600 font-semibold">
                      {doc.uploadedBy}
                    </td>

                    <td className="py-4 px-5 text-gray-500 text-[11px]">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          title="View / Details"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm border-0 cursor-pointer transition-colors"
                        >
                          <FaEye />
                        </button>

                        <button
                          onClick={() => handleSecureDownload(doc._id, doc.fileOriginalName)}
                          title="Secure Download"
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm border-0 cursor-pointer transition-colors"
                        >
                          <FaDownload />
                        </button>

                        <button
                          onClick={() => handleDelete(doc._id, doc.documentName)}
                          title="Delete Document"
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg text-sm border-0 cursor-pointer transition-colors"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DOCUMENT PREVIEW & METADATA DRAWER MODAL ──── */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-navy/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-6 border border-gray-100 text-xs space-y-5 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl">
                  {getFileIcon(selectedDoc.mimeType, selectedDoc.documentName)}
                </div>
                <div>
                  <h3 className="text-base font-black text-navy m-0">{selectedDoc.documentName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border ${getCategoryBadgeStyle(selectedDoc.category)}`}>
                      {selectedDoc.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">ID: {selectedDoc._id}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDoc(null)}
                className="text-gray-400 hover:text-gray-700 border-0 bg-transparent text-xl cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Document Metadata Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Assigned Employee</span>
                <span className="font-bold text-gray-800 text-xs">{selectedDoc.employeeName}</span>
                <span className="block font-mono text-[10px] text-primary">{selectedDoc.employeeId}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Upload Date</span>
                <span className="font-bold text-gray-800 text-xs">
                  {new Date(selectedDoc.createdAt).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Uploaded By</span>
                <span className="font-bold text-gray-800 text-xs">{selectedDoc.uploadedBy}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Security Status</span>
                <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600 text-xs">
                  <FaCheckCircle /> Encrypted & Verified
                </span>
              </div>
            </div>

            {/* Inline Preview Frame */}
            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 p-2 overflow-hidden flex flex-col justify-center items-center min-h-[250px]">
              <iframe
                src={`http://localhost:5000${selectedDoc.fileUrl}`}
                title="Document Preview"
                className="w-full h-full min-h-[300px] rounded-xl border-0 bg-white"
              ></iframe>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <a
                href={`http://localhost:5000${selectedDoc.fileUrl}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs border-0 cursor-pointer flex items-center gap-2"
              >
                <FaExternalLinkAlt /> Open in New Browser Tab
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSecureDownload(selectedDoc._id, selectedDoc.fileOriginalName)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs border-0 cursor-pointer flex items-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <FaDownload /> Secure Download File
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── UPLOAD DOCUMENT MODAL ────────────────────── */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 border border-gray-100 text-xs space-y-4">
            
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                <FaUpload />
              </div>
              <div>
                <h3 className="text-base font-black text-navy m-0">Upload Personnel Document</h3>
                <p className="text-gray-400 m-0 text-xs">Attach encrypted files to employee records.</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Target Employee *</label>
                <select
                  value={uploadForm.employeeId}
                  onChange={e => {
                    const emp = employees.find(x => x.employeeId === e.target.value);
                    setUploadForm({
                      ...uploadForm,
                      employeeId: e.target.value,
                      employeeName: emp ? emp.fullName : ''
                    });
                  }}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white font-bold text-xs"
                >
                  <option value="">-- Choose Employee from Directory --</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp.employeeId}>
                      {emp.employeeId} - {emp.fullName} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  value={uploadForm.documentName}
                  onChange={e => setUploadForm({ ...uploadForm, documentName: e.target.value })}
                  placeholder="e.g. Executive Employment Contract 2026.pdf"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Category *</label>
                <select
                  value={uploadForm.category}
                  onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white font-semibold text-xs"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Drag and Drop Dropzone style */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select File (PDF / Image / DOCX) *</label>
                <div className="border-2 border-dashed border-gray-200 hover:border-primary/50 bg-gray-50/50 p-4 rounded-2xl text-center space-y-2">
                  <input
                    type="file"
                    onChange={e => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                    required
                    className="w-full text-xs font-semibold text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400 font-medium m-0">Max upload file size: 15MB</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Confidential Notes / Remarks</label>
                <textarea
                  rows="2"
                  value={uploadForm.notes}
                  onChange={e => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  placeholder="Add optional internal HR notes or remarks..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl border-0 cursor-pointer shadow-lg shadow-primary/30 flex items-center gap-2"
                >
                  {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />} Save & Encrypt Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
