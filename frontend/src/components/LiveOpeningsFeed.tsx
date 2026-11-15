import React, { useState, useEffect, useMemo } from 'react';
import type { LiveListingItem } from '../types';
import {
  Search,
  Zap,
  Flame,
  Clock,
  Building2,
  MapPin,
  ExternalLink,
  Send,
  RefreshCw,
  X,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface LiveOpeningsFeedProps {
  onSelectCompanyForPitch: (companyName: string, role: string) => void;
}

export const LiveOpeningsFeed: React.FC<LiveOpeningsFeedProps> = ({
  onSelectCompanyForPitch,
}) => {
  const [liveListings, setLiveListings] = useState<LiveListingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [openCount, setOpenCount] = useState<number>(0);
  const [freshCount, setFreshCount] = useState<number>(0);
  const [lastFetched, setLastFetched] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleType, setSelectedRoleType] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [activeModalListing, setActiveModalListing] = useState<LiveListingItem | null>(null);

  const fetchLiveListings = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const endpoint = forceRefresh ? '/api/live-listings/refresh' : '/api/live-listings';
      const method = forceRefresh ? 'POST' : 'GET';

      const res = await fetch(endpoint, { method });
      if (res.ok) {
        const data = await res.json();
        setLiveListings(data.listings || []);
        setOpenCount(data.openCount || 0);
        setFreshCount(data.freshCount || 0);
        setLastFetched(data.lastFetchedAt || new Date().toISOString());
      }
    } catch (err) {
      console.error('Failed to fetch live listings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveListings();
  }, []);

  const roleTypeTabs = [
    { id: 'ALL', label: 'All Live Positions' },
    { id: 'FRESH_URGENT', label: '🔥 Closes in 1-2 Days (Fresh <48h)' },
    { id: 'Summer Intern', label: '☀️ Summer Internships (2–3M)' },
    { id: '6-Month Intern', label: '💼 6-Month Semester Internships' },
    { id: 'PPO / Full-Time', label: '🚀 PPO & Off-Campus FTE' },
  ];

  const categories = [
    { id: 'ALL', label: 'All Fields' },
    { id: 'swe', label: 'Software Eng (SWE)' },
    { id: 'data_ml', label: 'AI / ML & Data' },
    { id: 'quant', label: 'Quant & HFT' },
    { id: 'product', label: 'Product & PM' },
  ];

  const batches = ['ALL', '2028', '2027', '2026', '2025'];

  const filteredListings = useMemo(() => {
    return liveListings.filter((item) => {
      // Role Type Filter
      if (selectedRoleType === 'FRESH_URGENT') {
        if (!item.isUrgentFresh || item.status !== 'open') return false;
      } else if (selectedRoleType !== 'ALL') {
        if (item.roleType !== selectedRoleType) return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Batch
      if (selectedBatch !== 'ALL') {
        const batchNum = parseInt(selectedBatch, 10);
        if (!item.eligibleBatches.includes(batchNum)) return false;
      }

      // Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesName = item.company.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesLoc = item.locations.some((l) => l.toLowerCase().includes(q));
        const matchesCategory = item.categoryLabel.toLowerCase().includes(q);
        if (!matchesName && !matchesTitle && !matchesLoc && !matchesCategory) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Urgent fresh always first
      if (a.isUrgentFresh && !b.isUrgentFresh) return -1;
      if (!a.isUrgentFresh && b.isUrgentFresh) return 1;
      // Then by hours old
      return a.hoursOld - b.hoursOld;
    });
  }, [liveListings, selectedRoleType, selectedCategory, selectedBatch, searchQuery]);

  const summerCount = liveListings.filter((i) => i.roleType === 'Summer Intern' && i.status === 'open').length;
  const sixMonthCount = liveListings.filter((i) => i.roleType === '6-Month Intern' && i.status === 'open').length;
  const ppoCount = liveListings.filter((i) => i.roleType === 'PPO / Full-Time' && i.status === 'open').length;

  return (
    <div className="space-y-6 pb-20">
      {/* Editorial Header */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Pastel Yellow Accent Ribbon */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-200/40 via-yellow-100/30 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-semibold border border-amber-300">
              <Zap className="h-3.5 w-3.5 text-amber-600" />
              <span>Real-Time ATS Career Portals Feed</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Live Tech Openings & Fast-Closing Applications
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Top tech internship portals close within 24–48 hours of posting due to high applicant volume. This tracker scrapes official ATS boards (Workday, Greenhouse, Lever, Ashby) to catch openings the moment they drop.
            </p>
          </div>

          {/* Metrics Glance */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <div className="p-3 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[75px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Total Live</span>
              <span className="text-lg font-bold text-stone-900">{openCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-center min-w-[90px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-0.5">Closes Fast</span>
              <span className="text-lg font-bold text-amber-900 flex items-center justify-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-600" />
                {freshCount}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[75px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Summer</span>
              <span className="text-lg font-bold text-emerald-700">{summerCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[75px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">6-Month</span>
              <span className="text-lg font-bold text-stone-800">{sixMonthCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[75px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">PPO / FTE</span>
              <span className="text-lg font-bold text-blue-700">{ppoCount}</span>
            </div>
          </div>
        </div>

        {lastFetched && (
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
            <span>🛡️ Official ATS Whitelist Verified: Workday, Greenhouse, Lever, Ashby, Eightfold</span>
            <span>Live Scan Active</span>
          </div>
        )}
      </div>

      {/* Role Type Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {roleTypeTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedRoleType(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedRoleType === tab.id
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Fine-grain Filters */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by company (Google, Microsoft, Rippling, Uber), role, or location (Bangalore, Pune)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f9fafb] border border-stone-200 rounded-lg pl-9 pr-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 font-sans"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => fetchLiveListings(true)}
              disabled={refreshing}
              className="py-2 px-3 rounded-lg border border-stone-200 bg-[#f9fafb] hover:bg-stone-100 text-xs font-semibold text-stone-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Poll latest postings from official ATS portals"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-amber-600' : 'text-stone-500'}`} />
              <span>{refreshing ? 'Scanning ATS...' : 'Check New'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Filters: Category & Batches */}
        <div className="flex items-center justify-between gap-4 pt-3 border-t border-stone-100 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold uppercase text-stone-400 mr-1">Discipline:</span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase text-stone-400 mr-1">Batch:</span>
            {batches.map((batch) => (
              <button
                key={batch}
                onClick={() => setSelectedBatch(batch)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedBatch === batch
                    ? 'bg-stone-900 text-white font-bold'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {batch === 'ALL' ? 'All Batches' : `${batch}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listings Stream */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
          <div className="h-6 w-6 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-xs font-semibold text-stone-600">Connecting to official ATS pipelines...</span>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
          <Building2 className="h-8 w-8 text-stone-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-stone-700">No active postings match your criteria</h4>
          <p className="text-xs text-stone-400 mt-1">Try switching to "All Live Positions" or clearing your batch filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((listing) => {
            const isFresh = listing.isUrgentFresh;

            return (
              <div
                key={listing.id}
                onClick={() => setActiveModalListing(listing)}
                className={`bg-white border rounded-xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer relative ${
                  isFresh ? 'border-amber-400/90 hover:border-amber-500' : 'border-stone-200/90 hover:border-stone-300'
                }`}
              >
                {/* Header Strip */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-lg bg-[#fbfbfa] border border-stone-200/90 flex items-center justify-center text-stone-800 font-bold text-sm shrink-0 group-hover:border-amber-400 transition">
                        {listing.company.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
                            {listing.company}
                          </span>
                          <span title="Verified ATS Portal">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-stone-900 group-hover:text-amber-900 transition leading-snug line-clamp-1">
                          {listing.title}
                        </h3>
                      </div>
                    </div>

                    {isFresh && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-bold tracking-tight whitespace-nowrap shrink-0 flex items-center gap-1 animate-pulse">
                        <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                        Closes Fast
                      </span>
                    )}
                  </div>

                  {/* Urgency Alert Bar for Fresh Postings */}
                  {isFresh && (
                    <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/90 text-[11px] text-amber-950 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Posted {listing.postedAgoLabel} • Expected window: 1–2 days max!</span>
                    </div>
                  )}

                  {/* Pills Row */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold">
                      {listing.roleType}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                      {listing.categoryLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-stone-400" />
                      {listing.locations[0] || 'India'}
                    </span>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="space-y-2 pt-3 border-t border-stone-100 text-[11px]">
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="text-stone-400 font-medium">Eligible:</span>
                    <span className="font-semibold text-stone-800">{listing.eligibleBatchesLabel}</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="text-stone-400 font-medium">Stipend:</span>
                    <span className="font-bold text-emerald-800">{listing.stipend}</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="text-stone-400 font-medium">Deadline:</span>
                    <span className="font-semibold text-stone-800">{listing.deadline}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs font-semibold text-stone-500 group-hover:text-stone-900 transition">
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-800">
                      <span>View details & pitch</span>
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition" />
                    </span>
                    <span className="text-[10px] text-stone-400">Click to expand</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* "Box Opening" Detailed Dossier Modal */}
      {activeModalListing && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    {activeModalListing.company}
                  </span>
                  <span className="text-xs font-medium text-stone-500">
                    {activeModalListing.roleType}
                  </span>
                  {activeModalListing.isUrgentFresh && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                      🔥 Closes in 1-2 Days
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-stone-900">
                  {activeModalListing.title}
                </h3>
              </div>

              <button
                onClick={() => setActiveModalListing(null)}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metrics Glance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-amber-800 block mb-0.5">Posted</span>
                <span className="text-stone-900 font-semibold">{activeModalListing.postedAgoLabel}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f9fafb] border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Target Batches</span>
                <span className="text-stone-900 font-semibold">{activeModalListing.eligibleBatchesLabel}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-0.5">Stipend / CTC</span>
                <span className="text-emerald-950 font-bold">{activeModalListing.stipend}</span>
              </div>
            </div>

            {/* Information Rows */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/90 flex items-center justify-between">
                <span className="text-stone-500 font-medium">Locations:</span>
                <span className="font-semibold text-stone-800">{activeModalListing.locations.join(', ')}</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/90 flex items-center justify-between">
                <span className="text-stone-500 font-medium">Degree Requirement:</span>
                <span className="font-semibold text-stone-800">{activeModalListing.degreeRequired}</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/90 flex items-center justify-between">
                <span className="text-stone-500 font-medium">Estimated Application Window:</span>
                <span className="font-bold text-amber-900">{activeModalListing.deadline}</span>
              </div>
            </div>

            {/* Tip Notice */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5 font-bold">AutoReach Outreach Tip:</strong>
                <span>
                  Large tech firms receive 5,000+ applicants within 48 hours for this role. Use AutoReach below to find and pitch recruiters and engineering managers directly with your proof-of-work project to guarantee your resume gets reviewed.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
              <a
                href={activeModalListing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <span>Direct Official Portal</span>
                <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
              </a>

              <button
                onClick={() => {
                  onSelectCompanyForPitch(activeModalListing.company, activeModalListing.title);
                  setActiveModalListing(null);
                }}
                className="py-2.5 px-5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Pitch Recruiter for {activeModalListing.company}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
