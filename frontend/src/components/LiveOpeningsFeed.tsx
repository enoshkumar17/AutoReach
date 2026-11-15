import React, { useState, useEffect, useMemo } from 'react';
import type { LiveListingItem } from '../types';
import {
  Search,
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
  AlertCircle,
  Archive,
} from 'lucide-react';

interface LiveOpeningsFeedProps {
  onSelectCompanyForPitch: (companyName: string, role: string) => void;
  candidateTargetBatch?: number;
}

export const LiveOpeningsFeed: React.FC<LiveOpeningsFeedProps> = ({
  onSelectCompanyForPitch,
  candidateTargetBatch = 2028,
}) => {
  const [liveListings, setLiveListings] = useState<LiveListingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [openCount, setOpenCount] = useState<number>(0);
  const [closedCount, setClosedCount] = useState<number>(0);
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
        setClosedCount(data.closedCount || (data.listings || []).filter((i: LiveListingItem) => i.status === 'closed').length);
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

  // Compute live counts
  const summerOpenCount = useMemo(() => {
    return liveListings.filter((i) => i.status === 'open' && i.roleType === 'Summer Intern').length;
  }, [liveListings]);

  const sixMonthOpenCount = useMemo(() => {
    return liveListings.filter((i) => i.status === 'open' && i.roleType === '6-Month Intern').length;
  }, [liveListings]);

  const ppoOpenCount = useMemo(() => {
    return liveListings.filter((i) => i.status === 'open' && i.roleType === 'PPO / Full-Time').length;
  }, [liveListings]);

  const matchedForMeCount = useMemo(() => {
    return liveListings.filter(
      (i) => i.status === 'open' && (i.eligibleBatches.includes(candidateTargetBatch) || i.eligibleBatches.length === 0)
    ).length;
  }, [liveListings, candidateTargetBatch]);

  const roleTypeTabs = [
    { id: 'ALL', label: `All Live Openings (${openCount})` },
    { id: 'MATCHED_FOR_ME', label: `⭐ Matched for Batch ${candidateTargetBatch} (${matchedForMeCount})` },
    { id: 'FRESH_URGENT', label: `🔥 Closes in 1-2 Days (${freshCount})` },
    { id: 'Summer Intern', label: `☀️ Summer Internships (${summerOpenCount})` },
    { id: '6-Month Intern', label: `💼 6-Month Semester (${sixMonthOpenCount})` },
    { id: 'PPO / Full-Time', label: `🚀 PPO & Full-Time (${ppoOpenCount})` },
    { id: 'RECENTLY_CLOSED', label: `🔴 Recently Closed (<30 Days) (${closedCount})` },
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
      // 1. STATUS SEPARATION (Strictly separate open vs closed)
      if (selectedRoleType === 'RECENTLY_CLOSED') {
        if (item.status !== 'closed') return false;
      } else {
        // All active live tabs MUST ONLY contain open positions!
        if (item.status !== 'open') return false;

        if (selectedRoleType === 'MATCHED_FOR_ME') {
          if (!item.eligibleBatches.includes(candidateTargetBatch) && item.eligibleBatches.length > 0) return false;
        } else if (selectedRoleType === 'FRESH_URGENT') {
          if (!item.isUrgentFresh) return false;
        } else if (selectedRoleType !== 'ALL') {
          if (item.roleType !== selectedRoleType) return false;
        }
      }

      // 2. Discipline Category
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // 3. Batch Year
      if (selectedBatch !== 'ALL') {
        const batchNum = parseInt(selectedBatch, 10);
        if (!item.eligibleBatches.includes(batchNum)) return false;
      }

      // 4. Search Query
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
      if (selectedRoleType === 'RECENTLY_CLOSED') {
        return a.daysOld - b.daysOld;
      }
      // Urgent fresh always first for active openings
      if (a.isUrgentFresh && !b.isUrgentFresh) return -1;
      if (!a.isUrgentFresh && b.isUrgentFresh) return 1;
      return a.hoursOld - b.hoursOld;
    });
  }, [liveListings, selectedRoleType, selectedCategory, selectedBatch, searchQuery]);

  const formattedLastChecked = useMemo(() => {
    if (!lastFetched) return 'Just now';
    try {
      const d = new Date(lastFetched);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Today';
    }
  }, [lastFetched]);

  return (
    <div className="space-y-6 pb-20">
      {/* 80% Clean SaaS Header + 20% Enhanced Warm Accent */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-amber-200/35 via-yellow-100/15 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-semibold border border-amber-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time ATS Career Portals Feed</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Live Tech Openings & Fast-Closing Applications
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Top tech internship portals close within 24–48 hours of posting due to high applicant volume. This tracker scrapes official ATS boards (Workday, Greenhouse, Lever, Ashby, Eightfold) to surface verified openings the moment they drop.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto shrink-0">
            <div className="p-3 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[85px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Total Live</span>
              <span className="text-lg font-bold text-stone-900">{openCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-center min-w-[85px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-0.5">Closes Fast</span>
              <span className="text-lg font-bold text-amber-900 flex items-center justify-center gap-0.5">
                <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                {freshCount}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[85px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Summer</span>
              <span className="text-lg font-bold text-emerald-800">{summerOpenCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[85px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">6-Month</span>
              <span className="text-lg font-bold text-indigo-800">{sixMonthOpenCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[85px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">PPO / FTE</span>
              <span className="text-lg font-bold text-purple-800">{ppoOpenCount}</span>
            </div>
          </div>
        </div>

        {/* Live Sync Status Bar */}
        <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-stone-700">Official ATS Whitelist Verified: Workday, Greenhouse, Lever, Ashby, Eightfold</span>
            <span className="text-stone-300">•</span>
            <span className="text-stone-400 font-mono text-[11px]">Last sync: {formattedLastChecked}</span>
          </div>

          <button
            onClick={() => fetchLiveListings(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold cursor-pointer text-xs disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin text-amber-600' : 'text-stone-400'}`} />
            <span>{refreshing ? 'Rechecking ATS boards...' : 'Recheck Portals Now'}</span>
          </button>
        </div>
      </div>

      {/* Primary Role Type Tabs (Strict Separation of Live Openings vs Recently Closed) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {roleTypeTabs.map((tab) => {
          const isSelected = selectedRoleType === tab.id;
          const isClosedTab = tab.id === 'RECENTLY_CLOSED';

          return (
            <button
              key={tab.id}
              onClick={() => setSelectedRoleType(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                isSelected
                  ? isClosedTab
                    ? 'bg-rose-950 text-rose-100 border-rose-900 shadow-2xs'
                    : 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : isClosedTab
                  ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Secondary Controls: Search, Discipline Category, and Batch Filters */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Filter by company (Google, Microsoft, Rippling, Uber), role, or location (Bangalore, Pune)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
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
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8">
          <Building2 className="h-8 w-8 text-stone-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-stone-700">
            {selectedRoleType === 'RECENTLY_CLOSED'
              ? 'No recently closed postings recorded in the last 30 days.'
              : 'No active open postings match your criteria.'}
          </h4>
          <p className="text-xs text-stone-400 mt-1">
            {selectedRoleType === 'RECENTLY_CLOSED'
              ? 'Closed listings older than 30 days are automatically purged to keep data fresh.'
              : 'Try clearing your batch or discipline filters, or check the full live stream.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((listing) => {
            const isFresh = listing.isUrgentFresh;
            const isClosed = listing.status === 'closed';

            return (
              <div
                key={listing.id}
                className={`bg-white border rounded-xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative ${
                  isClosed
                    ? 'border-stone-200 bg-stone-50/40 opacity-90'
                    : isFresh
                    ? 'border-amber-400/90 hover:border-amber-500'
                    : 'border-stone-200/90 hover:border-stone-300'
                }`}
              >
                {/* Header Strip */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-[#fbfbfa] border border-stone-200/90 flex items-center justify-center text-stone-800 font-bold text-sm shrink-0 group-hover:border-amber-400 transition">
                        {listing.company.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide truncate">
                            {listing.company}
                          </span>
                          {!isClosed && (
                            <span title="Verified ATS Portal">
                              <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                            </span>
                          )}
                        </div>
                        <h3
                          onClick={() => setActiveModalListing(listing)}
                          className="text-sm font-bold text-stone-900 group-hover:text-amber-900 transition leading-snug line-clamp-1 cursor-pointer"
                        >
                          {listing.title}
                        </h3>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {isClosed ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold tracking-tight whitespace-nowrap shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Closed
                      </span>
                    ) : isFresh ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-bold tracking-tight whitespace-nowrap shrink-0 flex items-center gap-1 animate-pulse">
                        <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                        Closes Fast
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Live
                      </span>
                    )}
                  </div>

                  {/* Urgency Alert Bar */}
                  {isClosed ? (
                    <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200/80 text-[11px] text-rose-900 flex items-center gap-1.5 font-medium">
                      <Archive className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>{listing.closedAgoLabel || 'Application window closed'} • Requisition filled on ATS</span>
                    </div>
                  ) : isFresh ? (
                    <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/90 text-[11px] text-amber-950 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Posted {listing.postedAgoLabel} • Closes within 24–48h once capacity reached</span>
                    </div>
                  ) : null}

                  {/* Badges Row */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3 text-[11px]">
                    {!isClosed && (listing.eligibleBatches.includes(candidateTargetBatch) || listing.eligibleBatches.length === 0) && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 font-bold">
                        ⭐ Match (Batch {candidateTargetBatch})
                      </span>
                    )}
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
                    <span className="text-stone-400 font-medium">Status:</span>
                    <span className={`font-semibold ${isClosed ? 'text-rose-700' : 'text-stone-800'}`}>
                      {isClosed ? 'Requisition Closed' : listing.deadline}
                    </span>
                  </div>

                  {/* Real-World Action Buttons */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-stone-100 gap-2">
                    <button
                      onClick={() => setActiveModalListing(listing)}
                      className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 cursor-pointer flex items-center gap-0.5"
                    >
                      View Details <ChevronRight className="h-3 w-3" />
                    </button>

                    {isClosed ? (
                      <span className="text-[11px] text-stone-400 font-medium">
                        Drive Ended
                      </span>
                    ) : (
                      <a
                        href={listing.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-stone-900 hover:bg-black text-white text-[11px] font-bold transition shadow-2xs"
                      >
                        Apply on Portal <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
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
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    {activeModalListing.company}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold">
                    {activeModalListing.categoryLabel}
                  </span>
                  {activeModalListing.status === 'closed' ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                      🔴 Closed on ATS
                    </span>
                  ) : activeModalListing.isUrgentFresh ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                      🔥 Closes in 1-2 Days
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      ● Active Application Portal
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
              <div className="p-3.5 rounded-xl bg-[#f9fafb] border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Stipend Estimate</span>
                <span className="text-emerald-800 font-bold">{activeModalListing.stipend}</span>
              </div>
            </div>

            {/* Application Information Box */}
            <div className="space-y-4 text-xs text-stone-700 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
              <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                Application Details & Requisition Info
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <span className="text-stone-400 font-medium block">Role Classification:</span>
                  <span className="font-semibold text-stone-800">{activeModalListing.roleType}</span>
                </div>
                <div>
                  <span className="text-stone-400 font-medium block">Job Location:</span>
                  <span className="font-semibold text-stone-800">{activeModalListing.locations.join(', ')}</span>
                </div>
                <div>
                  <span className="text-stone-400 font-medium block">Required Education:</span>
                  <span className="font-semibold text-stone-800">{activeModalListing.degreeRequired}</span>
                </div>
                <div>
                  <span className="text-stone-400 font-medium block">Requisition Status:</span>
                  <span className="font-semibold text-stone-800">
                    {activeModalListing.status === 'closed'
                      ? 'Closed (Filled on ATS)'
                      : activeModalListing.deadline}
                  </span>
                </div>
              </div>
            </div>

            {/* Real-World Guidance Note */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-700" />
                <span>Real-World Application Guidance</span>
              </div>
              <p className="leading-relaxed">
                This opening is an official company portal requisition. Apply directly through the company’s official ATS careers page. Cold emailing an application without an explicit recruiter email is not recommended for portal postings. If you have an employee or alumni contact, use the referral option below.
              </p>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              {activeModalListing.status === 'open' ? (
                <>
                  <a
                    href={activeModalListing.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <span>Apply on Official Portal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <button
                    onClick={() => {
                      onSelectCompanyForPitch(activeModalListing.company, activeModalListing.title);
                      setActiveModalListing(null);
                    }}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5 text-stone-400" />
                    <span>Draft Referral Request Pitch</span>
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" /> This requisition has concluded and is no longer accepting applications.
                  </span>
                  <button
                    onClick={() => setActiveModalListing(null)}
                    className="py-2 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
