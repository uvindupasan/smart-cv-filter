import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCampaign } from '../utils/api';

export default function CampaignCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [created, setCreated] = useState(null);

  const [form, setForm] = useState({
    position: '',
    department: '',
    jobDescription: '',
    companyExpectations: '',
    candidateResponsibilities: '',
    requiredSkills: '',
    requiredQualifications: '',
    deadline: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        requiredSkills: form.requiredSkills
          ? form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      };

      const res = await createCampaign(payload);
      setCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (created) {
    const applyUrl = `${window.location.origin}/apply/${created.campaign.slug}`;
    return (
      <div className="min-h-screen bg-[#f5f7fa] p-6 font-sans">
        <div className="max-w-[500px] mt-20 mx-auto bg-white rounded-2xl p-10 shadow-lg text-center">
          <div className="text-[48px] mb-4">✅</div>
          <h2 className="text-2xl font-bold text-navy mb-2">Campaign Created!</h2>
          <p className="text-gray-400 mb-4">Share this link with candidates:</p>
          <div className="bg-[#f0faf6] border border-primary rounded-lg p-3 px-4 flex items-center gap-2.5 mb-6">
            <span className="flex-1 text-[13px] text-primary font-mono break-all text-left">{applyUrl}</span>
            <button
              onClick={() => navigator.clipboard.writeText(applyUrl)}
              className="px-3 py-1.5 bg-primary text-white border-0 rounded-md cursor-pointer whitespace-nowrap text-sm"
            >
              📋 Copy
            </button>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(`/campaigns/${created.campaign._id}`)}
              className="px-5 py-2.5 bg-primary text-white border-0 rounded-lg cursor-pointer font-semibold"
            >
              View Campaign
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form
  return (
    <div className="min-h-screen bg-[#f5f7fa] px-4 py-5 sm:p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/')} className="px-3.5 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer text-sm">
            ← Back
          </button>
          <h1 className="text-[22px] font-bold text-navy">Create New Job Campaign</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 sm:p-7 shadow-sm flex flex-col gap-[18px]">
          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">Job Position Title *</label>
              <input
                name="position"
                value={form.position}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
                required
                className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">Department</label>
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="e.g. Engineering, HR, Finance"
                className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600">Job Description *</label>
            <textarea
              name="jobDescription"
              value={form.jobDescription}
              onChange={handleChange}
              placeholder="Describe the job role, responsibilities, and what the company does..."
              required
              rows={5}
              className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none resize-y font-[inherit]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600">Company Expectations *</label>
            <textarea
              name="companyExpectations"
              value={form.companyExpectations}
              onChange={handleChange}
              placeholder="What does the company expect from this candidate? Skills, attitude, experience..."
              required
              rows={4}
              className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none resize-y font-[inherit]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600">Candidate Responsibilities *</label>
            <textarea
              name="candidateResponsibilities"
              value={form.candidateResponsibilities}
              onChange={handleChange}
              placeholder="What will the candidate do day-to-day? List their key responsibilities..."
              required
              rows={4}
              className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none resize-y font-[inherit]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">Required Skills</label>
              <input
                name="requiredSkills"
                value={form.requiredSkills}
                onChange={handleChange}
                placeholder="Python, React, SQL, Communication (comma separated)"
                className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">Required Qualifications</label>
              <input
                name="requiredQualifications"
                value={form.requiredQualifications}
                onChange={handleChange}
                placeholder="e.g. BSc in Computer Science or equivalent"
                className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none"
              />
            </div>
          </div>

          {/* Application Deadline */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600">
              Application Deadline <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none w-56"
            />
            <span className="text-xs text-gray-400">
              Set a closing date — a countdown progress bar will appear on the dashboard.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg cursor-pointer text-[15px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-white border-0 rounded-lg cursor-pointer text-[15px] font-semibold"
            >
              {loading ? 'Creating...' : '🚀 Create Campaign & Generate Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
