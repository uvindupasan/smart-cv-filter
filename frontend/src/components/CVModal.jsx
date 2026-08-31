import React, { useRef, useState } from 'react';
import { getCVFile, updateCVStatus, addCVNote, updateCVRating } from '../utils/api';

const STATUS_COLORS = {
  applied:     { bg: '#e8f4ff', text: '#1a6bb5', label: 'Applied'     },
  new:         { bg: '#e8f4ff', text: '#1a6bb5', label: 'Applied'     },
  reviewed:    { bg: '#fff8e6', text: '#b57c00', label: 'Reviewed'    },
  shortlisted: { bg: '#e6f7f2', text: '#0F6E56', label: 'Shortlisted' },
  interview:   { bg: '#f3e8ff', text: '#7e22ce', label: 'Interview'   },
  selected:    { bg: '#dcfce7', text: '#15803d', label: 'Selected'    },
  rejected:    { bg: '#fff0f0', text: '#cc3333', label: 'Rejected'    },
};

export default function CVModal({ cv: initialCv, onClose }) {
  const printRef        = useRef();
  const [cv, setCv]     = useState(initialCv);
  const [loadingFile,   setLoadingFile]   = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const handleRatingChange = async (newRating) => {
    try {
      const finalRating = newRating === cv.rating ? 0 : newRating;
      const res = await updateCVRating(cv._id, finalRating);
      setCv(prev => ({ ...prev, rating: res.data.cv.rating }));
    } catch {
      alert('Failed to update rating.');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await addCVNote(cv._id, noteText.trim());
      setCv(prev => ({ ...prev, notes: res.data.cv.notes }));
      setNoteText('');
    } catch {
      alert('Failed to add note.');
    } finally {
      setAddingNote(false);
    }
  };

  /* ── Status change ─────────────────────────── */
  const handleStatusChange = async (newStatus) => {
    if (newStatus === cv.status) return;
    setUpdatingStatus(true);
    try {
      const res = await updateCVStatus(cv._id, newStatus);
      setCv(prev => ({ ...prev, status: res.data.cv.status }));
    } catch {
      alert('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  /* ── View uploaded PDF ─────────────────────── */
  const handleViewFile = async () => {
    setLoadingFile(true);
    try {
      const res  = await getCVFile(cv._id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      alert('Could not load the uploaded CV file.');
    } finally {
      setLoadingFile(false);
    }
  };

  /* ── Print / Download application PDF ─────── */
  const handleDownload = () => {
    const printContent  = printRef.current.innerHTML;
    const originalBody  = document.body.innerHTML;

    document.body.innerHTML = `
      <html>
        <head>
          <title>Application — ${cv.fullName}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
            .cv-header { border-bottom: 3px solid #1D9E75; padding-bottom: 20px; margin-bottom: 24px; }
            .cv-name   { font-size: 26px; font-weight: 700; color: #1a1a2e; }
            .cv-email  { font-size: 14px; color: #555; margin-top: 4px; }
            .section   { margin-bottom: 20px; }
            .section-title { font-size: 12px; font-weight: 700; color: #1D9E75; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .info-item label { font-size: 11px; color: #888; display: block; }
            .info-item span  { font-size: 14px; font-weight: 500; }
            .skills-list { display: flex; flex-wrap: wrap; gap: 6px; }
            .skill-tag { background: #e6f7f2; color: #0F6E56; padding: 3px 10px; border-radius: 10px; font-size: 13px; }
            .statement { background: #f9f9f9; border-left: 3px solid #1D9E75; padding: 12px 16px; border-radius: 4px; font-size: 14px; line-height: 1.6; }
            .footer { margin-top: 30px; font-size: 11px; color: #aaa; text-align: center; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `;

    window.print();
    document.body.innerHTML = originalBody;
    window.location.reload();
  };

  const statusStyle = STATUS_COLORS[cv.status] || STATUS_COLORS.new;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl font-sans">

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center gap-3 flex-wrap">
          <h2 className="text-[17px] font-semibold text-navy m-0">Candidate Application</h2>
          <div className="flex gap-2 items-center flex-wrap">

            {/* Status Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 whitespace-nowrap">Status:</span>
              <select
                value={cv.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                className="px-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer outline-none disabled:opacity-60"
              >
                {Object.entries(STATUS_COLORS).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* View uploaded PDF — only shown if candidate uploaded a file */}
            {cv.cvFile?.filename && (
              <button
                onClick={handleViewFile}
                disabled={loadingFile}
                className="px-3.5 py-1.5 bg-blue-600 text-white border-0 rounded-lg cursor-pointer font-semibold text-sm flex items-center gap-1.5 disabled:opacity-60"
              >
                {loadingFile ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Loading...
                  </>
                ) : '📄 View Uploaded CV'}
              </button>
            )}

            {/* Download system-generated PDF from form data */}
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-primary text-white border-0 rounded-lg cursor-pointer font-semibold text-sm"
            >
              ⬇ Download Application PDF
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 border-0 rounded-lg cursor-pointer text-base"
            >
              ✕
            </button>
          </div>
        </div>

        {/* CV Content */}
        <div className="overflow-y-auto p-6">
          <div ref={printRef} id="cv-print-content">

            {/* CV Header */}
            <div className="cv-header flex justify-between items-start border-b-[3px] border-primary pb-4 mb-5">
              <div className="flex gap-3.5 items-center">
                <div className="w-[52px] h-[52px] rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {cv.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div className="cv-name text-[22px] font-bold text-navy">{cv.fullName}</div>
                  <div className="cv-email text-[13px] text-gray-600 mt-0.5">{cv.email}</div>
                  {cv.phone && <div className="text-[13px] text-gray-600 mt-0.5">📞 {cv.phone}</div>}
                </div>
              </div>
              {cv.campaign?.position && (
                <div className="text-[13px] text-gray-400 bg-[#f0faf6] px-3 py-1.5 rounded-lg">
                  Applied for: <strong>{cv.campaign.position}</strong>
                </div>
              )}
            </div>

            {/* Uploaded File Banner */}
            {cv.cvFile?.filename && (
              <div className="section mb-[18px] flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                <span className="text-blue-500">📄</span>
                <span className="text-sm text-blue-700 font-medium">Uploaded CV (Original):</span>
                <span className="text-sm text-blue-600 flex-1 truncate">{cv.cvFile.originalName}</span>
                <span className="text-xs text-blue-400">({(cv.cvFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}

            {/* Personal Info */}
            <div className="section mb-[18px]">
              <div className="section-title text-xs font-bold text-primary uppercase tracking-wide mb-2.5">Personal Information</div>
              <div className="info-grid grid grid-cols-2 gap-2.5">
                <InfoItem label="Gender"  value={cv.gender} />
                <InfoItem label="Address" value={cv.address} />
              </div>
            </div>

            {/* Education */}
            <div className="section mb-[18px]">
              <div className="section-title text-xs font-bold text-primary uppercase tracking-wide mb-2.5">Education</div>
              <div className="info-grid grid grid-cols-2 gap-2.5">
                <InfoItem label="Institute"       value={cv.educationalInstitute} />
                <InfoItem label="Degree / Programme" value={cv.degree || '—'} />
                <InfoItem label="Graduation Year" value={cv.graduationYear || '—'} />
              </div>
            </div>

            {/* Skills */}
            <div className="section mb-[18px]">
              <div className="section-title text-xs font-bold text-primary uppercase tracking-wide mb-2.5">Skills</div>
              <div className="skills-list flex flex-wrap gap-1.5">
                {cv.skills?.map(skill => (
                  <span key={skill} className="skill-tag bg-primary-light text-primary-dark px-2.5 py-0.5 rounded-full text-[13px]">{skill}</span>
                ))}
              </div>
            </div>

            {/* Why Hire */}
            <div className="section mb-[18px]">
              <div className="section-title text-xs font-bold text-primary uppercase tracking-wide mb-2.5">Why Should We Hire Me?</div>
              <div className="statement bg-gray-50 border-l-[3px] border-primary px-4 py-3 rounded text-sm leading-relaxed text-gray-700">
                {cv.whyHireYou}
              </div>
            </div>

            {/* AI Score (if from search results) */}
            {cv.matchScore !== undefined && (
              <div className="section mb-[18px] flex items-center gap-2">
                <div className="section-title text-xs font-bold text-primary uppercase tracking-wide">Semantic Relevance Score:</div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  cv.matchScore >= 70 ? 'bg-primary-light text-primary' :
                  cv.matchScore >= 40 ? 'bg-[#fff8e6] text-[#b57c00]' :
                  'bg-gray-100 text-gray-400'
                }`}>{cv.matchScore}%</span>
              </div>
            )}

            {/* Status + Date */}
            <div className="flex justify-between text-xs text-gray-400 border-t border-gray-100 pt-3 mt-4">
              <span>Status: <strong style={{ color: statusStyle.text }}>{statusStyle.label}</strong></span>
              <span>Applied: {new Date(cv.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}</span>
            </div>

            <div className="footer mt-6 text-[11px] text-gray-300 text-center">
              Smart CV Filter System | AI-Powered Recruitment Platform | KIU Research 2026
            </div>
          </div>

          {/* ── Recruiter Notes & Ratings (CRM Widgets) ── */}
          <div className="mt-6 border-t border-gray-100 pt-4 bg-gray-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
            {/* Rating Star Selection */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate Fit Rating</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    className="p-1 cursor-pointer bg-transparent border-0 text-2xl transition-all hover:scale-110 active:scale-95 animate-transition"
                    title={`Rate ${star} Star${star > 1 ? 's' : ''}`}
                  >
                    <span style={{ color: star <= (cv.rating || 0) ? '#ffb100' : '#e2e8f0' }} className="select-none">
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes List & Submission Input */}
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">Recruiter Activity & Internal Notes</span>
              
              {/* Notes Container */}
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto mb-4 pr-1">
                {(!cv.notes || cv.notes.length === 0) ? (
                  <div className="text-center py-4 bg-white border border-gray-100 rounded-xl">
                    <p className="text-xs text-gray-400 italic m-0">No CRM notes added yet. Use the field below to log candidate feedback.</p>
                  </div>
                ) : (
                  cv.notes.map((note, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                      <p className="m-0 text-xs text-gray-700 font-normal leading-relaxed break-words whitespace-pre-wrap">{note.text}</p>
                      <span className="text-[10px] text-gray-400 block mt-1.5 font-medium">
                        ✏️ Added on {new Date(note.createdAt).toLocaleString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Note */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a recruiter note (e.g. 'Highly skilled in docker, scheduled interview for Monday')..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                />
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !noteText.trim()}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white border-0 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="info-item mb-2">
      <label className="text-xs text-gray-400 block mb-0.5">{label}</label>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
