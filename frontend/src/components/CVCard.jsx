import React from 'react';

const STATUS_CLASSES = {
  applied:     'bg-[#e8f4ff] text-[#1a6bb5]',
  new:         'bg-[#e8f4ff] text-[#1a6bb5]',
  reviewed:    'bg-[#fff8e6] text-[#b57c00]',
  shortlisted: 'bg-primary-light text-primary',
  interview:   'bg-[#f3e8ff] text-[#7e22ce]',
  selected:    'bg-[#dcfce7] text-[#15803d]',
  rejected:    'bg-[#fff0f0] text-[#cc3333]',
};

export default function CVCard({ cv, showScore, onView, viewMode = 'grid' }) {
  const statusClass = STATUS_CLASSES[cv.status] || STATUS_CLASSES.new;
  const initials = cv.fullName
    ? cv.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const scoreClass = cv.matchScore >= 70
    ? 'bg-primary-light text-primary'
    : cv.matchScore >= 40
    ? 'bg-[#fff8e6] text-[#b57c00]'
    : 'bg-gray-100 text-gray-400';

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-0 transition-all hover:shadow-md font-sans overflow-hidden">

        {/* Candidate Name & Initials — fixed 220px */}
        <div className="flex items-center gap-3 w-[220px] shrink-0 min-w-0 pr-3">
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-navy m-0 truncate">{cv.fullName}</h3>
            <p className="text-xs text-gray-400 m-0 truncate mt-0.5">{cv.email}</p>
          </div>
        </div>

        {/* Education — fixed 170px */}
        <div className="hidden md:flex flex-col gap-0.5 w-[170px] shrink-0 min-w-0 pr-3">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Education</span>
          <span className="text-xs text-gray-700 font-semibold truncate">{cv.educationalInstitute || '—'}</span>
          {cv.degree && <span className="text-[10px] text-gray-400 truncate">{cv.degree}</span>}
        </div>

        {/* Skills — fixed 160px */}
        <div className="hidden lg:flex flex-wrap gap-1 w-[160px] shrink-0 pr-3">
          {cv.skills?.slice(0, 2).map(skill => (
            <span key={skill} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[11px] font-medium truncate max-w-full">{skill}</span>
          ))}
          {cv.skills?.length > 2 && (
            <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full text-[10px] font-medium">+{cv.skills.length - 2}</span>
          )}
        </div>

        {/* CRM: Stars + Notes — fixed 120px */}
        <div className="hidden md:flex items-center gap-2 w-[120px] shrink-0 pr-3">
          {cv.rating && cv.rating > 0 ? (
            <span className="text-xs text-[#ffb100] font-bold flex items-center gap-0.5 select-none" title={`${cv.rating} Star rating`}>
              {'★'.repeat(cv.rating)}
              <span className="text-gray-300 font-normal">{'★'.repeat(5 - cv.rating)}</span>
            </span>
          ) : (
            <span className="text-xs text-gray-200 select-none">★ ★ ★ ★ ★</span>
          )}
          {cv.notes && cv.notes.length > 0 && (
            <span className="text-[11px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-lg border border-gray-100 font-semibold flex items-center gap-0.5 select-none">
              📝 {cv.notes.length}
            </span>
          )}
        </div>

        {/* Status & PDF — fixed 110px */}
        <div className="flex items-center gap-1.5 w-[110px] shrink-0 pr-3">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${statusClass}`}>
            {cv.status === 'new' ? 'New' : cv.status}
          </span>
          {cv.cvFile?.filename && (
            <span className="text-[10px] text-blue-600 font-black bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100" title="PDF resume uploaded">
              PDF
            </span>
          )}
        </div>

        {/* AI Match Score — fixed 90px, only in search mode */}
        {showScore && cv.matchScore !== undefined ? (
          <div className={`px-2.5 py-1 rounded-full text-xs font-black text-center shrink-0 w-[90px] mr-3 ${scoreClass}`}>
            {cv.matchScore}% match
          </div>
        ) : (
          <div className="hidden lg:block w-[90px] shrink-0" />
        )}

        {/* Detail Button — always pinned at right edge, fixed 90px */}
        <div className="ml-auto shrink-0 w-[90px] flex justify-end">
          <button
            onClick={onView}
            className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-white border-0 rounded-lg cursor-pointer text-xs font-bold transition-all shadow-sm flex items-center gap-1 hover:scale-[1.03] active:scale-95 whitespace-nowrap"
          >
            👁️ Detail
          </button>
        </div>

      </div>
    );
  }


  // Grid view (default)
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2.5 transition-shadow font-sans animate-fade-in">

      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-navy m-0 truncate">{cv.fullName}</h3>
          <p className="text-xs text-gray-400 mt-0.5 m-0 truncate">{cv.email}</p>
        </div>
        {showScore && cv.matchScore !== undefined && (
          <div className={`px-2.5 py-1 rounded-full text-sm font-bold shrink-0 ${scoreClass}`}>
            {cv.matchScore}%
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-1.5 items-center">
          <span className="text-[13px]">🎓</span>
          <span className="text-[13px] text-gray-600 truncate">{cv.educationalInstitute}</span>
        </div>
        {cv.campaign?.position && (
          <div className="flex gap-1.5 items-center">
            <span className="text-[13px]">💼</span>
            <span className="text-[13px] text-gray-600 truncate">{cv.campaign.position}</span>
          </div>
        )}
      </div>

      {/* Skills */}
      {cv.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {cv.skills.slice(0, 4).map(skill => (
            <span key={skill} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">{skill}</span>
          ))}
          {cv.skills.length > 4 && (
            <span className="bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full text-xs">+{cv.skills.length - 4} more</span>
          )}
        </div>
      )}

      {/* CRM Badges */}
      {((cv.rating && cv.rating > 0) || (cv.notes && cv.notes.length > 0)) && (
        <div className="flex justify-between items-center bg-gray-50/50 rounded-lg px-2.5 py-1.5 border border-gray-100/50">
          {/* Notes Count */}
          {cv.notes && cv.notes.length > 0 ? (
            <span className="text-[11px] text-gray-500 flex items-center gap-1 font-medium select-none">
              📝 {cv.notes.length} note{cv.notes.length > 1 ? 's' : ''}
            </span>
          ) : (
            <span />
          )}

          {/* Rating Display */}
          {cv.rating && cv.rating > 0 && (
            <span className="text-[11px] text-[#ffb100] font-bold flex items-center gap-0.5 select-none">
              {'★'.repeat(cv.rating)}
              <span className="text-gray-300 font-normal">{'★'.repeat(5 - cv.rating)}</span>
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-1 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusClass}`}>
            {cv.status}
          </span>
          {/* PDF badge — shown when candidate uploaded a file */}
          {cv.cvFile?.filename && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
              📄 PDF
            </span>
          )}
        </div>
        <button
          onClick={onView}
          className="px-3 py-1.5 bg-primary text-white border-0 rounded-md cursor-pointer text-xs font-medium"
        >
          👁 View / Download
        </button>
      </div>
    </div>
  );
}
