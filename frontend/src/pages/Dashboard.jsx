import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCampaigns, searchCVs, reindexPDFs } from '../utils/api';
import CVCard from '../components/CVCard';
import CVModal from '../components/CVModal';

// ── Deadline helper functions ────────────────────────────────

/** Returns { daysLeft, totalDays, percent, label, color, urgent } */
// ── Deadline & Timeline helper functions ───────────────────────

/** Returns timeline calculation starting from creation date (createdAt) */
function getCampaignTimeline(campaign) {
  const created = new Date(campaign.createdAt);
  const now     = new Date();

  const createdStr = created.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  if (!campaign.deadline) {
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

  const deadline    = new Date(campaign.deadline);
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

  let color  = '#1D9E75';  // green — plenty of time
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

/** Campaign Timeline Progress Bar component */
function DeadlineBar({ campaign }) {
  const info = getCampaignTimeline(campaign);

  return (
    <div className="mt-3 pt-2.5 border-t border-gray-100">
      {/* Creation Date -> Deadline Date Header */}
      <div className="flex justify-between items-center text-[11px] text-gray-500 font-medium mb-1">
        <span>📅 Created: {info.createdStr}</span>
        {info.hasDeadline ? (
          <span>🏁 Deadline: {info.deadlineStr}</span>
        ) : (
          <span className="text-gray-400">♾️ No deadline</span>
        )}
      </div>

      {/* Progress Track starting from creation date */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${info.percent}%`, backgroundColor: info.color }}
        />
      </div>

      {/* Progress Stats */}
      <div className="flex justify-between items-center mt-1 text-[11px]">
        {info.hasDeadline ? (
          <>
            <span className="text-gray-400 font-medium">{info.percent}% elapsed</span>
            <span className="font-bold" style={{ color: info.color }}>{info.label}</span>
          </>
        ) : (
          <span className="text-primary font-medium">{info.label}</span>
        )}
      </div>

      {info.urgent && !info.expired && (
        <p className="text-[11px] mt-0.5 font-medium" style={{ color: info.color }}>⚠ Closing soon!</p>
      )}
      {info.expired && (
        <p className="text-[11px] mt-0.5 text-red-500 font-medium">✕ Deadline has passed</p>
      )}
    </div>
  );
}


// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [campaigns, setCampaigns]       = useState([]);
  const [loading, setLoading]           = useState(true);

  const [searchQuery, setSearchQuery]   = useState('');
  const [searching, setSearching]       = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  const [selectedCV, setSelectedCV]     = useState(null);

  // Sort + Filter state
  const [sortBy, setSortBy]             = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');

  // Re-index PDF state
  const [reindexing, setReindexing]     = useState(false);
  const [reindexResult, setReindexResult] = useState(null);

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    try {
      const res = await getCampaigns();
      setCampaigns(res.data.campaigns);
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
      const res = await searchCVs(searchQuery.trim());
      setSearchResults(res.data);
    } catch (err) {
      alert('Search failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleReindex = async () => {
    if (!window.confirm('Re-extract PDF text and regenerate AI embeddings for all existing CVs?\nThis may take a few minutes depending on the number of uploaded PDFs.')) return;
    setReindexing(true);
    setReindexResult(null);
    try {
      const res = await reindexPDFs();
      setReindexResult({ success: true, message: res.data.message, stats: res.data.stats });
    } catch (err) {
      setReindexResult({ success: false, message: err.response?.data?.message || 'Re-indexing failed.' });
    } finally {
      setReindexing(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };


  // ── Sort + Filter logic ──────────────────────────────────────
  const processedCampaigns = [...campaigns]
    .filter(c => {
      if (filterStatus === 'active') return c.isActive;
      if (filterStatus === 'closed') return !c.isActive;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest')       return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest')       return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'applications') return (b.applicationCount || 0) - (a.applicationCount || 0);
      if (sortBy === 'deadline') {
        // Campaigns with no deadline go to bottom
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      }
      return 0;
    });

  const totalApplications = campaigns.reduce((sum, c) => sum + (c.applicationCount || 0), 0);
  const activeCampaigns   = campaigns.filter(c => c.isActive).length;
  const urgentCampaigns   = campaigns.filter(c => {
    const info = getCampaignTimeline(c);
    return info && info.urgent && !info.expired;
  }).length;

  return (
    <div className="min-h-screen bg-[#f5f7fa] font-sans">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 sm:py-7">

        {/* ── Stats Row ────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-7">
          {[
            { label: 'Total Campaigns',    value: campaigns.length,   icon: '📋' },
            { label: 'Active Campaigns',   value: activeCampaigns,    icon: '✅' },
            { label: 'Total Applications', value: totalApplications,  icon: '👥' },
            { label: 'Closing Soon',       value: urgentCampaigns,    icon: '⏰', warn: urgentCampaigns > 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-white rounded-xl p-5 flex items-center gap-3.5 shadow-sm ${stat.warn ? 'border border-red-200' : ''}`}
            >
              <span className="text-[28px]">{stat.icon}</span>
              <div>
                <div className={`text-2xl font-bold ${stat.warn ? 'text-red-600' : 'text-navy'}`}>{stat.value}</div>
                <div className="text-[13px] text-gray-400 mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── AI Search ────────────────────────── */}
        <div className="bg-white rounded-xl p-4 sm:p-6 mb-6 sm:mb-7 shadow-sm">
          <div className="flex justify-between items-start mb-1.5 flex-wrap gap-2">
            <h2 className="text-base sm:text-[17px] font-semibold text-navy">🔍 AI-Powered CV Search</h2>
            <button
              onClick={handleReindex}
              disabled={reindexing}
              title="Re-extract PDF text and regenerate embeddings for existing CVs to enable PDF content search"
              className="px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg cursor-pointer text-xs font-medium hover:bg-gray-200 disabled:opacity-60"
            >
              {reindexing ? '⏳ Re-indexing...' : '📄 Re-index PDF'}
            </button>
          </div>
          <p className="text-xs sm:text-[13px] text-gray-400 mb-2 leading-relaxed">
            Searches through <strong>form fields + uploaded PDF content</strong> using Sentence-BERT semantic matching.
            Try: "Python developer", "English fluent", "machine learning"
          </p>
          {reindexResult && (
            <div className={`text-xs px-3 py-2 rounded-lg mb-3 ${reindexResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {reindexResult.message}
              {reindexResult.stats && (
                <span className="ml-2 text-gray-500">
                  (✅ {reindexResult.stats.processed} updated, ⚠️ {reindexResult.stats.failed} failed)
                </span>
              )}
            </div>
          )}
          <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type a skill, language, or keyword..."
              className="flex-1 min-w-[180px] px-3 sm:px-4 py-2.5 rounded-lg border-2 border-primary text-sm outline-none"
            />
            <button type="submit" disabled={searching} className="px-4 sm:px-5 py-2.5 bg-primary text-white border-0 rounded-lg cursor-pointer font-semibold text-sm whitespace-nowrap">
              {searching ? '⏳ Searching...' : '🔍 Search'}
            </button>
            {searchResults && (
              <button type="button" onClick={clearSearch} className="px-3 sm:px-4 py-2.5 bg-gray-100 text-gray-600 border-0 rounded-lg cursor-pointer text-sm">
                ✕ Clear
              </button>
            )}
          </form>


          {searchResults && (
            <div className="mt-5">
              <h3 className="text-[15px] font-semibold text-gray-700 mb-3.5">
                Results for "{searchResults.query}" — {searchResults.resultCount} found
              </h3>
              {searchResults.results.length === 0 ? (
                <p className="text-gray-400 italic">No relevant CVs found for this search query.</p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
                  {searchResults.results.map(cv => (
                    <CVCard key={cv._id} cv={cv} showScore={true} onView={() => setSelectedCV(cv)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Campaigns ────────────────────────── */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">

          {/* Header row */}
          <div className="flex justify-between items-center mb-4 sm:mb-5 flex-wrap gap-3">
            <h2 className="text-base sm:text-[17px] font-semibold text-navy">📋 Job Campaigns</h2>

            <div className="flex items-center gap-2 flex-wrap">

              {/* Filter */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 outline-none cursor-pointer bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 outline-none cursor-pointer bg-white"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="deadline">Sort: Deadline (Soonest)</option>
                <option value="applications">Sort: Applications (Most)</option>
              </select>

              <button
                onClick={() => navigate('/campaigns/new')}
                className="px-[18px] py-2 bg-primary text-white border-0 rounded-lg cursor-pointer font-semibold text-sm"
              >
                + New Campaign
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-400 py-5">Loading campaigns...</p>
          ) : processedCampaigns.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>No campaigns found.</p>
              <button
                onClick={() => navigate('/campaigns/new')}
                className="mt-3 px-[18px] py-2 bg-primary text-white border-0 rounded-lg cursor-pointer font-semibold text-sm"
              >
                Create Your First Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {processedCampaigns.map(campaign => {
                const deadlineInfo = getCampaignTimeline(campaign);
                return (
                  <div
                    key={campaign._id}
                    className={`border rounded-xl p-[18px] cursor-pointer transition-shadow hover:shadow-md ${
                      deadlineInfo?.urgent ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
                    }`}
                    onClick={() => navigate(`/campaigns/${campaign._id}`)}
                  >
                    {/* Card header */}
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className="text-base font-semibold text-navy flex-1 mr-2">{campaign.position}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                        campaign.isActive ? 'bg-primary-light text-primary' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {campaign.isActive ? 'Active' : 'Closed'}
                      </span>
                    </div>

                    {campaign.department && (
                      <p className="text-[13px] text-gray-400 mb-2">{campaign.department}</p>
                    )}

                    <div className="flex gap-4 text-[13px] text-gray-400 mb-2">
                      <span>👥 {campaign.applicationCount || 0} applications</span>
                      <span>📅 {new Date(campaign.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Apply link */}
                    <div className="bg-[#f0faf6] rounded-md px-2.5 py-1.5 mb-1">
                      <span className="text-xs text-primary font-mono">🔗 apply/{campaign.slug}</span>
                    </div>

                    {/* ── Deadline Progress Bar ── */}
                    <DeadlineBar campaign={campaign} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedCV && (
        <CVModal cv={selectedCV} onClose={() => setSelectedCV(null)} />
      )}
    </div>
  );
}
