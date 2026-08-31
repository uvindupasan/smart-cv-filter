import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCampaign, searchCVs, downloadCampaignZip } from '../utils/api';
import CVCard from '../components/CVCard';
import CVModal from '../components/CVModal';


export default function CampaignView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign]   = useState(null);
  const [cvs, setCvs]             = useState([]);
  const [loading, setLoading]     = useState(true);

  const [searchQuery, setSearchQuery]     = useState('');
  const [searching, setSearching]         = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  const [selectedCV, setSelectedCV]     = useState(null);
  const [copied, setCopied]             = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [viewMode, setViewMode]         = useState('grid');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    try {
      const res = await getCampaign(id);
      setCampaign(res.data.campaign);
      setCvs(res.data.cvs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResults(null);
    try {
      const res = await searchCVs(searchQuery.trim(), id);
      setSearchResults(res.data);
    } catch (err) {
      alert('Search failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSearching(false);
    }
  };

  const copyLink = () => {
    if (!campaign) return;
    const url = `${window.location.origin}/apply/${campaign.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const res = await downloadCampaignZip(id);
      const blob = new Blob([res.data], { type: 'application/zip' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `CVs_${campaign.position.replace(/[^a-zA-Z0-9]/g,'_')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err.response?.data?.message || 'No uploaded CV files found.';
      alert(msg);
    } finally {
      setDownloadingZip(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400 text-base">Loading campaign...</div>;
  if (!campaign) return <div className="text-center py-20 text-gray-400 text-base">Campaign not found.</div>;

  const rawCVs = searchResults ? searchResults.results : cvs;
  const displayCVs = statusFilter === 'all'
    ? rawCVs
    : statusFilter === 'applied'
    ? rawCVs.filter(c => c.status === 'applied' || c.status === 'new')
    : rawCVs.filter(c => c.status === statusFilter);

  const statusCounts = {
    all: cvs.length,
    applied: cvs.filter(c => c.status === 'applied' || c.status === 'new').length,
    shortlisted: cvs.filter(c => c.status === 'shortlisted').length,
    interview: cvs.filter(c => c.status === 'interview').length,
    selected: cvs.filter(c => c.status === 'selected').length,
    rejected: cvs.filter(c => c.status === 'rejected').length,
  };

  const applyUrl = `${window.location.origin}/apply/${campaign.slug}`;

  // Timeline calculation starting from creation date
  function getCampaignTimeline(c) {
    const created = new Date(c.createdAt);
    const now     = new Date();

    const createdStr = created.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    if (!c.deadline) {
      const daysActive = Math.max(1, Math.ceil((now - created) / (1000 * 60 * 60 * 24)));
      return {
        hasDeadline: false,
        createdStr,
        daysActive,
        label: `Active for ${daysActive} day${daysActive === 1 ? '' : 's'}`,
        percent: 100,
        color: '#1D9E75',
        urgent: false,
        expired: false,
      };
    }

    const deadline    = new Date(c.deadline);
    const deadlineStr = deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const totalMs     = deadline.getTime() - created.getTime();
    const elapsedMs   = now.getTime() - created.getTime();
    const remainingMs = deadline.getTime() - now.getTime();

    const totalDays   = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
    const daysLeft    = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

    if (remainingMs <= 0) {
      return {
        hasDeadline: true,
        createdStr,
        deadlineStr,
        daysLeft: 0,
        totalDays,
        percent: 100,
        label: 'Deadline passed',
        color: '#cc3333',
        urgent: true,
        expired: true,
      };
    }

    const percent = Math.min(100, Math.max(0, Math.round((elapsedMs / Math.max(1, totalMs)) * 100)));

    let color  = '#1D9E75';  // green
    let urgent = false;
    if (daysLeft <= 3)       { color = '#cc3333'; urgent = true; }
    else if (daysLeft <= 7)  { color = '#e07c00'; }
    else if (daysLeft <= 14) { color = '#b5940a'; }

    const label = daysLeft === 1 ? '1 day left' : `${daysLeft} days left`;

    return {
      hasDeadline: true,
      createdStr,
      deadlineStr,
      daysLeft,
      totalDays,
      percent,
      label,
      color,
      urgent,
      expired: false,
    };
  }

  const dlInfo = getCampaignTimeline(campaign);

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-3 sm:p-6 font-sans">
      <div className="max-w-7l mx-auto">
        {/* Header */}
        <div className="mb-4">
          <button onClick={() => navigate('/')} className="px-3.5 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer text-sm">
            ← Dashboard
          </button>
        </div>

        {/* Campaign Info Card */}
        <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 sm:mb-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-[22px] font-bold text-navy">{campaign.position}</h1>
              {campaign.department && <p className="text-sm text-gray-400 mt-1">{campaign.department}</p>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${campaign.isActive ? 'bg-primary-light text-primary' : 'bg-gray-100 text-gray-400'}`}>
                {campaign.isActive ? '● Active' : '● Closed'}
              </span>
              <button
                onClick={() => navigate(`/campaigns/${id}/edit`)}
                className="px-3 py-1 bg-gray-100 text-gray-600 border-0 rounded-lg cursor-pointer text-xs font-medium hover:bg-gray-200"
              >
                ✏ Edit
              </button>
              <button
                onClick={handleDownloadZip}
                disabled={downloadingZip}
                className="px-3 py-1 bg-primary text-white border-0 rounded-lg cursor-pointer text-xs font-medium disabled:opacity-60"
              >
                {downloadingZip ? 'Preparing...' : '⬇ Download All CVs (ZIP)'}
              </button>
            </div>
          </div>

          {/* Campaign Timeline Progress Box */}
          {dlInfo && (
            <div className="mb-4 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center mb-1.5 text-xs text-gray-600 font-medium">
                <span>📅 Created: <strong>{dlInfo.createdStr}</strong></span>
                {dlInfo.hasDeadline ? (
                  <span>🏁 Deadline: <strong>{dlInfo.deadlineStr}</strong></span>
                ) : (
                  <span className="text-gray-400">♾️ No deadline set</span>
                )}
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${dlInfo.percent}%`, backgroundColor: dlInfo.color }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 text-xs">
                {dlInfo.hasDeadline ? (
                  <>
                    <span className="text-gray-500 font-medium">{dlInfo.percent}% elapsed</span>
                    <span className="font-bold" style={{ color: dlInfo.color }}>{dlInfo.label}</span>
                  </>
                ) : (
                  <span className="text-primary font-medium">{dlInfo.label}</span>
                )}
              </div>
              {dlInfo.expired && <p className="text-xs text-red-500 mt-1 font-medium">✕ This campaign's application deadline has passed.</p>}
              {!dlInfo.expired && dlInfo.urgent && (
                <p className="text-xs mt-1 font-medium" style={{ color: dlInfo.color }}>⚠ Closing very soon! Consider extending the deadline if needed.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Job Description</span>
              <p className="text-sm text-gray-700 leading-relaxed m-0">{campaign.jobDescription}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Company Expectations</span>
              <p className="text-sm text-gray-700 leading-relaxed m-0">{campaign.companyExpectations}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Responsibilities</span>
              <p className="text-sm text-gray-700 leading-relaxed m-0">{campaign.candidateResponsibilities}</p>
            </div>
          </div>

          {campaign.requiredSkills?.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Required Skills: </span>
              {campaign.requiredSkills.map(skill => (
                <span key={skill} className="bg-primary-light text-primary px-2.5 py-0.5 rounded-full text-[13px] font-medium">{skill}</span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[13px] font-medium text-gray-600 whitespace-nowrap">📎 Apply Link:</span>
            <div className="flex items-center gap-2 bg-[#f0faf6] border border-[#b8e8d8] rounded-lg px-3 py-2 flex-1">
              <span className="text-[13px] text-primary font-mono flex-1 break-all">{applyUrl}</span>
              <button onClick={copyLink} className="px-2.5 py-1 bg-primary text-white border-0 rounded-md cursor-pointer text-xs whitespace-nowrap">
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* AI Search */}
        <div className="bg-white rounded-xl p-4 sm:p-5 mb-4 sm:mb-5 shadow-sm">
          <h2 className="text-sm sm:text-base font-semibold text-navy mb-3">🔍 Search CVs in This Campaign</h2>
          <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search by skill, keyword (e.g. "Python", "machine learning")'
              className="flex-1 min-w-[160px] px-3 py-2.5 rounded-lg border-2 border-primary text-sm outline-none"
            />
            <button type="submit" disabled={searching} className="px-4 py-2.5 bg-primary text-white border-0 rounded-lg cursor-pointer font-semibold text-sm whitespace-nowrap">
              {searching ? '⏳ Searching...' : '🔍 Search'}
            </button>
            {searchResults && (
              <button
                type="button"
                onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                className="px-3.5 py-2.5 bg-gray-100 text-gray-600 border-0 rounded-lg cursor-pointer"
              >
                ✕ Clear
              </button>
            )}
          </form>
          {searchResults && (
            <p className="mt-2.5 text-sm text-gray-600">
              Found <strong>{searchResults.resultCount}</strong> relevant CVs for "{searchResults.query}" (ranked by AI relevance)
            </p>
          )}
        </div>

        {/* CV List */}
        <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm">
          {/* ATS Pipeline Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 border-b border-gray-100 scrollbar-none">
            {[
              { id: 'all', label: 'All Candidates', count: statusCounts.all, color: 'text-gray-600' },
              { id: 'applied', label: 'Applied', count: statusCounts.applied, color: 'text-blue-600' },
              { id: 'shortlisted', label: 'Shortlisted', count: statusCounts.shortlisted, color: 'text-teal-600' },
              { id: 'interview', label: 'Interview', count: statusCounts.interview, color: 'text-purple-600' },
              { id: 'selected', label: 'Selected', count: statusCounts.selected, color: 'text-green-600' },
              { id: 'rejected', label: 'Rejected', count: statusCounts.rejected, color: 'text-red-500' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all border flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="mb-5 flex justify-between items-center flex-wrap gap-3 border-b border-gray-100 pb-4">
            <h2 className="text-base font-bold text-navy m-0">
              {searchResults ? '🎯 Search Results' : `👥 Candidates (${displayCVs.length})`}
            </h2>
            {/* View Mode Toggle Buttons */}
            <div className="flex bg-[#f1f3f7] p-1 rounded-xl border border-gray-200 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer border-0 transition-all flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary shadow-sm scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-700 bg-transparent'
                }`}
              >
                🎛️ Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer border-0 transition-all flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-white text-primary shadow-sm scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-700 bg-transparent'
                }`}
              >
                📝 List
              </button>
            </div>
          </div>

          {displayCVs.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>
                {searchResults
                  ? 'No relevant CVs found for this query.'
                  : 'No applications yet. Share the apply link with candidates.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
              {displayCVs.map(cv => (
                <CVCard
                  key={cv._id}
                  cv={cv}
                  viewMode="grid"
                  showScore={!!searchResults}
                  onView={() => setSelectedCV(cv)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {displayCVs.map(cv => (
                <CVCard
                  key={cv._id}
                  cv={cv}
                  viewMode="list"
                  showScore={!!searchResults}
                  onView={() => setSelectedCV(cv)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedCV && (
        <CVModal cv={selectedCV} onClose={() => { setSelectedCV(null); loadCampaign(); }} />
      )}
    </div>
  );
}
