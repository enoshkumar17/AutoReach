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
import { DoodleShelves, DoodleWavyUnderline } from './DoodleIcons';

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
      {/* Hand-crafted Sketchbook Header */}
      <div className="bg-[#fffefc] border-2 border-stone-800 rounded-[255px_18px_225px_18px/18px_225px_18px_255px] p-6 sm:p-8 shadow-[3.5px_4px_0px_#1c1917] relative overflow-hidden">
        {/* Soft Watercolor Blotches */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-200/50 rounded-[45%_55%_65%_35%/40%_60%_40%_60%] blur-[3px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-40 h-28 bg-orange-200/40 rounded-[60%_40%_30%_70%/50%_60%_40%_50%] blur-[3px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] bg-amber-200 text-amber-950 text-xs font-bold border-2 border-stone-800 shadow-[1.5px_2px_0px_#1c1917] -rotate-1">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <span>Company Hiring Calendar & Drive Cycles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Which company hires when, and when does it reopen?
            </h2>
            <DoodleWavyUnderline className="w-40 h-2 text-amber-500 mb-2" />
            <p className="text-sm text-stone-600 leading-relaxed">
              Never miss a hiring window. Understand exact recruitment schedules: which companies are actively hiring right now, when past drives closed, and when the next off-campus drive returns.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <DoodleShelves className="hidden sm:inline-block w-28 h-20 shrink-0" />
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="p-3 bg-white border-2 border-stone-800 rounded-[255px_12px_225px_12px/12px_225px_12px_255px] shadow-[2.5px_2.5px_0px_#1c1917] text-center min-w-[90px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Active In Nov</span>
                <span className="text-lg font-extrabold text-emerald-800">5 Drives</span>
              </div>
              <div className="p-3 bg-amber-100 border-2 border-stone-800 rounded-[12px_255px_12px_225px/225px_12px_255px_12px] shadow-[2.5px_2.5px_0px_#1c1917] text-center min-w-[90px] rotate-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-0.5">Next Jan–Feb</span>
                <span className="text-lg font-extrabold text-amber-950">8 Drives</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Month-by-Month Timeline Bar */}
        <div className="mt-6 pt-5 border-t-2 border-dashed border-stone-300">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5 font-hand text-sm">
              <Calendar className="h-4 w-4 text-amber-700" />
              Filter by Hiring Month (12-Month Calendar):
            </span>
            <button
              onClick={() => setSelectedMonth('ALL')}
              className={`text-xs font-bold cursor-pointer px-2.5 py-1 rounded-[255px_12px_225px_12px/12px_225px_12px_255px] border-2 transition ${
                selectedMonth === 'ALL'
                  ? 'bg-stone-900 text-amber-100 border-stone-900 shadow-[1.5px_2px_0px_#1c1917]'
                  : 'bg-white text-stone-600 border-stone-300 hover:border-stone-800'
              }`}
            >
              Show Full Year
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
                  className={`py-2 px-1 rounded-[255px_10px_225px_10px/10px_225px_10px_255px] text-xs transition flex flex-col items-center justify-center cursor-pointer border-2 ${
                    isSelected
                      ? 'bg-amber-300 text-stone-950 border-stone-900 shadow-[2px_2.5px_0px_#1c1917] font-extrabold -rotate-1'
                      : isCurrent
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-600 font-bold hover:bg-emerald-200'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-800'
                  }`}
                >
                  <span className="font-semibold">{m.name}</span>
                  {isCurrent && (
                    <span className="text-[8px] font-extrabold text-emerald-800 uppercase tracking-tight">Active</span>
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

      {/* Cards Grid: Hand-drawn Irregular Wabi-Sabi Aesthetics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCompanies.map((c, idx) => {
          const isOpenNow = c.currentStatus === 'OPEN_NOW';
          const isUpcoming = c.currentStatus === 'UPCOMING_SOON';
          const cardClass = idx % 2 === 0 ? 'sketch-card' : 'sketch-card-alt';

          return (
            <div
              key={c.id}
              onClick={() => setActiveModalCompany(c)}
              className={`group p-5 flex flex-col justify-between space-y-4 cursor-pointer relative ${cardClass}`}
            >
              {/* Washi Tape Accent on Open Cycles */}
              {isOpenNow && <div className="washi-tape" />}

              {/* Card Top: Header & Live Pill */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 border-2 border-stone-800 rounded-[255px_8px_225px_8px/8px_225px_8px_255px] font-extrabold text-sm flex items-center justify-center shadow-[1.5px_1.5px_0px_#1c1917] shrink-0"
                      style={{ backgroundColor: c.logoBg, color: c.logoColor }}
                    >
                      {c.initials}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-stone-900 text-base leading-tight group-hover:text-amber-900 transition">
                        {c.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{c.locations.join(' · ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {isOpenNow ? (
                      <span className="px-2.5 py-1 rounded-[255px_12px_225px_12px/12px_225px_12px_255px] text-xs font-bold bg-emerald-100 text-emerald-950 border-2 border-stone-800 flex items-center gap-1.5 shadow-[1.5px_2px_0px_#1c1917] rotate-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active Now</span>
                      </span>
                    ) : isUpcoming ? (
                      <span className="px-2.5 py-1 rounded-[255px_12px_225px_12px/12px_225px_12px_255px] text-xs font-bold bg-amber-100 text-amber-950 border border-stone-800 flex items-center gap-1 shadow-2xs">
                        <Clock className="h-3 w-3 text-amber-700" />
                        <span>Coming Soon</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-[255px_12px_225px_12px/12px_225px_12px_255px] text-xs font-medium bg-stone-100 text-stone-600 border border-stone-300">
                        Closed Cycle
                      </span>
                    )}
                  </div>
                </div>

                {/* Plain English Timeline Strip */}
                <div className="bg-[#fefce8] p-3 rounded-[255px_10px_225px_10px/10px_225px_10px_255px] border border-amber-300/90 space-y-1.5 text-xs">
                  <div className="flex items-start gap-1.5">
                    <span className="text-stone-500 font-semibold shrink-0">Recent Drive:</span>
                    <span className="text-stone-800 font-medium">{c.lastCycleDone}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-800 font-bold shrink-0">Next Intake:</span>
                    <span className="text-stone-900 font-bold">{c.nextCycleReopens}</span>
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
