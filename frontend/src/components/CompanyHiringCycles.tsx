import React, { useState, useMemo } from 'react';
import { COMPANY_HIRING_CYCLES, type CompanyHiringCycle } from '../data/hiringData';
import {
  Search,
  Calendar,
  ExternalLink,
  Send,
  X,
  ChevronRight,
  Clock,
  Sparkles,
  MapPin,
} from 'lucide-react';

interface CompanyHiringCyclesProps {
  onSelectCompanyForPitch: (companyName: string, role: string) => void;
}

export const CompanyHiringCycles: React.FC<CompanyHiringCyclesProps> = ({
  onSelectCompanyForPitch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<number | 'ALL'>(11); // Default to current month: November (11)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeModalCompany, setActiveModalCompany] = useState<CompanyHiringCycle | null>(null);

  const months = [
    { num: 1, name: 'Jan' },
    { num: 2, name: 'Feb' },
    { num: 3, name: 'Mar' },
    { num: 4, name: 'Apr' },
    { num: 5, name: 'May' },
    { num: 6, name: 'Jun' },
    { num: 7, name: 'Jul' },
    { num: 8, name: 'Aug' },
    { num: 9, name: 'Sep' },
    { num: 10, name: 'Oct' },
    { num: 11, name: 'Nov (Now)' },
    { num: 12, name: 'Dec' },
  ];

  const filteredCompanies = useMemo(() => {
    return COMPANY_HIRING_CYCLES.filter((company) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        company.name.toLowerCase().includes(q) ||
        company.category.toLowerCase().includes(q) ||
        company.locations.some((l) => l.toLowerCase().includes(q)) ||
        company.quickSummary.toLowerCase().includes(q);

      // Category
      const matchesCategory =
        selectedCategory === 'ALL' || company.category === selectedCategory;

      // Status
      const matchesStatus =
        selectedStatus === 'ALL' || company.currentStatus === selectedStatus;

      // Month
      const matchesMonth =
        selectedMonth === 'ALL' ||
        company.activeMonths.includes(selectedMonth) ||
        company.upcomingMonths.includes(selectedMonth);

      return matchesSearch && matchesCategory && matchesStatus && matchesMonth;
    }).sort((a, b) => {
      // Sort open now first
      if (a.currentStatus === 'OPEN_NOW' && b.currentStatus !== 'OPEN_NOW') return -1;
      if (a.currentStatus !== 'OPEN_NOW' && b.currentStatus === 'OPEN_NOW') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, selectedCategory, selectedMonth, selectedStatus]);

  return (
    <div className="space-y-6 pb-20">
      {/* Playful & Clean Editorial Header with Hand-drawn Aesthetic */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Pastel Yellow Accent Ribbon */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-amber-200/40 via-yellow-100/30 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-semibold border border-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Company Hiring Calendar & Drive Cycles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Which company hires when, and when does it reopen?
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Never miss a hiring window. Understand exact recruitment schedules: which companies are actively hiring right now, when past drives closed, and when the next off-campus drive returns.
            </p>
          </div>

          {/* Quick Stats Pill Block */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="p-3.5 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[100px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Active In Nov</span>
              <span className="text-xl font-bold text-emerald-700">5 Companies</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[100px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Next in Jan–Feb</span>
              <span className="text-xl font-bold text-amber-600">8 Companies</span>
            </div>
          </div>
        </div>

        {/* Interactive Month-by-Month Timeline Bar */}
        <div className="mt-6 pt-5 border-t border-stone-100">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-stone-500" />
              Filter by Hiring Month:
            </span>
            <button
              onClick={() => setSelectedMonth('ALL')}
              className={`text-xs font-semibold cursor-pointer px-2 py-0.5 rounded transition ${
                selectedMonth === 'ALL'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Show Full Year (12 Months)
            </button>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {months.map((m) => {
              const isSelected = selectedMonth === m.num;
              const isCurrent = m.num === 11;
              return (
                <button
                  key={m.num}
                  onClick={() => setSelectedMonth(m.num)}
                  className={`py-2 px-1.5 rounded-lg text-xs font-semibold transition flex flex-col items-center justify-center cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-300 text-stone-950 border-amber-400 shadow-2xs font-bold'
                      : isCurrent
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-[#faf9f8] text-stone-600 border-stone-200/80 hover:bg-stone-100'
                  }`}
                >
                  <span>{m.name}</span>
                  {isCurrent && (
                    <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-tight">Active</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company (Google, Amazon, Juspay), city, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f9fafb] border border-stone-200 rounded-lg pl-9 pr-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 font-sans"
          />
        </div>

        {/* Status & Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'OPEN_NOW' ? 'ALL' : 'OPEN_NOW')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer border ${
              selectedStatus === 'OPEN_NOW'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            🟢 Open Now
          </button>
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'UPCOMING_SOON' ? 'ALL' : 'UPCOMING_SOON')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer border ${
              selectedStatus === 'UPCOMING_SOON'
                ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            🟡 Upcoming
          </button>
          {['ALL', 'Big Tech', 'Finance & Banking', 'Indian Unicorns'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-stone-50 border-stone-900'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between px-1 text-xs text-stone-500">
        <span>
          Showing <strong>{filteredCompanies.length}</strong> top employers matching your schedule
        </span>
        <span className="text-stone-400">
          💡 Click any card to open the complete round-by-round interview guide
        </span>
      </div>

      {/* Cards Grid: Clean, Visual, Not Clumsy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCompanies.map((c) => {
          const isOpenNow = c.currentStatus === 'OPEN_NOW';
          const isUpcoming = c.currentStatus === 'UPCOMING_SOON';

          return (
            <div
              key={c.id}
              onClick={() => setActiveModalCompany(c)}
              className="group bg-white border border-stone-200/90 hover:border-amber-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-150 flex flex-col justify-between space-y-4 cursor-pointer relative"
            >
              {/* Card Top: Header & Live Pill */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl font-bold text-sm flex items-center justify-center shadow-2xs shrink-0"
                      style={{ backgroundColor: c.logoBg, color: c.logoColor }}
                    >
                      {c.initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-base leading-tight group-hover:text-amber-800 transition">
                        {c.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{c.locations.join(' · ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {isOpenNow ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active Now</span>
                      </span>
                    ) : isUpcoming ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-600" />
                        <span>Coming in Jan–Feb</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
                        Closed (Next Summer)
                      </span>
                    )}
                  </div>
                </div>

                {/* Plain English Timeline Strip */}
                <div className="bg-[#f9fafb] p-3 rounded-xl border border-stone-200/80 space-y-1.5 text-xs">
                  <div className="flex items-start gap-1.5">
                    <span className="text-stone-400 font-semibold shrink-0">Recent Drive:</span>
                    <span className="text-stone-700">{c.lastCycleDone}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-700 font-bold shrink-0">Next Intake:</span>
                    <span className="text-stone-900 font-semibold">{c.nextCycleReopens}</span>
                  </div>
                </div>

                {/* Quick Summary */}
                <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                  {c.quickSummary}
                </p>

                {/* Key Tags */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
                  <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                    💰 {c.stipend.split('(')[0]}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                    🎓 {c.targetBatches.join(', ')}
                  </span>
                </div>
              </div>

              {/* Card Footer: Box Opening Prompt */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium group-hover:text-stone-900 transition flex items-center gap-1">
                  <span>Open rounds & prep guide</span>
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
                </span>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  {c.rounds.length} Interview Rounds
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* "BOX OPENING" INTERACTIVE DETAIL MODAL */}
      {/* ========================================================================= */}
      {activeModalCompany && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full p-6 sm:p-7 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="h-12 w-12 rounded-xl font-bold text-base flex items-center justify-center shadow-xs shrink-0"
                  style={{ backgroundColor: activeModalCompany.logoBg, color: activeModalCompany.logoColor }}
                >
                  {activeModalCompany.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-900 text-xl leading-tight">
                      {activeModalCompany.name}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-stone-100 text-stone-700 border border-stone-200">
                      {activeModalCompany.category}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 mt-0.5 block">
                    Locations: {activeModalCompany.locations.join(' · ')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveModalCompany(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Plain English Summary Banner */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs sm:text-sm space-y-1">
              <strong className="block text-amber-900 font-semibold">How Hiring Works at {activeModalCompany.name}:</strong>
              <p className="leading-relaxed text-stone-700">{activeModalCompany.quickSummary}</p>
            </div>

            {/* Detailed Timeline Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#f9fafb] border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">When It Last Closed</span>
                <span className="text-stone-800 font-semibold">{activeModalCompany.lastCycleDone}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">When It Reopens Next</span>
                <span className="text-emerald-950 font-bold">{activeModalCompany.nextCycleReopens}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#f9fafb] border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Target Batches</span>
                <span className="text-stone-800 font-semibold">{activeModalCompany.targetBatches.join(', ')}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#f9fafb] border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Expected Compensation</span>
                <span className="text-stone-800 font-semibold">{activeModalCompany.stipend}</span>
              </div>
            </div>

            {/* Round by Round Interview Flow */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <span>Complete Round-by-Round Interview Process ({activeModalCompany.rounds.length} Stages)</span>
              </h4>

              <div className="space-y-2.5">
                {activeModalCompany.rounds.map((round, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-900">{round.title}</span>
                      <span className="text-stone-400 font-medium text-[11px] px-2 py-0.5 rounded bg-stone-100">
                        {round.durationOrFormat}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {round.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Insider Tip Box */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900 block mb-0.5">Senior Recruiter Insider Tip:</strong>
                <span>{activeModalCompany.insiderTip}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
              <a
                href={activeModalCompany.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <span>Official Careers Portal</span>
                <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
              </a>

              <button
                onClick={() => {
                  onSelectCompanyForPitch(activeModalCompany.name, 'Software Engineering Intern');
                  setActiveModalCompany(null);
                }}
                className="py-2.5 px-5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Pitch Recruiter for {activeModalCompany.name}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
