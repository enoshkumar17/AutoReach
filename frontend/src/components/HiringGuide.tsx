import React, { useState, useMemo } from 'react';
import {
  HIRING_COMPANIES,
  FLAGSHIP_HACKATHONS,
} from '../data/hiringData';
import {
  Search,
  Building2,
  Calendar,
  Trophy,
  ExternalLink,
  Send,
  GraduationCap,
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
  Info,
} from 'lucide-react';

interface HiringGuideProps {
  onSelectCompanyForPitch: (companyName: string, role: string) => void;
}

export const HiringGuide: React.FC<HiringGuideProps> = ({
  onSelectCompanyForPitch,
}) => {
  // Navigation sub-tab: 'companies' | 'hackathons' | 'roadmap'
  const [subTab, setSubTab] = useState<'companies' | 'hackathons' | 'roadmap'>('companies');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [selectedAccess, setSelectedAccess] = useState<string>('ALL');
  const [selectedTiming, setSelectedTiming] = useState<'ALL' | 'ACTIVE_NOW' | 'UPCOMING_SOON' | 'ANNUAL_CYCLE'>('ALL');

  // Current month (November = 11)
  const currentMonth = 11; // November

  // Categorize and sort companies dynamically by current time (November first!)
  const sortedAndFilteredCompanies = useMemo(() => {
    return HIRING_COMPANIES.filter((company) => {
      // Search
      const matchesSearch =
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.locations.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase())) ||
        company.process.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.insiderTip && company.insiderTip.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory =
        selectedCategory === 'ALL' || company.category === selectedCategory;

      // Batch filter
      const matchesBatch =
        selectedBatch === 'ALL' ||
        company.targetBatches.some((b) => b.includes(selectedBatch));

      // Access filter
      const matchesAccess =
        selectedAccess === 'ALL' || company.accessType === selectedAccess;

      // Timing filter
      const matchesTiming =
        selectedTiming === 'ALL' || company.currentStatus === selectedTiming;

      return matchesSearch && matchesCategory && matchesBatch && matchesAccess && matchesTiming;
    }).sort((a, b) => {
      // Priority 1: ACTIVE_NOW (Open in current month Nov)
      const aIsActive = a.activeMonths.includes(currentMonth);
      const bIsActive = b.activeMonths.includes(currentMonth);
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;

      // Priority 2: UPCOMING_SOON (Dec, Jan, Feb)
      const aIsUpcoming = a.upcomingMonths.some((m) => [12, 1, 2].includes(m));
      const bIsUpcoming = b.upcomingMonths.some((m) => [12, 1, 2].includes(m));
      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, selectedCategory, selectedBatch, selectedAccess, selectedTiming, currentMonth]);

  // Metric counts
  const activeNowCount = HIRING_COMPANIES.filter((c) => c.activeMonths.includes(currentMonth)).length;
  const upcomingSoonCount = HIRING_COMPANIES.filter(
    (c) => !c.activeMonths.includes(currentMonth) && c.upcomingMonths.some((m) => [12, 1, 2].includes(m))
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-24">
      {/* Top Hero Banner */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-7 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🇮🇳</span>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                India Tech Hiring Radar & Guide
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200">
                34 Major Firms
              </span>
            </div>
            <p className="text-sm text-stone-500">
              Live recruitment cycles, off-campus timelines, early-year diversity programs, and hiring hackathons.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex rounded-xl bg-stone-100 p-1 border border-stone-200/60 self-start sm:self-auto">
            <button
              onClick={() => setSubTab('companies')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                subTab === 'companies'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Companies Radar</span>
            </button>
            <button
              onClick={() => setSubTab('hackathons')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                subTab === 'hackathons'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Hiring Hackathons</span>
            </button>
            <button
              onClick={() => setSubTab('roadmap')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                subTab === 'roadmap'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Batch Roadmap</span>
            </button>
          </div>
        </div>

        {/* Live Month & Urgency Alert Bar */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-stone-700 shrink-0" />
            <span className="text-stone-800">
              Current Time: <strong className="font-semibold text-stone-900">November 2026</strong> — Companies sorted by live activity!
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedTiming(selectedTiming === 'ACTIVE_NOW' ? 'ALL' : 'ACTIVE_NOW')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                selectedTiming === 'ACTIVE_NOW'
                  ? 'bg-emerald-700 text-stone-50 border-emerald-700'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{activeNowCount} Open in Nov</span>
            </button>

            <button
              onClick={() => setSelectedTiming(selectedTiming === 'UPCOMING_SOON' ? 'ALL' : 'UPCOMING_SOON')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                selectedTiming === 'UPCOMING_SOON'
                  ? 'bg-amber-700 text-stone-50 border-amber-700'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>{upcomingSoonCount} Next in Jan–Feb</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: COMPANIES RADAR */}
      {subTab === 'companies' && (
        <div className="space-y-5">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by company name, location, role, tech stack (e.g. Google, C++, Bangalore)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#faf9f6]/70 border border-stone-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 font-sans"
                />
              </div>

              {/* Timing Quick Toggle */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['ALL', 'ACTIVE_NOW', 'UPCOMING_SOON', 'ANNUAL_CYCLE'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTiming(t)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                      selectedTiming === t
                        ? 'bg-stone-900 text-stone-50 border-stone-900'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {t === 'ALL'
                      ? 'All Seasons'
                      : t === 'ACTIVE_NOW'
                      ? '🔴 Open in Nov'
                      : t === 'UPCOMING_SOON'
                      ? '⏰ Jan–Feb Waves'
                      : '📅 July 1 Cycle'}
                  </button>
                ))}
              </div>
            </div>

            {/* Pill Filters: Category & Batch */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-stone-400 font-medium mr-1">Sector:</span>
                {[
                  'ALL',
                  'Big Tech',
                  'Finance & Banking',
                  'Quant & HFT',
                  'Product & Enterprise',
                  'Semiconductors',
                  'Indian Unicorns',
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer border font-medium ${
                      selectedCategory === cat
                        ? 'bg-stone-900 text-stone-50 border-stone-900'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Batch Year Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-stone-400 font-medium mr-1">College Batch:</span>
                {[
                  { label: 'All Batches', val: 'ALL' },
                  { label: '1st & 2nd Year (STEP)', val: '1st/2nd Year' },
                  { label: '3rd Year Summer', val: 'Summer' },
                  { label: '4th Year (6-Mo)', val: '6-Month' },
                ].map((b) => (
                  <button
                    key={b.val}
                    onClick={() => setSelectedBatch(b.val)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer border font-medium ${
                      selectedBatch === b.val
                        ? 'bg-stone-900 text-stone-50 border-stone-900'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {/* Access Type Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-stone-400 font-medium mr-1">Access:</span>
                {[
                  { label: 'All', val: 'ALL' },
                  { label: 'Off-Campus Friendly ✅', val: 'Off-Campus Friendly' },
                  { label: 'Both', val: 'Both (Campus + Portal)' },
                  { label: 'On-Campus Heavy ⚠️', val: 'Heavily On-Campus' },
                ].map((a) => (
                  <button
                    key={a.val}
                    onClick={() => setSelectedAccess(a.val)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer border font-medium ${
                      selectedAccess === a.val
                        ? 'bg-stone-900 text-stone-50 border-stone-900'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between px-1 text-xs text-stone-500">
            <span>
              Showing <strong>{sortedAndFilteredCompanies.length}</strong> companies (sorted by current live activity)
            </span>
            <span className="text-stone-400">
              Tip: Click "Pitch Recruiter" on any company to draft an outreach email
            </span>
          </div>

          {/* Companies Cards Grid */}
          <div className="space-y-4">
            {sortedAndFilteredCompanies.map((comp) => {
              const isActiveInNov = comp.activeMonths.includes(currentMonth);
              const isUpcomingJan = comp.upcomingMonths.some((m) => [12, 1, 2].includes(m));

              return (
                <div
                  key={comp.id}
                  className={`bg-white border rounded-2xl p-6 transition shadow-xs space-y-4 ${
                    isActiveInNov
                      ? 'border-emerald-300/80 bg-gradient-to-b from-emerald-50/10 to-white'
                      : isUpcomingJan
                      ? 'border-amber-200/80'
                      : 'border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      {/* Monogram / Brand Icon */}
                      <div
                        style={{ backgroundColor: comp.logoBg, color: comp.logoColor }}
                        className="h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 select-none"
                      >
                        {comp.initials}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold text-stone-900">
                            {comp.name}
                          </h3>
                          <span className="text-xs px-2.5 py-0.5 rounded-md font-medium bg-stone-100 text-stone-700 border border-stone-200">
                            {comp.category}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                              isActiveInNov
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isUpcomingJan
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            {comp.statusLabel}
                          </span>
                        </div>

                        {/* Location and Access pills */}
                        <div className="flex items-center gap-2.5 text-xs text-stone-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-stone-400" />
                            {comp.locations.join(', ')}
                          </span>
                          <span>•</span>
                          <span
                            className={`font-medium ${
                              comp.accessType === 'Off-Campus Friendly'
                                ? 'text-emerald-700'
                                : comp.accessType === 'Both (Campus + Portal)'
                                ? 'text-stone-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {comp.accessType}
                          </span>
                          {comp.stipendInfo && (
                            <>
                              <span>•</span>
                              <span className="text-stone-700 font-medium">
                                Stipend: {comp.stipendInfo}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <a
                        href={comp.portalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-stone-200"
                        title="Open official career portal"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Official Portal</span>
                      </a>

                      <button
                        onClick={() =>
                          onSelectCompanyForPitch(comp.name, 'Software Engineering Intern')
                        }
                        className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        title="Auto-draft cold email in New Outreach"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Pitch Recruiter</span>
                      </button>
                    </div>
                  </div>

                  {/* Targeted Batches & Key Schedule Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#faf9f6]/80 border border-stone-200/70 text-xs">
                    <div>
                      <span className="text-stone-400 font-medium block">Application Window:</span>
                      <strong className="text-stone-900 font-semibold mt-0.5 block">
                        {comp.appsOpen}
                      </strong>
                      <span className="text-stone-500 text-[11px]">Closes: {comp.appsClose}</span>
                    </div>

                    <div>
                      <span className="text-stone-400 font-medium block">Internship Period:</span>
                      <strong className="text-stone-900 font-semibold mt-0.5 block">
                        {comp.internshipPeriod}
                      </strong>
                      <span className="text-stone-500 text-[11px]">{comp.cyclesPerYear}</span>
                    </div>

                    <div>
                      <span className="text-stone-400 font-medium block">Target Batches / Years:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {comp.targetBatches.map((b) => (
                          <span
                            key={b}
                            className="px-2 py-0.5 rounded bg-white border border-stone-200 font-semibold text-stone-800 text-[11px]"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Interview Process Flow */}
                  <div className="text-xs space-y-1">
                    <span className="text-stone-400 font-medium block">Interview Process & Stages:</span>
                    <p className="text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60 font-sans leading-relaxed">
                      {comp.process}
                    </p>
                  </div>

                  {/* Special programs & Insider tips */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-xs text-stone-600">
                    {comp.specialPrograms && comp.specialPrograms.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-stone-400 font-medium">Special Tracks:</span>
                        {comp.specialPrograms.map((p) => (
                          <span
                            key={p}
                            className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-medium"
                          >
                            ★ {p}
                          </span>
                        ))}
                      </div>
                    )}

                    {comp.insiderTip && (
                      <div className="flex items-center gap-1.5 text-stone-600 bg-stone-100/70 px-2.5 py-1 rounded-md text-[11px]">
                        <Info className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                        <span>{comp.insiderTip}</span>
                      </div>
                    )}

                    {comp.warning && (
                      <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md text-[11px] border border-rose-200">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        <span>{comp.warning}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: FLAGSHIP HIRING HACKATHONS */}
      {subTab === 'hackathons' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-600" />
              <span>Flagship Big Tech Hiring Hackathons & Challenges (Direct PPIs)</span>
            </h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              These are not standard college hackathons that award participation certificates. These are
              <strong> direct corporate recruitment challenges</strong> in India where top performers bypass the resume screening pile and receive Pre-Placement Interviews (PPIs) and internship/full-time offers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FLAGSHIP_HACKATHONS.map((hack) => (
              <div
                key={hack.id}
                className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-4 hover:border-stone-300 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                      {hack.company}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border ${
                        hack.status === 'ACTIVE_NOW'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : hack.status === 'UPCOMING_SOON'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      {hack.status === 'ACTIVE_NOW'
                        ? '🟢 Active / Rolling'
                        : hack.status === 'UPCOMING_SOON'
                        ? '⏰ Opens Jan–March'
                        : '📅 Summer Annual'}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-stone-900 leading-snug">
                    {hack.name}
                  </h4>

                  <div className="text-xs space-y-1.5 text-stone-600">
                    <div>
                      <strong className="text-stone-800">Timeline:</strong> {hack.period}
                    </div>
                    <div>
                      <strong className="text-stone-800">Eligible Batches:</strong> {hack.targetBatches}
                    </div>
                    <div>
                      <strong className="text-stone-800">Challenge Format:</strong> {hack.format}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 space-y-1">
                    <span className="font-semibold block flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                      Hiring Rewards & PPIs:
                    </span>
                    <p className="font-medium leading-relaxed">{hack.rewards}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-stone-400 font-medium">
                    Category: {hack.category}
                  </span>

                  <a
                    href={hack.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <span>View Challenge</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: YEAR-BY-YEAR BATCH ROADMAP */}
      {subTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-stone-800" />
              <span>College Year-by-Year Hiring Strategy & Timeline</span>
            </h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              When should you start applying? A complete master breakdown of what engineering students must do in each year of their B.Tech / B.E. degree.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1st Year */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Year 1 (Freshers)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                  Batches 2028 / 2029
                </span>
              </div>
              <h4 className="text-base font-bold text-stone-900">
                1st Year: Foundations & Exploratory Programs
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Build basic Data Structures (Arrays, Strings, Recursion), Git/GitHub profile, and apply to early-talent cohorts.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#faf9f6] border border-stone-200/70">
                  <strong className="text-stone-900">Google STEP (Nov–Jan):</strong> Dedicated program for 1st & 2nd year students (stipend: ~₹70,000/mo).
                </div>
                <div className="p-2.5 rounded-lg bg-[#faf9f6] border border-stone-200/70">
                  <strong className="text-stone-900">Microsoft Discover / Explore (Dec–Feb):</strong> 1st & 2nd-year rotation track.
                </div>
                <div className="p-2.5 rounded-lg bg-[#faf9f6] border border-stone-200/70">
                  <strong className="text-stone-900">Google Summer of Code (GSoC) (Mar–Apr):</strong> Open to 1st years! Stipend \$1,500–\$3,000.
                </div>
              </div>
            </div>

            {/* 2nd Year */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Year 2 (Sophomores)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                  Batches 2027 / 2028
                </span>
              </div>
              <h4 className="text-base font-bold text-stone-900">
                2nd Year: Early-ID Programs & Startup Cold Outreach
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Intermediate DSA (Trees, Graphs, DP), production-grade web projects, and cold emailing startup founders via AutoReach.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#faf9f6] border border-stone-200/70">
                  <strong className="text-stone-900">Google STEP APAC (Oct–Dec):</strong> Prime window for 2nd years before 3rd-year summer.
                </div>
                <div className="p-2.5 rounded-lg bg-[#faf9f6] border border-stone-200/70">
                  <strong className="text-stone-900">Uber STAR & Adobe SheCodes:</strong> Early-career diversity programs.
                </div>
                <div className="p-2.5 rounded-lg bg-[#faf9f6] border border-stone-200/70">
                  <strong className="text-stone-900">Early-Stage Seed/Series-A Startups:</strong> Best window to land paid 2-month summer internships.
                </div>
              </div>
            </div>

            {/* 3rd Year */}
            <div className="bg-white border-2 border-stone-900 rounded-2xl p-6 shadow-xs space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 font-mono">
                  ★ THE PEAK SEASON (High PPO Conversion)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-stone-900 text-stone-50">
                  Pre-Final Year (Batches 2026 / 2027)
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-stone-900">
                3rd Year: The 10-Month-in-Advance Big Tech Summer Influx
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                <strong>Critical Rule:</strong> Big Tech companies hire for Summer 2027 starting in <strong>July 2026</strong>. If you wait until March/April of your 3rd year, 85% of top MNCs have already finalized offers. Over 70% of these internships convert to full-time Pre-Placement Offers (PPOs).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl bg-[#faf9f6] border border-stone-200">
                  <strong className="text-stone-900 block mb-1">July 1 – August:</strong>
                  Goldman Sachs (July 1), Amazon, Google, Microsoft, Atlassian, Nvidia, Meta, Tower Research.
                </div>
                <div className="p-3 rounded-xl bg-[#faf9f6] border border-stone-200">
                  <strong className="text-stone-900 block mb-1">September – November:</strong>
                  Morgan Stanley, PayPal, Adobe, ServiceNow, Qualcomm, Texas Instruments, Juspay.
                </div>
                <div className="p-3 rounded-xl bg-[#faf9f6] border border-stone-200">
                  <strong className="text-stone-900 block mb-1">May – July (Execution):</strong>
                  You work the 2-month summer internship; final PPO evaluation round conducted in July.
                </div>
              </div>
            </div>

            {/* 4th Year */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Year 4 (Final Year)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                  Graduating Batches 2025 / 2026
                </span>
              </div>
              <h4 className="text-base font-bold text-stone-900">
                4th Year: 6-Month Mandatory Semester Internships & New Grad FTE
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Targeting 6-month Spring internships (January – June) and full-time SDE-1 placement drives.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl bg-[#faf9f6] border border-stone-200">
                  <strong className="text-stone-900 block mb-1">6-Month Spring Internships:</strong>
                  Cisco, Intel, Juspay, Amazon (Jan–Jun batch), Qualcomm, NXP, Meesho, Western Digital. Recruited in August–November.
                </div>
                <div className="p-3 rounded-xl bg-[#faf9f6] border border-stone-200">
                  <strong className="text-stone-900 block mb-1">Off-Campus FTE Waves:</strong>
                  Major waves drop in August–October and January–March on Unstop, company portals, and HackerEarth.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
