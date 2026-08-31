import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicCampaign, submitCV } from '../utils/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function Apply() {
  const { slug } = useParams();

  const [campaign, setCampaign]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  const [form, setForm] = useState({
    fullName: '', gender: '', address: '', email: '',
    phone: '', educationalInstitute: '', degree: '',
    graduationYear: '', skills: '', whyHireYou: '',
  });

  const [cvFile, setCvFile]       = useState(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef              = useRef(null);

  useEffect(() => { loadCampaign(); }, [slug]);

  const loadCampaign = async () => {
    try {
      const res = await getPublicCampaign(slug);
      setCampaign(res.data.campaign);
    } catch {
      setError('This application link is invalid or the campaign is closed.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File size must be less than 5 MB.');
      e.target.value = '';
      return;
    }

    setFileError('');
    setCvFile(file);
  };

  const removeFile = () => {
    setCvFile(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (fileError) return;

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (cvFile) formData.append('cvFile', cvFile);

      await submitCV(slug, formData);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] p-6 font-sans flex items-center justify-center">
        <p className="text-gray-400">Loading application form...</p>
      </div>
    );
  }

  // ── Error (campaign not found / inactive) ─────────────────
  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] p-6 font-sans">
        <div className="max-w-[400px] my-20 mx-auto bg-white rounded-xl p-10 text-center shadow-lg">
          <div className="text-[40px] mb-4">❌</div>
          <h2 className="text-xl font-bold text-navy mb-2">Campaign Not Found</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // ── Deadline Expired screen ───────────────────────────────
  // (campaign was found but deadline has passed → isActive=false)
  if (campaign && !campaign.isActive) {
    const deadlineStr = campaign.deadline
      ? new Date(campaign.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;
    return (
      <div className="min-h-screen bg-[#f0f2f5] p-6 font-sans">
        <div className="max-w-[480px] my-20 mx-auto bg-white rounded-2xl p-10 text-center shadow-lg border border-red-100">
          <div className="text-[52px] mb-4">⏰</div>
          <h2 className="text-2xl font-bold text-navy mb-3">Applications Closed</h2>
          <p className="text-[15px] text-gray-600 leading-relaxed mb-2">
            The application period for the <strong>{campaign.position}</strong> position has ended.
          </p>
          {deadlineStr && (
            <p className="text-sm text-red-500 font-medium mb-4">
              Deadline was: {deadlineStr}
            </p>
          )}
          <p className="text-sm text-gray-500 leading-relaxed">
            If you believe this is an error, please contact the HR team directly.
          </p>
          <div className="mt-6 text-sm text-gray-400 border-t border-gray-100 pt-4">
            Smart CV Filter — AI-Powered Recruitment Platform
          </div>
        </div>
      </div>
    );
  }


  // ── Success ──────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] p-6 font-sans">
        <div className="max-w-[480px] my-20 mx-auto bg-white rounded-2xl p-10 text-center shadow-lg">
          <div className="text-[48px] mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-navy mb-3">Application Submitted!</h2>
          <p className="text-[15px] text-gray-600 leading-relaxed mb-2">
            Thank you for applying for the <strong>{campaign.position}</strong> position.
          </p>
          <p className="text-[15px] text-gray-600 leading-relaxed mb-2">
            We have received your application and will review it shortly.
            We will contact you via email if you are shortlisted.
          </p>
          <div className="mt-6 text-lg">Good luck! 🍀</div>
        </div>
      </div>
    );
  }

  // ── Application Form ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f0f2f5] px-4 py-6 sm:p-6 font-sans">
      <div className="max-w-[720px] mx-auto">

        {/* Job Banner */}
        <div className="bg-primary rounded-xl p-6 text-white mb-4">
          <h1 className="text-[22px] font-bold mb-1">Apply: {campaign.position}</h1>
          {campaign.department && <p className="text-sm opacity-85 m-0">{campaign.department}</p>}
        </div>

        {/* Job Details */}
        <div className="bg-white rounded-xl mb-4 overflow-hidden">
          <details>
            <summary className="px-5 py-3.5 cursor-pointer text-sm font-semibold text-gray-600 list-none">
              📋 View Job Details
            </summary>
            <div className="px-5 pb-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <strong className="text-sm text-navy">Job Description</strong>
                <p className="text-sm text-gray-600 leading-relaxed m-0">{campaign.jobDescription}</p>
              </div>
              <div className="flex flex-col gap-1">
                <strong className="text-sm text-navy">What We Expect</strong>
                <p className="text-sm text-gray-600 leading-relaxed m-0">{campaign.companyExpectations}</p>
              </div>
              <div className="flex flex-col gap-1">
                <strong className="text-sm text-navy">Your Responsibilities</strong>
                <p className="text-sm text-gray-600 leading-relaxed m-0">{campaign.candidateResponsibilities}</p>
              </div>
              {campaign.requiredSkills?.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  <strong className="text-sm text-navy">Required Skills: </strong>
                  {campaign.requiredSkills.map(s => (
                    <span key={s} className="bg-primary-light text-primary px-2 py-0.5 rounded-full text-[13px] ml-1.5">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </details>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-xl p-4 sm:p-7 shadow-sm">
          <h2 className="text-lg font-bold text-navy mb-5">Your Application</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Personal Info */}
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3.5">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-1">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Full Name *" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name" required />
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-medium text-gray-600">Gender *</label>
                  <select name="gender" value={form.gender} onChange={handleChange} required className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none">
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Email Address *" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" type="email" required />
                <Field label="Phone Number" name="phone" value={form.phone} onChange={handleChange} placeholder="+94 77 123 4567" />
              </div>
              <Field label="Home Address *" name="address" value={form.address} onChange={handleChange} placeholder="No. 10, Main Street, Colombo 07" required />
            </div>

            {/* Education */}
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3.5">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-1">Education</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Educational Institute *" name="educationalInstitute" value={form.educationalInstitute} onChange={handleChange} placeholder="KIU / University of Colombo..." required />
                <Field label="Degree / Programme" name="degree" value={form.degree} onChange={handleChange} placeholder="BSc Software Engineering" />
              </div>
              <div className="w-48">
                <Field label="Graduation Year" name="graduationYear" value={form.graduationYear} onChange={handleChange} placeholder="2024" />
              </div>
            </div>

            {/* Skills */}
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3.5">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-1">Skills</h3>
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium text-gray-600">Your Skills * (comma separated)</label>
                <input
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  placeholder="Python, React, SQL, Machine Learning, English, Communication..."
                  required
                  className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none"
                />
                <span className="text-xs text-gray-400">List all your technical and soft skills, languages, tools</span>
              </div>
            </div>

            {/* Personal Statement */}
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3.5">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-1">Personal Statement</h3>
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium text-gray-600">Why should we hire you? *</label>
                <textarea
                  name="whyHireYou"
                  value={form.whyHireYou}
                  onChange={handleChange}
                  placeholder="Tell us about your strengths, experience, and why you are the best candidate for this role..."
                  required
                  rows={5}
                  className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none resize-y font-[inherit]"
                />
              </div>
            </div>

            {/* CV File Upload */}
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3.5">
              <div>
                <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-1">Upload CV</h3>
                <p className="text-xs text-gray-400 mt-1">PDF only · Max 5 MB · Optional but recommended</p>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current.click()}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
                  cvFile
                    ? 'border-primary bg-primary-light'
                    : 'border-gray-300 bg-gray-50 hover:border-primary hover:bg-[#f0faf6]'
                }`}
              >
                {cvFile ? (
                  <>
                    <span className="text-3xl">📄</span>
                    <p className="text-sm font-semibold text-primary text-center">{cvFile.name}</p>
                    <p className="text-xs text-gray-500">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <span className="text-3xl text-gray-300">📎</span>
                    <p className="text-sm font-medium text-gray-500">Click to upload your CV</p>
                    <p className="text-xs text-gray-400">PDF files only, up to 5 MB</p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {fileError && (
                <p className="text-xs text-red-500 flex items-center gap-1">⚠️ {fileError}</p>
              )}

              {cvFile && (
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-xs text-red-500 hover:underline text-left w-fit"
                >
                  ✕ Remove file
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !!fileError}
              className={`bg-primary text-white py-3.5 border-0 rounded-lg text-base font-semibold flex items-center justify-center gap-2 transition-opacity ${
                submitting || fileError ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'
              }`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : '🚀 Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, required, type = 'text' }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-medium text-gray-600">{label}</label>
      <input
        name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required} type={type}
        className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none"
      />
    </div>
  );
}
