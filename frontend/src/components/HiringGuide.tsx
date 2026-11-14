import React, { useState, useEffect, useMemo } from 'react';
import {
  HIRING_COMPANIES,
  FLAGSHIP_HACKATHONS,
} from '../data/hiringData';
import type { LiveListingItem } from '../types';
import {
  Search,
  Building2,
  Trophy,
  ExternalLink,
  Send,
  GraduationCap,
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
  Flame,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface HiringGuideProps {
  onSelectCompanyForPitch: (companyName: string, role: string) => void;
}

export const HiringGuide: React.FC<HiringGuideProps> = ({
  onSelectCompanyForPitch,
}) => {
  // Navigation sub-tab: 'live' | 'companies' | 'hackathons' | 'roadmap'
  const [subTab, setSubTab] = useState<'live' | 'companies' | 'hackathons' | 'roadmap'>('live');

  // Static Radar Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [selectedAccess, setSelectedAccess] = useState<string>('ALL');
  const [selectedTiming, setSelectedTiming] = useState<'ALL' | 'ACTIVE_NOW' | 'UPCOMING_SOON' | 'ANNUAL_CYCLE'>('ALL');

  // Live ATS Listings State
  const [liveListings, setLiveListings] = useState<LiveListingItem[]>([]);
  const [liveLoading, setLiveLoading] = useState<boolean>(true);
  const [liveRefreshing, setLiveRefreshing] = useState<boolean>(false);
  const [liveOpenCount, setLiveOpenCount] = useState<number>(0);
  const [liveFreshCount, setLiveFreshCount] = useState<number>(0);
  const [liveLastFetched, setLiveLastFetched] = useState<string>('');

  // Live ATS Filters
  const [liveSearchQuery, setLiveSearchQuery] = useState<string>('');
  const [liveFreshFilter, setLiveFreshFilter] = useState<'ALL_OPEN' | 'FRESH_ONLY' | 'ALL'>('ALL_OPEN');
  const [liveBatchFilter, setLiveBatchFilter] = useState<string>('ALL');
  const [liveCategoryFilter, setLiveCategoryFilter] = useState<string>('ALL');

  // Fetch live listings from backend
  const fetchLiveListings = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setLiveRefreshing(true);
      } else {
        setLiveLoading(true);
      }

      const endpoint = forceRefresh ? '/api/live-listings/refresh' : '/api/live-listings';
      const method = forceRefresh ? 'POST' : 'GET';

      const res = await fetch(endpoint, { method });
      if (res.ok) {
        const data = await res.json();
        setLiveListings(data.listings || []);
        setLiveOpenCount(data.openCount || 0);
        setLiveFreshCount(data.freshCount || 0);
        setLiveLastFetched(data.lastFetchedAt || new Date().toISOString());
      }
    } catch (err) {
      console.error('Failed to fetch live listings:', err);
    } finally {
      setLiveLoading(false);
      setLiveRefreshing(false);
    }
  };

  // Load live listings on mount
  useEffect(() => {
    fetchLiveListings();
  }, []);

  // Filtered live listings
  const filteredLiveListings = useMemo(() => {
    return liveListings.filter((item) => {
      // Freshness & status filter
      if (liveFreshFilter === 'FRESH_ONLY') {
        if (!item.isUrgentFresh || item.status !== 'open') return false;
      } else if (liveFreshFilter === 'ALL_OPEN') {
        if (item.status !== 'open') return false;
      }

      // Batch filter
      if (liveBatchFilter !== 'ALL') {
        const targetYear = parseInt(liveBatchFilter, 10);
        if (!item.eligibleBatches.includes(targetYear)) return false;
      }

      // Category filter
      if (liveCategoryFilter !== 'ALL') {
        if (item.category !== liveCategoryFilter) return false;
      }

      // Search query
      if (liveSearchQuery.trim()) {
        const q = liveSearchQuery.toLowerCase();
        const matchesComp = item.company.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesLoc = item.locations.some((l) => l.toLowerCase().includes(q));
        const matchesBatches = item.eligibleBatchesLabel.toLowerCase().includes(q);
        if (!matchesComp && !matchesTitle && !matchesLoc && !matchesBatches) return false;
      }

      return true;
    });
  }, [liveListings, liveFreshFilter, liveBatchFilter, liveCategoryFilter, liveSearchQuery]);

  // Current month (November = 11)
  const currentMonth = 11; // November

  // Static Radar Categorization & Sorting
  const sortedAndFilteredCompanies = useMemo(() => {
    return HIRING_COMPANIES.filter((company) => {
      const matchesSearch =
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.locations.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase())) ||
        company.process.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.insiderTip && company.insiderTip.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'ALL' || company.category === selectedCategory;

      const matchesBatch =
        selectedBatch === 'ALL' ||
        company.targetBatches.some((b) => b.includes(selectedBatch));

      const matchesAccess =
        selectedAccess === 'ALL' || company.accessType === selectedAccess;

      const matchesTiming =
        selectedTiming === 'ALL' || company.currentStatus === selectedTiming;

      return matchesSearch && matchesCategory && matchesBatch && matchesAccess && matchesTiming;
    }).sort((a, b) => {
      const aIsActive = a.activeMonths.includes(currentMonth);
      const bIsActive = b.activeMonths.includes(currentMonth);
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;

      const aIsUpcoming = a.upcomingMonths.some((m) => [12, 1, 2].includes(m));
      const bIsUpcoming = b.upcomingMonths.some((m) => [12, 1, 2].includes(m));
      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, selectedCategory, selectedBatch, selectedAccess, selectedTiming, currentMonth]);

  const activeNowCount = HIRING_COMPANIES.filter((c) => c.activeMonths.includes(currentMonth)).length;
  const upcomingSoonCount = HIRING_COMPANIES.filter(
    (c) => !c.activeMonths.includes(currentMonth) && c.upcomingMonths.some((m) => [12, 1, 2].includes(m))
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-24">
      {/* Top Hero Banner */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                India Tech Hiring Radar & Live ATS Tracker
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500">
              Live automated crawler & verified ATS feeds across 100+ top tech companies (Google, Juspay, Apple, Microsoft, Nvidia, etc.) with real-time deadlines and 1-click recruiter pitching.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex rounded-lg bg-stone-100 p-1 border border-stone-200/60 self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setSubTab('live')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                subTab === 'live'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Live ATS Feed</span>
              {liveFreshCount > 0 && (
                <span className="h-4 px-1.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-bold flex items-center justify-center">
                  {liveFreshCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setSubTab('companies')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                subTab === 'companies'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>34 MNC Radar</span>
            </button>
            <button
              onClick={() => setSubTab('hackathons')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                subTab === 'hackathons'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Hackathons</span>
            </button>
            <button
              onClick={() => setSubTab('roadmap')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                subTab === 'roadmap'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Roadmap</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Header */}
        <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-semibold text-stone-800 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Status:
            </span>
            <span className="text-stone-600">
              <strong className="text-stone-900 font-semibold">{liveOpenCount}</strong> active openings across 100+ company portals
            </span>
            <span className="text-stone-300">|</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/90 font-medium flex items-center gap-1">
              <Flame className="h-3 w-3 text-amber-600" />
              <strong>{liveFreshCount}</strong> posted in last 48h
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-stone-400">
              {liveLastFetched ? `Checked ${new Date(liveLastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLiveListings(true)}
              disabled={liveRefreshing}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-stone-700 border border-stone-200 hover:bg-stone-100 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60 shadow-2xs"
              title="Force sync latest postings from company ATS endpoints"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-stone-600 ${liveRefreshing ? 'animate-spin' : ''}`} />
              <span>{liveRefreshing ? 'Syncing Feeds...' : 'Sync Live ATS'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 0: LIVE ATS FEED (DEFAULT) */}
      {subTab === 'live' && (
        <div className="space-y-5">
          {/* Urgency Alert Card */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs sm:text-sm">
              <Flame className="h-4 w-4 text-amber-600" />
              <span>Critical Application Velocity Rule: 24–48 Hour Deadlines</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Top tech internship postings in India (Google, Juspay, Caterpillar, Apple, Microsoft) often close within <strong>1–2 days</strong> once reaching applicant caps (typically 500–1,000 resumes). Filter by <strong>Fresh (&lt;48h)</strong> daily and dispatch your targeted pitch immediately.
            </p>
          </div>

          {/* Live Filters & Search Bar */}
          <div className="bg-white border border-stone-200/80 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search company (Juspay, Apple, Google, Caterpillar), role, or location (Bangalore, Hyderabad)..."
                  value={liveSearchQuery}
                  onChange={(e) => setLiveSearchQuery(e.target.value)}
                  className="w-full bg-[#f9fafb] border border-stone-200 rounded-lg pl-9 pr-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 font-sans"
                />
              </div>

              {/* Freshness Toggle */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'FRESH_ONLY', label: '🔥 Fresh (<48h)' },
                  { id: 'ALL_OPEN', label: '🟢 All Open' },
                  { id: 'ALL', label: 'All (Inc. Archives)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setLiveFreshFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                      liveFreshFilter === f.id
                        ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Pills: Batches & Categories */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-stone-100 text-xs">
              {/* Batch Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-stone-400 font-medium mr-1">Graduation Batch:</span>
                {[
                  { label: 'All Batches', val: 'ALL' },
                  { label: '🎓 2026', val: '2026' },
                  { label: '🎓 2027', val: '2027' },
                  { label: '🎓 2028 (1st/2nd Yr)', val: '2028' },
                  { label: '🎓 2025', val: '2025' },
                ].map((b) => (
                  <button
                    key={b.val}
                    onClick={() => setLiveBatchFilter(b.val)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer border font-medium ${
                      liveBatchFilter === b.val
                        ? 'bg-stone-900 text-stone-50 border-stone-900'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-stone-400 font-medium mr-1">Discipline:</span>
                {[
                  { label: 'All Roles', val: 'ALL' },
                  { label: 'Software / SWE', val: 'swe' },
                  { label: 'Data & AI / ML', val: 'data_ml' },
                  { label: 'Quant & Trading', val: 'quant' },
                  { label: 'Product', val: 'product' },
                  { label: 'Hardware & Silicon', val: 'hardware' },
                ].map((cat) => (
                  <button
                    key={cat.val}
                    onClick={() => setLiveCategoryFilter(cat.val)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer border font-medium ${
                      liveCategoryFilter === cat.val
                        ? 'bg-stone-900 text-stone-50 border-stone-900'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feed Results Count */}
          <div className="flex items-center justify-between px-1 text-xs text-stone-500">
            <span>
              Showing <strong>{filteredLiveListings.length}</strong> live postings matching criteria
            </span>
            <span className="text-stone-400">
              Verified ATS feeds checked regularly
            </span>
          </div>

          {/* Loading Indicator */}
          {liveLoading && (
            <div className="bg-white border border-stone-200/80 rounded-xl p-10 text-center shadow-2xs">
              <div className="h-5 w-5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs sm:text-sm font-semibold text-stone-800">
                Crawling live career portals & ATS endpoints...
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Parsing batch years, stipends, and posting dates for 100+ Indian tech employers.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!liveLoading && filteredLiveListings.length === 0 && (
            <div className="bg-white border border-stone-200/80 rounded-xl p-10 text-center shadow-2xs space-y-3">
              <div className="h-9 w-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mx-auto">
                <Search className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-stone-900">
                No openings match these filters
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Try switching to "All Open" or selecting a different graduation batch year or sector.
              </p>
              <button
                onClick={() => {
                  setLiveSearchQuery('');
                  setLiveFreshFilter('ALL_OPEN');
                  setLiveBatchFilter('ALL');
                  setLiveCategoryFilter('ALL');
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-stone-50 hover:bg-stone-800 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Listings Cards Grid */}
          {!liveLoading && filteredLiveListings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredLiveListings.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-xl p-4 sm:p-5 shadow-2xs transition hover:shadow-xs flex flex-col justify-between space-y-3.5 ${
                    item.isUrgentFresh && item.status === 'open'
                      ? 'border-amber-300/80 bg-white'
                      : 'border-stone-200/80'
                  }`}
                >
                  {/* Card Header */}
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-stone-900 text-stone-50 font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                          {item.company.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-stone-900 text-sm leading-tight">
                              {item.company}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-stone-100 text-stone-700 border border-stone-200">
                              {item.categoryLabel}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            {item.source === 'direct_ats' ? 'Live ATS Hook' : 'Official Portal'}
                          </span>
                        </div>
                      </div>

                      {/* Freshness / Status Badge */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {item.status === 'open' ? (
                          item.isUrgentFresh ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 flex items-center gap-1.5">
                              <Flame className="h-3.5 w-3.5 text-amber-600" />
                              <span>Fresh ({item.postedAgoLabel})</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>Open ({item.postedAgoLabel})</span>
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-500 border border-stone-200">
                            Closed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Role Title */}
                    <h4 className="text-xs sm:text-sm font-semibold text-stone-900 leading-snug">
                      {item.title}
                    </h4>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                      <div className="p-2 rounded-lg bg-[#f9fafb] border border-stone-200/70">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-0.5">
                          Target Batches
                        </span>
                        <strong className="text-stone-800 font-semibold block truncate">
                          {item.eligibleBatchesLabel}
                        </strong>
                      </div>

                      <div className="p-2 rounded-lg bg-[#f9fafb] border border-stone-200/70">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-0.5">
                          Role Type
                        </span>
                        <strong className="text-stone-800 font-semibold block truncate">
                          {item.roleType} {item.durationMonths ? `(${item.durationMonths}M)` : ''}
                        </strong>
                      </div>

                      <div className="p-2 rounded-lg bg-[#f9fafb] border border-stone-200/70">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-0.5">
                          Locations
                        </span>
                        <strong className="text-stone-800 font-semibold block truncate">
                          {item.locations.join(', ')}
                        </strong>
                      </div>

                      <div className="p-2 rounded-lg bg-[#f9fafb] border border-stone-200/70">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-0.5">
                          Compensation
                        </span>
                        <strong className="text-stone-800 font-semibold block truncate">
                          {item.stipend}
                        </strong>
                      </div>
                    </div>

                    {/* Urgency Alert if Fresh */}
                    {item.isUrgentFresh && item.status === 'open' && (
                      <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs font-medium flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>
                          <strong>High Velocity:</strong> Posted {item.postedAgoLabel}. Tech internships usually close within 24–48 hours!
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                    <button
                      onClick={() => onSelectCompanyForPitch(item.company, item.title)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-stone-900 text-stone-50 hover:bg-black text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Send className="h-3 w-3" />
                      <span>Pitch Recruiter</span>
                    </button>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                      title="Open verified official career portal"
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="h-3 w-3 text-stone-400" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 1: COMPANIES RADAR (34 MNCS) */}
      {subTab === 'companies' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-stone-200/80 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by company name, location, role, tech stack (e.g. Google, C++, Bangalore)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f9fafb] border border-stone-200 rounded-lg pl-9 pr-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 font-sans"
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
              Showing <strong>{sortedAndFilteredCompanies.length}</strong> companies (<strong>{activeNowCount}</strong> open now in Nov, <strong>{upcomingSoonCount}</strong> opening Jan–Feb)
            </span>
            <span className="text-stone-400">
              💡 Tip: Click "Pitch Recruiter" to automatically draft a project-matched outreach letter.
            </span>
          </div>

          {/* Company Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {sortedAndFilteredCompanies.map((company) => {
              const isOpenNow = company.activeMonths.includes(currentMonth);
              const isUpcoming = company.upcomingMonths.some((m) => [12, 1, 2].includes(m));

              return (
                <div
                  key={company.name}
                  className={`bg-white border rounded-xl p-4 sm:p-5 shadow-2xs transition hover:shadow-xs flex flex-col justify-between space-y-3.5 ${
                    isOpenNow
                      ? 'border-emerald-300/80 bg-white'
                      : isUpcoming
                      ? 'border-amber-200/90'
                      : 'border-stone-200/80'
                  }`}
                >
                  {/* Card Header */}
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-stone-900 text-sm sm:text-base leading-tight">
                            {company.name}
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-stone-100 text-stone-700 border border-stone-200">
                            {company.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                          <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                          <span>{company.locations.join(' · ')}</span>
                        </div>
                      </div>

                      {/* Live Status Badge */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isOpenNow ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active in Nov</span>
                          </span>
                        ) : isUpcoming ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span>Opens Dec–Feb</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
                            Aug–Oct Cycle
                          </span>
                        )}
                        <span className="text-[11px] text-stone-400">
                          {company.accessType}
                        </span>
                      </div>
                    </div>

                    {/* Window & Eligibility Tags */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                      <div className="p-2 rounded-lg bg-[#f9fafb] border border-stone-200/70">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-0.5">
                          Application Window
                        </span>
                        <strong className="text-stone-800 font-semibold block truncate">
                          {company.appsOpen} – {company.appsClose}
                        </strong>
                      </div>
                      <div className="p-2 rounded-lg bg-[#f9fafb] border border-stone-200/70">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-0.5">
                          Target Batches
                        </span>
                        <strong className="text-stone-800 font-semibold block truncate">
                          {company.targetBatches.join(', ')}
                        </strong>
                      </div>
                    </div>

                    {/* Interview / OA Process */}
                    <div className="text-xs text-stone-600 leading-relaxed bg-[#f9fafb] p-2.5 rounded-lg border border-stone-200/60">
                      <span className="font-semibold text-stone-800 block mb-0.5">
                        Hiring Flow:
                      </span>
                      {company.process}
                    </div>

                    {/* Insider Tip / Warning */}
                    {company.insiderTip && (
                      <div className="text-xs text-stone-600 leading-relaxed flex items-start gap-1.5 pt-0.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{company.insiderTip}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={company.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition cursor-pointer"
                      >
                        <span>Career Site</span>
                        <ExternalLink className="h-3 w-3 text-stone-400" />
                      </a>
                    </div>

                    <button
                      onClick={() => onSelectCompanyForPitch(company.name, 'Software Engineering Intern')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-50 bg-stone-900 hover:bg-black transition cursor-pointer shadow-2xs"
                    >
                      <Send className="h-3 w-3" />
                      <span>Pitch Recruiter</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: HACKATHONS */}
      {subTab === 'hackathons' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-2xs space-y-1.5">
            <h3 className="text-base font-semibold text-stone-900">
              Flagship Hiring Hackathons (Direct Pre-Placement Interviews / PPIs)
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              These verified competitive hackathons offer <strong>direct interview calls and summer/6-month internship offers</strong> bypassing standard resume screen filters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {FLAGSHIP_HACKATHONS.map((h) => (
              <div
                key={h.name}
                className="bg-white border border-stone-200/80 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-stone-900 text-sm sm:text-base">
                        {h.name}
                      </h4>
                      <span className="text-xs text-stone-500">
                        Organized by <strong className="text-stone-800">{h.company}</strong>
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                      {h.period}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#f9fafb] border border-stone-200/70 text-xs space-y-1">
                    <div>
                      <span className="text-stone-400 font-medium">Eligible: </span>
                      <strong className="text-stone-800">{h.targetBatches}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 font-medium">Reward: </span>
                      <strong className="text-emerald-700">{h.rewards}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {h.format}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <a
                    href={h.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition cursor-pointer"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="h-3 w-3 text-stone-400" />
                  </a>
                  <button
                    onClick={() => onSelectCompanyForPitch(h.company, `${h.name} Finalist Outreach`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-50 bg-stone-900 hover:bg-black transition cursor-pointer shadow-2xs"
                  >
                    <Send className="h-3 w-3" />
                    <span>Pitch for {h.company}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: 4-YEAR ROADMAP */}
      {subTab === 'roadmap' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-2xs space-y-1.5">
            <h3 className="text-base font-semibold text-stone-900">
              4-Year B.Tech Placement & Internship Timeline
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              When to apply for each program depending on your current graduation batch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1st Year */}
            <div className="bg-white border border-stone-200/80 rounded-xl p-4 sm:p-5 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Year 1 (Freshman)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-stone-100 text-stone-800 border border-stone-200">
                  Batch 2028 / 2029
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-semibold text-stone-900">
                1st Year: Foundations & Early Diversity Programs
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Focus on Data Structures, Git, and web/systems projects. Apply to dedicated early-year explorer pipelines:
              </p>
              <ul className="text-xs text-stone-700 space-y-1 list-disc list-inside bg-[#f9fafb] p-2.5 rounded-lg border border-stone-200/70">
                <li><strong>Google STEP:</strong> Opens in Nov–Dec for 1st & 2nd year students.</li>
                <li><strong>Microsoft Explore:</strong> 8–12 week program designed for freshmen & sophomores.</li>
                <li><strong>Open Source:</strong> GSoC & GirlScript Summer of Code (Jan–March).</li>
              </ul>
            </div>

            {/* 2nd Year */}
            <div className="bg-white border border-stone-200/80 rounded-xl p-4 sm:p-5 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Year 2 (Sophomore)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-stone-100 text-stone-800 border border-stone-200">
                  Batch 2027 / 2028
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-semibold text-stone-900">
                2nd Year: Early Internships & Women Diversity Hackathons
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                The most important year for early industry entry and PPI pipeline access:
              </p>
              <ul className="text-xs text-stone-700 space-y-1 list-disc list-inside bg-[#f9fafb] p-2.5 rounded-lg border border-stone-200/70">
                <li><strong>Amazon WoW:</strong> Flagship diversity program (applications open Feb–April).</li>
                <li><strong>Uber STAR:</strong> Designed specifically for 2nd-year CS students.</li>
                <li><strong>Walmart CodeHers:</strong> Unstop hackathon offering summer intern PPIs (Feb–March).</li>
              </ul>
            </div>

            {/* 3rd Year */}
            <div className="bg-white border border-stone-200/80 rounded-xl p-4 sm:p-5 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Year 3 (Pre-Final Year)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Peak Summer Intern Window
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-semibold text-stone-900">
                3rd Year: The Core Summer Internship (May–July)
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Highest convert-to-PPO rate in India tech. 80%+ of full-time hires at Big Tech come through this cohort:
              </p>
              <ul className="text-xs text-stone-700 space-y-1 list-disc list-inside bg-[#f9fafb] p-2.5 rounded-lg border border-stone-200/70">
                <li><strong>Big Tech Applications Open:</strong> June–August (Google, MS, Amazon, Apple, Nvidia).</li>
                <li><strong>Finance & Banking:</strong> Goldman Sachs, JP Morgan, Morgan Stanley (Aug–Oct).</li>
                <li><strong>Off-Campus Season:</strong> Drops in Jan–April for summer (Juspay, Swiggy, Cred).</li>
              </ul>
            </div>

            {/* 4th Year */}
            <div className="bg-white border border-stone-200/80 rounded-xl p-4 sm:p-5 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Year 4 (Final Year)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-stone-100 text-stone-800 border border-stone-200">
                  Graduating Batches 2025 / 2026
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-semibold text-stone-900">
                4th Year: 6-Month Semester Internships & SDE-1
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Targeting 6-month Spring internships (January – June) and full-time SDE-1 placement drives.
              </p>
              <ul className="text-xs text-stone-700 space-y-1 list-disc list-inside bg-[#f9fafb] p-2.5 rounded-lg border border-stone-200/70">
                <li><strong>6-Month Spring Internships:</strong> Cisco, Intel, Juspay, Amazon, Qualcomm, NXP.</li>
                <li><strong>Off-Campus FTE Waves:</strong> Peak in Aug–Oct and Jan–March on career portals and Unstop.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
