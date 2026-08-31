import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCampaign, updateCampaign } from '../utils/api';

export default function CampaignEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const [form, setForm] = useState({
    position: '',
    department: '',
    jobDescription: '',
    companyExpectations: '',
    candidateResponsibilities: '',
    requiredSkills: '',
    requiredQualifications: '',
    deadline: '',
    isActive: true,
  });

  useEffect(() => { loadCampaign(); }, [id]);

  const loadCampaign = async () => {
    try {
      const res = await getCampaign(id);
      const c   = res.data.campaign;
      setForm({
        position:                  c.position || '',
        department:                c.department || '',
        jobDescription:            c.jobDescription || '',
        companyExpectations:       c.companyExpectations || '',
        candidateResponsibilities: c.candidateResponsibilities || '',
        requiredSkills:            (c.requiredSkills || []).join(', '),
        requiredQualifications:    c.requiredQualifications || '',
        deadline:                  c.deadline ? c.deadline.split('T')[0] : '',
        isActive:                  c.isActive,
      });
    } catch {
      setError('Failed to load campaign.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        requiredSkills: form.requiredSkills
          ? form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      };
      await updateCampaign(id, payload);
      setSuccess('Campaign updated successfully!');
      setTimeout(() => navigate(`/campaigns/${id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update campaign.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(`/campaigns/${id}`)} className="px-3.5 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer text-sm">
            ← Back
          </button>
          <h1 className="text-[22px] font-bold text-navy">Edit Campaign</h1>
        </div>

        {error   && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 mb-4 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-7 shadow-sm flex flex-col gap-[18px]">

          <div className="grid grid-cols-2 gap-[18px]">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">Job Position Title *</label>
              <input name="position" value={form.position} onChange={handleChange} required
                className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">Department</label>
              <input name="department" value={form.department} onChange={handleChange}
                className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none" />
            </div>
          </div>

          {[
            { label: 'Job Description *',          name: 'jobDescription',            rows: 5, required: true },
            { label: 'Company Expectations *',     name: 'companyExpectations',       rows: 4, required: true },
            { label: 'Candidate Responsibilities *', name: 'candidateResponsibilities', rows: 4, required: true },
          ].map(({ label, name, rows, required }) => (
            <div key={name} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">{label}</label>
              <textarea name={name} value={form[name]} onChange={handleChange}
                required={required} rows={rows}
                className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none resize-y font-[inherit]" />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-[18px]">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">Required Skills (comma separated)</label>
              <input name="requiredSkills" value={form.requiredSkills} onChange={handleChange}
                placeholder="Python, React, SQL"
                className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">Required Qualifications</label>
              <input name="requiredQualifications" value={form.requiredQualifications} onChange={handleChange}
                className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none" />
            </div>
          </div>

          {/* Active / Closed toggle */}
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
              Campaign is Active (uncheck to close / deactivate)
            </label>
          </div>

          {/* Deadline */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600">
              Application Deadline <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-[15px] outline-none w-56"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => navigate(`/campaigns/${id}`)}
              className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg cursor-pointer text-[15px]">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-primary text-white border-0 rounded-lg cursor-pointer text-[15px] font-semibold disabled:opacity-70">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
