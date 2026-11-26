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
  CheckCircle2,
  Check,
  RotateCcw,
  Radar,
  EyeOff,
  Sparkles,
  LayoutGrid,
  Rows,
  Columns2,
} from 'lucide-react';

interface LiveOpeningsFeedProps {
  onSelectCompanyForPitch: (companyName: string, role: string) => void;
  candidateTargetBatch?: number;
  userId?: string;
  onStatsUpdate?: (stats: { openCount: number; freshCount: number }) => void;
  onApplicationLogged?: () => void;
}

type FeedView = 'active' | 'applied' | 'archived' | 'closed';

interface ToastNotice {
  message: string;
  undoAction?: () => void;
}

export const LiveOpeningsFeed: React.FC<LiveOpeningsFeedProps> = ({
  onSelectCompanyForPitch,
  candidateTargetBatch = 2028,
  userId,
  onStatsUpdate,
  onApplicationLogged,
}) => {
  const [liveListings, setLiveListings] = useState<LiveListingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastFetched, setLastFetched] = useState<string>('');

  // Primary Feed Section: Active Radar vs Applied vs Archived vs Closed
  const [feedView, setFeedView] = useState<FeedView>('active');

  // Persistence keys scoped per user
  const userPrefix = userId ? `autoreach_${userId}` : 'autoreach_guest';
  const ARCHIVE_KEY = `${userPrefix}_archived_jobs`;
  const APPLIED_KEY = `${userPrefix}_applied_jobs`;
  const APPLIED_META_KEY = `${userPrefix}_applied_meta`;
  const LAYOUT_PREF_KEY = `${userPrefix}_layout_mode`;

  // Layout mode: 'stacked' (Full-width bars on top, details below), 'split' (side-by-side), or 'grid' (classic cards)
  const [layoutMode, setLayoutMode] = useState<'stacked' | 'split' | 'grid'>(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_PREF_KEY);
      return saved === 'stacked' || saved === 'split' || saved === 'grid' ? saved : 'stacked';
    } catch {
      return 'stacked';
    }
  });

  const handleLayoutModeChange = (mode: 'stacked' | 'split' | 'grid') => {
    setLayoutMode(mode);
    try {
      localStorage.setItem(LAYOUT_PREF_KEY, mode);
    } catch {}
  };

  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null);

  // Archived & Applied state initialized from localStorage
  const [archivedIds, setArchivedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(ARCHIVE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [appliedIds, setAppliedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(APPLIED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [appliedMetadata, setAppliedMetadata] = useState<Record<string, { appliedAt: string; title?: string; company?: string }>>(() => {
    try {
      const stored = localStorage.getItem(APPLIED_META_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [toast, setToast] = useState<ToastNotice | null>(null);

  // Sync state when userId changes (e.g. login / logout)
  useEffect(() => {
    try {
      const storedArchived = localStorage.getItem(ARCHIVE_KEY);
      setArchivedIds(storedArchived ? JSON.parse(storedArchived) : []);

      const storedApplied = localStorage.getItem(APPLIED_KEY);
      setAppliedIds(storedApplied ? JSON.parse(storedApplied) : []);

      const storedMeta = localStorage.getItem(APPLIED_META_KEY);
      setAppliedMetadata(storedMeta ? JSON.parse(storedMeta) : {});
    } catch {
      // fallback
    }
  }, [ARCHIVE_KEY, APPLIED_KEY, APPLIED_META_KEY]);

  // Persist archivedIds
  useEffect(() => {
    try {
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archivedIds));
    } catch {}
  }, [archivedIds, ARCHIVE_KEY]);

  // Persist appliedIds & metadata
  useEffect(() => {
    try {
      localStorage.setItem(APPLIED_KEY, JSON.stringify(appliedIds));
      localStorage.setItem(APPLIED_META_KEY, JSON.stringify(appliedMetadata));
    } catch {}
  }, [appliedIds, appliedMetadata, APPLIED_KEY, APPLIED_META_KEY]);

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Active radar sub-filters
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

  // Sets for O(1) membership lookups
  const archivedIdSet = useMemo(() => new Set(archivedIds), [archivedIds]);
  const appliedIdSet = useMemo(() => new Set(appliedIds), [appliedIds]);

  // Partition Listings
  // 1. ACTIVE listings: open, NOT archived, NOT applied
  const activeListings = useMemo(() => {
    return liveListings.filter(
      (item) => item.status === 'open' && !archivedIdSet.has(item.id) && !appliedIdSet.has(item.id)
    );
  }, [liveListings, archivedIdSet, appliedIdSet]);

  // 2. APPLIED listings: marked applied
  const appliedListings = useMemo(() => {
    return liveListings.filter((item) => appliedIdSet.has(item.id));
  }, [liveListings, appliedIdSet]);

  // 3. ARCHIVED listings: marked archived / hidden
  const archivedListings = useMemo(() => {
    return liveListings.filter((item) => archivedIdSet.has(item.id));
  }, [liveListings, archivedIdSet]);

  // 4. CLOSED listings: status === 'closed' on official ATS
  const closedListings = useMemo(() => {
    return liveListings.filter(
      (item) => item.status === 'closed' && !archivedIdSet.has(item.id) && !appliedIdSet.has(item.id)
    );
  }, [liveListings, archivedIdSet, appliedIdSet]);

  // Dynamic metrics: Strictly exclude archived & applied from live counts!
  const activeOpenCount = activeListings.length;
  const activeFreshCount = useMemo(() => activeListings.filter((i) => i.isUrgentFresh).length, [activeListings]);
  const activeSummerCount = useMemo(() => activeListings.filter((i) => i.roleType === 'Summer Intern').length, [activeListings]);
  const activeSixMonthCount = useMemo(() => activeListings.filter((i) => i.roleType === '6-Month Intern').length, [activeListings]);
  const activePpoCount = useMemo(() => activeListings.filter((i) => i.roleType === 'PPO / Full-Time').length, [activeListings]);
  const activeMatchedCount = useMemo(() => {
    return activeListings.filter(
      (i) => i.eligibleBatches.includes(candidateTargetBatch) || i.eligibleBatches.length === 0
    ).length;
  }, [activeListings, candidateTargetBatch]);

  // Keep parent header widgets updated with active, deduplicated counts
  useEffect(() => {
    if (onStatsUpdate && activeOpenCount > 0) {
      onStatsUpdate({ openCount: activeOpenCount, freshCount: activeFreshCount });
    }
  }, [activeOpenCount, activeFreshCount, onStatsUpdate]);

  // Action: Archive a listing
  const handleArchiveListing = (listing: LiveListingItem) => {
    const prevArchived = [...archivedIds];
    const prevApplied = [...appliedIds];

    setArchivedIds((prev) => Array.from(new Set([...prev, listing.id])));
    setAppliedIds((prev) => prev.filter((id) => id !== listing.id));

    setToast({
      message: `Archived ${listing.company} (${listing.title}). Removed from live feed.`,
      undoAction: () => {
        setArchivedIds(prevArchived);
        setAppliedIds(prevApplied);
      },
    });

    if (activeModalListing?.id === listing.id) {
      setActiveModalListing(null);
    }

    if (selectedSplitId === listing.id) {
      const remaining = currentFeedListings.filter((l) => l.id !== listing.id);
      setSelectedSplitId(remaining[0]?.id || null);
    }
  };

  // Action: Unarchive / Restore a listing
  const handleUnarchiveListing = (listingId: string) => {
    const restoredItem = liveListings.find((l) => l.id === listingId);
    setArchivedIds((prev) => prev.filter((id) => id !== listingId));
    setToast({
      message: `Restored ${restoredItem?.company || 'listing'} back to Active Live Radar.`,
    });
  };

  // Action: Restore all archived listings
  const handleRestoreAllArchived = () => {
    const prevArchived = [...archivedIds];
    setArchivedIds([]);
    setToast({
      message: `All ${prevArchived.length} archived listings restored to Active Radar.`,
      undoAction: () => setArchivedIds(prevArchived),
    });
  };

  // Action: Mark as Applied
  const handleMarkApplied = async (listing: LiveListingItem) => {
    const prevApplied = [...appliedIds];
    const prevArchived = [...archivedIds];

    setAppliedIds((prev) => Array.from(new Set([...prev, listing.id])));
    setArchivedIds((prev) => prev.filter((id) => id !== listing.id));
    setAppliedMetadata((prev) => ({
      ...prev,
      [listing.id]: {
        appliedAt: new Date().toISOString(),
        title: listing.title,
        company: listing.company,
      },
    }));

    // Auto-record to user's pipeline if logged in
    if (userId) {
      try {
        await fetch('/api/applications/log-manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: listing.company,
            role: listing.title,
            recipientEmail: `careers@${listing.companySlug || 'ats-portal'}.com`,
            emailSubject: `Application: ${listing.title} at ${listing.company}`,
            emailBody: `Applied via official ATS careers portal: ${listing.url}`,
            jobType: listing.roleType,
            sourceType: 'PORTAL',
          }),
        });
        onApplicationLogged?.();
      } catch {
        // Log in background
      }
    }

    setToast({
      message: `Marked ${listing.company} as Applied! Moved to your Applied section.`,
      undoAction: () => {
        setAppliedIds(prevApplied);
        setArchivedIds(prevArchived);
      },
    });

    if (activeModalListing?.id === listing.id) {
      setActiveModalListing(null);
    }

    if (selectedSplitId === listing.id) {
      const remaining = currentFeedListings.filter((l) => l.id !== listing.id);
      setSelectedSplitId(remaining[0]?.id || null);
    }
  };

  // Action: Unmark Applied (Move back to Active)
  const handleUnmarkApplied = (listingId: string) => {
    const unappliedItem = liveListings.find((l) => l.id === listingId);
    setAppliedIds((prev) => prev.filter((id) => id !== listingId));
    setToast({
      message: `Moved ${unappliedItem?.company || 'listing'} back to Active Live Radar.`,
    });
  };

  // Role Type tabs under Active view
  const roleTypeTabs = [
    { id: 'ALL', label: `All Live Openings (${activeOpenCount})` },
    { id: 'MATCHED_FOR_ME', label: `⭐ Matched for Batch ${candidateTargetBatch} (${activeMatchedCount})` },
    { id: 'FRESH_URGENT', label: `🔥 Closes in 1-2 Days (${activeFreshCount})` },
    { id: 'Summer Intern', label: `☀️ Summer Internships (${activeSummerCount})` },
    { id: '6-Month Intern', label: `💼 6-Month Semester (${activeSixMonthCount})` },
    { id: 'PPO / Full-Time', label: `🚀 PPO & Full-Time (${activePpoCount})` },
  ];

  const categories = [
    { id: 'ALL', label: 'All Fields' },
    { id: 'swe', label: 'Software Eng (SWE)' },
    { id: 'data_ml', label: 'AI / ML & Data' },
    { id: 'quant', label: 'Quant & HFT' },
    { id: 'product', label: 'Product & PM' },
  ];

  const batches = ['ALL', '2028', '2027', '2026', '2025'];

  // Current display list depending on feedView
  const currentFeedListings = useMemo(() => {
    let sourceList: LiveListingItem[] = [];

    if (feedView === 'active') {
      sourceList = activeListings;
    } else if (feedView === 'applied') {
      sourceList = appliedListings;
    } else if (feedView === 'archived') {
      sourceList = archivedListings;
    } else if (feedView === 'closed') {
      sourceList = closedListings;
    }

    return sourceList.filter((item) => {
      // 1. Role Type sub-filter (only in active view)
      if (feedView === 'active') {
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
      if (feedView === 'closed') {
        return a.daysOld - b.daysOld;
      }
      if (feedView === 'applied') {
        const timeA = appliedMetadata[a.id]?.appliedAt || a.datePosted;
        const timeB = appliedMetadata[b.id]?.appliedAt || b.datePosted;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      }
      if (feedView === 'archived') {
        return a.company.localeCompare(b.company);
      }
      // Urgent fresh always first for active openings
      if (a.isUrgentFresh && !b.isUrgentFresh) return -1;
      if (!a.isUrgentFresh && b.isUrgentFresh) return 1;
      return a.hoursOld - b.hoursOld;
    });
  }, [
    feedView,
    activeListings,
    appliedListings,
    archivedListings,
    closedListings,
    selectedRoleType,
    selectedCategory,
    selectedBatch,
    searchQuery,
    candidateTargetBatch,
    appliedMetadata,
  ]);

  // Selected Listing for Option 2 Split-Pane Command Center
  const selectedSplitListing = useMemo(() => {
    if (!currentFeedListings.length) return null;
    if (selectedSplitId) {
      const found = currentFeedListings.find((l) => l.id === selectedSplitId);
      if (found) return found;
    }
    return currentFeedListings[0];
  }, [currentFeedListings, selectedSplitId]);

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
      {/* Toast Notice Bar with 1-Click Undo */}
      {toast && (
        <div className="bg-stone-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs animate-in slide-in-from-top duration-200 border border-stone-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="font-medium">{toast.message}</span>
          </div>
          {toast.undoAction && (
            <button
              onClick={() => {
                toast.undoAction?.();
                setToast(null);
              }}
              className="ml-4 px-2.5 py-1 rounded bg-amber-400 text-stone-950 font-bold hover:bg-amber-300 transition text-[11px] cursor-pointer"
            >
              Undo
            </button>
          )}
        </div>
      )}

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
              Top tech internship portals close within 24–48 hours of posting. Archive listings you don’t need, mark applied openings to keep your radar clean, and pitch hiring managers with 1 click.
            </p>
          </div>

          {/* Quick Metrics: Deducted dynamically when jobs are archived or marked applied */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto shrink-0">
            <div
              onClick={() => setFeedView('active')}
              className={`p-3 rounded-xl border text-center min-w-[85px] cursor-pointer transition ${
                feedView === 'active' ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30' : 'bg-[#fbfbfa] border-stone-200 hover:border-stone-300'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-0.5">Total Live</span>
              <span className="text-lg font-bold text-stone-900">{activeOpenCount}</span>
            </div>
            <div
              onClick={() => {
                setFeedView('active');
                setSelectedRoleType('FRESH_URGENT');
              }}
              className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-center min-w-[85px] cursor-pointer hover:border-amber-300 transition"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-0.5">Closes Fast</span>
              <span className="text-lg font-bold text-amber-900 flex items-center justify-center gap-0.5">
                <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                {activeFreshCount}
              </span>
            </div>
            <div
              onClick={() => {
                setFeedView('active');
                setSelectedRoleType('Summer Intern');
              }}
              className="p-3 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[85px] cursor-pointer hover:border-stone-300 transition"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Summer</span>
              <span className="text-lg font-bold text-emerald-800">{activeSummerCount}</span>
            </div>
            <div
              onClick={() => {
                setFeedView('active');
                setSelectedRoleType('6-Month Intern');
              }}
              className="p-3 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[85px] cursor-pointer hover:border-stone-300 transition"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">6-Month</span>
              <span className="text-lg font-bold text-indigo-800">{activeSixMonthCount}</span>
            </div>
            <div
              onClick={() => {
                setFeedView('active');
                setSelectedRoleType('PPO / Full-Time');
              }}
              className="p-3 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[85px] cursor-pointer hover:border-stone-300 transition"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">PPO / FTE</span>
              <span className="text-lg font-bold text-purple-800">{activePpoCount}</span>
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

      {/* MASTER FEED VIEW TOGGLE: Live Radar vs Applied vs Archived vs Closed */}
      <div className="bg-stone-100/90 p-1.5 rounded-2xl border border-stone-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setFeedView('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            feedView === 'active'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/70'
          }`}
        >
          <Radar className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Active Radar</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              feedView === 'active' ? 'bg-stone-800 text-stone-200' : 'bg-stone-200 text-stone-700'
            }`}
          >
            {activeOpenCount}
          </span>
        </button>

        <button
          onClick={() => setFeedView('applied')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            feedView === 'applied'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/70'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
          <span>Applied</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              feedView === 'applied' ? 'bg-emerald-900 text-emerald-100' : 'bg-stone-200 text-stone-700'
            }`}
          >
            {appliedIds.length}
          </span>
        </button>

        <button
          onClick={() => setFeedView('archived')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            feedView === 'archived'
              ? 'bg-amber-900 text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/70'
          }`}
        >
          <Archive className={`h-4 w-4 shrink-0 ${feedView === 'archived' ? 'text-amber-300' : 'text-stone-800'}`} />
          <span>Archived / Hidden</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              feedView === 'archived' ? 'bg-amber-950 text-amber-200' : 'bg-stone-200 text-stone-700'
            }`}
          >
            {archivedIds.length}
          </span>
        </button>

        <button
          onClick={() => setFeedView('closed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            feedView === 'closed'
              ? 'bg-rose-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/70'
          }`}
        >
          <Clock className="h-4 w-4 text-rose-300 shrink-0" />
          <span>Closed (&lt;30d)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              feedView === 'closed' ? 'bg-rose-950 text-rose-200' : 'bg-stone-200 text-stone-700'
            }`}
          >
            {closedListings.length}
          </span>
        </button>
      </div>

      {/* Section Explainer Banners */}
      {feedView === 'applied' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Applied Section ({appliedListings.length}):</strong> Openings you marked as applied are moved here so you don’t have to scroll past them again.
            </span>
          </div>
        </div>
      )}

      {feedView === 'archived' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-xs text-amber-950 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              <strong>Archived / Dismissed Openings ({archivedListings.length}):</strong> Hidden from your active radar and removed from the active live counter. Restore any listing at any time.
            </span>
          </div>
          {archivedListings.length > 0 && (
            <button
              onClick={handleRestoreAllArchived}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition cursor-pointer shadow-2xs"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Restore All to Active Feed</span>
            </button>
          )}
        </div>
      )}

      {/* Role Type Tabs (Visible only in Active Radar mode) */}
      {feedView === 'active' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {roleTypeTabs.map((tab) => {
            const isSelected = selectedRoleType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedRoleType(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Search, Discipline, and Batch Controls */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder={
              feedView === 'applied'
                ? 'Search applied applications by company, role, or city...'
                : feedView === 'archived'
                ? 'Search archived listings (Juspay, Philips)...'
                : 'Filter by company (Google, Microsoft, Rippling, Uber), role, or location (Bangalore, Pune)...'
            }
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

      {/* Quick Summary & Layout Mode Toggle */}
      <div className="flex items-center justify-between gap-3 text-xs flex-wrap px-0.5">
        <div className="flex items-center gap-2 text-stone-500 font-medium">
          <span className="font-bold text-stone-900">{currentFeedListings.length}</span>
          <span>
            {feedView === 'active'
              ? 'active ATS requisitions'
              : feedView === 'applied'
              ? 'applied applications'
              : feedView === 'archived'
              ? 'archived / hidden listings'
              : 'closed postings'}
          </span>
          {searchQuery && (
            <span className="text-stone-400 font-mono text-[11px] truncate max-w-xs">
              (matching &ldquo;{searchQuery}&rdquo;)
            </span>
          )}
        </div>

        {/* Layout Switcher: 3 Modes (Full-Width List, Side-by-Side Split, Card Grid) */}
        <div className="inline-flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 shadow-2xs flex-wrap">
          <button
            onClick={() => handleLayoutModeChange('stacked')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              layoutMode === 'stacked'
                ? 'bg-white text-stone-900 shadow-2xs border border-stone-200/90'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
            title="Full-Width List on top + Opening Dossier below"
          >
            <Rows className="h-3.5 w-3.5 text-stone-800" />
            <span>Full-Width List</span>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">Default</span>
          </button>
          <button
            onClick={() => handleLayoutModeChange('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              layoutMode === 'split'
                ? 'bg-white text-stone-900 shadow-2xs border border-stone-200/90'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
            title="Side-by-Side Split Command (Left Directory + Right Dossier)"
          >
            <Columns2 className="h-3.5 w-3.5 text-stone-700" />
            <span>Side-by-Side</span>
          </button>
          <button
            onClick={() => handleLayoutModeChange('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              layoutMode === 'grid'
                ? 'bg-white text-stone-900 shadow-2xs border border-stone-200/90'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
            title="Classic 3-Column Card Grid"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-stone-600" />
            <span>Card Grid</span>
          </button>
        </div>
      </div>

      {/* Listings Stream */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
          <div className="h-6 w-6 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-sm font-bold text-stone-700">Connecting to official ATS pipelines...</span>
        </div>
      ) : currentFeedListings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 space-y-2">
          {feedView === 'applied' ? (
            <>
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-base font-bold text-stone-800">No applications recorded yet.</h4>
              <p className="text-sm text-stone-600 max-w-md mx-auto">
                When you apply on a company’s portal, click the <strong>&ldquo;Applied&rdquo;</strong> button on their card in the Active Radar. It will move here so you never have to scroll past it again!
              </p>
            </>
          ) : feedView === 'archived' ? (
            <>
              <Archive className="h-10 w-10 text-amber-500 mx-auto mb-2" />
              <h4 className="text-base font-bold text-stone-800">No archived or hidden listings.</h4>
              <p className="text-sm text-stone-600 max-w-md mx-auto">
                Seeing companies you aren’t interested in (like Juspay)? Click the <strong>Archive</strong> icon to hide them and deduct them from your active count.
              </p>
            </>
          ) : feedView === 'closed' ? (
            <>
              <Clock className="h-10 w-10 text-stone-400 mx-auto mb-2" />
              <h4 className="text-base font-bold text-stone-700">No recently closed postings recorded in the last 30 days.</h4>
              <p className="text-sm text-stone-500">Closed listings are automatically tracked for retrospective reference.</p>
            </>
          ) : (
            <>
              <Building2 className="h-10 w-10 text-stone-400 mx-auto mb-2" />
              <h4 className="text-base font-bold text-stone-800">No active openings match your criteria.</h4>
              <p className="text-sm text-stone-500">Try clearing your search query or selecting a different role or batch filter.</p>
            </>
          )}
        </div>
      ) : layoutMode === 'stacked' ? (
        /* ========================================================================= */
        /* MODE 1: FULL-WIDTH STACKED VIEW (Wide Bars on top, Full Dossier below)   */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Top: Full-Width List of Wide Requisition Bars */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 text-sm">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <span className="text-base sm:text-lg">Scannable Directory</span>
                <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                  {currentFeedListings.length}
                </span>
              </div>
              <span className="text-stone-500 text-xs sm:text-sm font-semibold hidden sm:inline">
                Click any opening to inspect full dossier below ↓
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[520px] pr-2 scrollbar-thin">
              {currentFeedListings.map((listing) => {
                const isSelected = selectedSplitListing?.id === listing.id;
                const isItemApplied = appliedIdSet.has(listing.id);
                const isItemArchived = archivedIdSet.has(listing.id);
                const isItemClosed = listing.status === 'closed' || feedView === 'closed';
                const isItemFresh = listing.isUrgentFresh;

                return (
                  <div
                    key={listing.id}
                    onClick={() => setSelectedSplitId(listing.id)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer text-left relative group ${
                      isSelected
                        ? 'border-2 border-stone-900 bg-amber-50/30 shadow-xs ring-2 ring-stone-900/10'
                        : 'border-stone-200/90 hover:border-stone-400 bg-white hover:bg-stone-50/50'
                    }`}
                  >
                    {/* Header Strip: Company + Status / Stipend */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`h-8 w-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border transition ${
                            isSelected
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-stone-100 text-stone-900 border-stone-200 group-hover:border-stone-400'
                          }`}
                        >
                          {listing.company.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm sm:text-base font-extrabold text-stone-900 uppercase tracking-wide truncate">
                          {listing.company}
                        </span>
                        {!isItemClosed && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>Verified ATS</span>
                          </span>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isItemArchived ? (
                          <span className="text-xs font-bold text-stone-800 bg-stone-100 border border-stone-300 px-3 py-1 rounded-full flex items-center gap-1">
                            <EyeOff className="w-3.5 h-3.5" /> Hidden
                          </span>
                        ) : isItemApplied ? (
                          <span className="text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-700" /> Applied
                          </span>
                        ) : isItemClosed ? (
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                            Closed
                          </span>
                        ) : (
                          <span className="text-xs sm:text-sm font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300/80 px-3 py-1 rounded-full">
                            {listing.stipend}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Role Title with Large High-Legibility Font */}
                    <h4 className="font-extrabold text-base sm:text-lg text-stone-900 leading-snug group-hover:text-amber-950 transition">
                      {listing.title}
                    </h4>

                    {/* Specs Row with Bold Highlighted Batches */}
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-stone-600 mt-2 flex-wrap">
                      <span className="font-semibold text-stone-800">{listing.roleType}</span>
                      <span className="text-stone-300">•</span>
                      <span className="text-stone-700 font-medium">{listing.locations.join(', ') || 'India Multiple'}</span>
                      <span className="text-stone-300">•</span>
                      <span className="font-bold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-md border border-stone-300/80">
                        {listing.eligibleBatchesLabel}
                      </span>
                      {isItemFresh && !isItemApplied && !isItemArchived && !isItemClosed && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="text-amber-950 font-bold bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500" /> &lt;48h Fast Closing
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom: Full-Width Dossier Card */}
          {selectedSplitListing ? (
            <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-100 pb-5">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-stone-900 text-white font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-xs">
                        {selectedSplitListing.company.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm sm:text-base font-extrabold text-stone-800 uppercase tracking-wide">
                        {selectedSplitListing.company}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-2xs">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" /> Verified ATS • HTTP 200 Live
                      </span>
                      {appliedIdSet.has(selectedSplitListing.id) && (
                        <span className="text-xs sm:text-sm font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-md flex items-center gap-1.5 shadow-2xs">
                          <Check className="h-4 w-4 text-emerald-700" /> Applied by You
                        </span>
                      )}
                      {archivedIdSet.has(selectedSplitListing.id) && (
                        <span className="text-xs sm:text-sm font-bold text-stone-800 bg-stone-100 border border-stone-300 px-3 py-1 rounded-md flex items-center gap-1.5">
                          <EyeOff className="h-4 w-4 text-stone-600" /> Archived / Hidden
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-snug">
                      {selectedSplitListing.title}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-800 block">
                      {selectedSplitListing.stipend}
                    </span>
                    <span className="text-sm sm:text-base text-stone-600 font-semibold block mt-0.5">
                      {selectedSplitListing.roleType}
                    </span>
                  </div>
                </div>

                {/* 3 Key Specs at a Glance with High Legibility */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-sm">
                  <div className="p-4 rounded-xl bg-stone-50/90 border border-stone-200">
                    <span className="text-stone-500 block text-xs font-bold uppercase tracking-wider mb-1.5">
                      Locations
                    </span>
                    <span className="font-bold text-base text-stone-900 block truncate" title={selectedSplitListing.locations.join(', ')}>
                      {selectedSplitListing.locations.join(', ') || 'India Multiple'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50/90 border border-stone-200">
                    <span className="text-stone-500 block text-xs font-bold uppercase tracking-wider mb-1.5">
                      Eligible Batches
                    </span>
                    <span className="font-extrabold text-base text-stone-950 block truncate">
                      {selectedSplitListing.eligibleBatchesLabel}
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-xl border ${
                      selectedSplitListing.isUrgentFresh
                        ? 'bg-amber-50 border-amber-300/80'
                        : selectedSplitListing.status === 'closed'
                        ? 'bg-rose-50 border-rose-200'
                        : 'bg-emerald-50 border-emerald-300/80'
                    }`}
                  >
                    <span
                      className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                        selectedSplitListing.isUrgentFresh
                          ? 'text-amber-900'
                          : selectedSplitListing.status === 'closed'
                          ? 'text-rose-900'
                          : 'text-emerald-900'
                      }`}
                    >
                      Closing Window
                    </span>
                    <span
                      className={`font-black text-base block truncate ${
                        selectedSplitListing.isUrgentFresh
                          ? 'text-amber-950 flex items-center gap-1.5'
                          : selectedSplitListing.status === 'closed'
                          ? 'text-rose-900'
                          : 'text-emerald-900'
                      }`}
                    >
                      {selectedSplitListing.isUrgentFresh ? (
                        <>
                          <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
                          <span>Closes in 24–48h</span>
                        </>
                      ) : selectedSplitListing.status === 'closed' ? (
                        <span>Closed (Filled on ATS)</span>
                      ) : (
                        <span>Rolling Requisition</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Requisition Context & Education Fit */}
                <div className="space-y-3.5 text-sm text-stone-700 bg-[#faf9f6] p-5 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-stone-900 uppercase text-xs sm:text-sm tracking-wider">
                      Requisition Context & Core Fit:
                    </h4>
                    <span className="text-xs sm:text-sm font-mono text-stone-500 font-semibold">
                      Posted: {selectedSplitListing.postedAgoLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-700">
                    <div>
                      <span className="text-stone-500 font-medium block text-xs">Role Discipline:</span>
                      <span className="font-bold text-stone-900 text-sm sm:text-base">{selectedSplitListing.categoryLabel}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 font-medium block text-xs">Degree Requirement:</span>
                      <span className="font-bold text-stone-900 text-sm sm:text-base">{selectedSplitListing.degreeRequired}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Applied, Apply, Archive */}
              <div className="pt-5 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Archive / Restore Button */}
                {archivedIdSet.has(selectedSplitListing.id) ? (
                  <button
                    onClick={() => handleUnarchiveListing(selectedSplitListing.id)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <RotateCcw className="h-4 w-4 text-amber-300" />
                    <span>Restore to Feed</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleArchiveListing(selectedSplitListing)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                    title="Hide this listing and deduct from active count"
                  >
                    <Archive className="h-4 w-4 text-stone-800" />
                    <span>Dismiss / Archive ✕</span>
                  </button>
                )}

                {/* Right Actions: Pitch AI, Applied, Apply on ATS */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
                  {selectedSplitListing.status === 'open' && (
                    <button
                      onClick={() => onSelectCompanyForPitch(selectedSplitListing.company, selectedSplitListing.title)}
                      className="px-4 py-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
                      title="Generate an AI pitch or referral ask"
                    >
                      <Send className="h-4 w-4 text-stone-500" />
                      <span>Pitch AI</span>
                    </button>
                  )}

                  {appliedIdSet.has(selectedSplitListing.id) ? (
                    <button
                      onClick={() => handleUnmarkApplied(selectedSplitListing.id)}
                      className="px-5 py-3 rounded-xl border border-emerald-400 bg-emerald-100 text-emerald-950 font-bold text-sm hover:bg-emerald-200 transition cursor-pointer flex items-center gap-2 shadow-2xs"
                    >
                      <Check className="h-4 w-4 text-emerald-700" />
                      <span>Applied (Click to Unmark)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkApplied(selectedSplitListing)}
                      className="px-5 py-3 rounded-xl border border-emerald-400 bg-emerald-50 text-emerald-900 font-bold text-sm hover:bg-emerald-100 transition shadow-2xs cursor-pointer flex items-center gap-2"
                    >
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>Applied</span>
                    </button>
                  )}

                  <a
                    href={selectedSplitListing.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-sm flex items-center gap-2 transition shadow-xs cursor-pointer"
                  >
                    <span>Apply on Portal</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-500 text-sm">
              Select an opening from the directory above to view its full requisition dossier.
            </div>
          )}
        </div>
      ) : layoutMode === 'split' ? (
        /* ========================================================================= */
        /* MODE 2: SIDE-BY-SIDE SPLIT VIEW (Left: 5 cols List | Right: 7 cols Card)  */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px] items-start">
          {/* Left Column: 5 Cols Scannable Directory List */}
          <div className="lg:col-span-5 bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 font-bold text-stone-900">
                <span className="text-sm sm:text-base">Directory</span>
                <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                  {currentFeedListings.length}
                </span>
              </div>
              <span className="text-stone-500 text-xs font-semibold hidden sm:inline">
                Click any opening to view
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[720px] pr-1.5 scrollbar-thin">
              {currentFeedListings.map((listing) => {
                const isSelected = selectedSplitListing?.id === listing.id;
                const isItemApplied = appliedIdSet.has(listing.id);
                const isItemArchived = archivedIdSet.has(listing.id);
                const isItemClosed = listing.status === 'closed' || feedView === 'closed';
                const isItemFresh = listing.isUrgentFresh;

                return (
                  <div
                    key={listing.id}
                    onClick={() => setSelectedSplitId(listing.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative group ${
                      isSelected
                        ? 'border-2 border-stone-900 bg-amber-50/25 shadow-xs ring-1 ring-stone-900/10'
                        : 'border-stone-200/90 hover:border-stone-400 bg-white hover:bg-stone-50/50'
                    }`}
                  >
                    {/* Top Row: Company + Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`h-7 w-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border transition ${
                            isSelected
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-stone-100 text-stone-800 border-stone-200 group-hover:border-stone-400'
                          }`}
                        >
                          {listing.company.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-stone-800 uppercase tracking-wide truncate">
                          {listing.company}
                        </span>
                        {!isItemClosed && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0">
                            <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span>ATS</span>
                          </span>
                        )}
                      </div>

                      <div className="shrink-0">
                        {isItemArchived ? (
                          <span className="text-[11px] font-bold text-stone-700 bg-stone-100 border border-stone-300 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <EyeOff className="w-3 h-3" /> Hidden
                          </span>
                        ) : isItemApplied ? (
                          <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Check className="w-3 h-3 text-emerald-700" /> Applied
                          </span>
                        ) : isItemClosed ? (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            Closed
                          </span>
                        ) : (
                          <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                            {listing.stipend}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Role Title */}
                    <h4 className="font-bold text-sm sm:text-base text-stone-900 line-clamp-1 group-hover:text-amber-950 transition">
                      {listing.title}
                    </h4>

                    {/* Quick Specs Row with Highlighted Batches */}
                    <div className="flex items-center gap-2 text-xs text-stone-600 mt-2 flex-wrap">
                      <span className="font-medium text-stone-700">{listing.roleType}</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px] font-medium">{listing.locations[0] || 'India'}</span>
                      <span>•</span>
                      <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-300/80">
                        {listing.eligibleBatchesLabel}
                      </span>
                      {isItemFresh && !isItemApplied && !isItemArchived && !isItemClosed && (
                        <>
                          <span>•</span>
                          <span className="text-amber-950 font-bold flex items-center gap-0.5 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                            <Flame className="w-3 h-3 text-orange-600 fill-orange-500" /> &lt;48h
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: 7 Cols Sticky Requisition Dossier */}
          <div className="lg:col-span-7">
            {selectedSplitListing ? (
              <div className="sticky top-20 bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between max-h-[750px] overflow-y-auto space-y-6">
                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="h-9 w-9 rounded-lg bg-stone-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {selectedSplitListing.company.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-extrabold text-stone-700 uppercase tracking-wide">
                          {selectedSplitListing.company}
                        </span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified ATS • HTTP 200 Live
                        </span>
                        {appliedIdSet.has(selectedSplitListing.id) && (
                          <span className="text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                            <Check className="h-3.5 w-3.5 text-emerald-700" /> Applied
                          </span>
                        )}
                        {archivedIdSet.has(selectedSplitListing.id) && (
                          <span className="text-xs font-bold text-stone-800 bg-stone-100 border border-stone-300 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                            <EyeOff className="h-3.5 w-3.5 text-stone-600" /> Archived / Hidden
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-1">
                        {selectedSplitListing.title}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xl sm:text-2xl font-black text-emerald-800 block">
                        {selectedSplitListing.stipend}
                      </span>
                      <span className="text-xs sm:text-sm text-stone-600 font-semibold">
                        {selectedSplitListing.roleType}
                      </span>
                    </div>
                  </div>

                  {/* 3 Key Specs at a Glance with High Legibility */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200">
                      <span className="text-stone-500 block text-xs font-bold uppercase tracking-wider mb-1">
                        Locations
                      </span>
                      <span className="font-bold text-stone-900 block truncate" title={selectedSplitListing.locations.join(', ')}>
                        {selectedSplitListing.locations.join(', ') || 'India Multiple'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200">
                      <span className="text-stone-500 block text-xs font-bold uppercase tracking-wider mb-1">
                        Eligible Batches
                      </span>
                      <span className="font-extrabold text-stone-950 block truncate">
                        {selectedSplitListing.eligibleBatchesLabel}
                      </span>
                    </div>

                    <div
                      className={`p-3.5 rounded-xl border ${
                        selectedSplitListing.isUrgentFresh
                          ? 'bg-amber-50/90 border-amber-300/80'
                          : selectedSplitListing.status === 'closed'
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-emerald-50/80 border-emerald-300/80'
                      }`}
                    >
                      <span
                        className={`block text-xs font-bold uppercase tracking-wider mb-1 ${
                          selectedSplitListing.isUrgentFresh
                            ? 'text-amber-900'
                            : selectedSplitListing.status === 'closed'
                            ? 'text-rose-900'
                            : 'text-emerald-900'
                        }`}
                      >
                        Closing Window
                      </span>
                      <span
                        className={`font-black block truncate ${
                          selectedSplitListing.isUrgentFresh
                            ? 'text-amber-950 flex items-center gap-1'
                            : selectedSplitListing.status === 'closed'
                            ? 'text-rose-900'
                            : 'text-emerald-900'
                        }`}
                      >
                        {selectedSplitListing.isUrgentFresh ? (
                          <>
                            <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
                            <span>Closes in 24–48h</span>
                          </>
                        ) : selectedSplitListing.status === 'closed' ? (
                          <span>Closed (Filled on ATS)</span>
                        ) : (
                          <span>Rolling Requisition</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Requisition Context & Education Fit */}
                  <div className="space-y-3 text-sm text-stone-700 bg-[#faf9f6] p-4 sm:p-5 rounded-xl border border-stone-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-stone-900 uppercase text-xs sm:text-sm tracking-wider">
                        Requisition Context & Core Fit:
                      </h4>
                      <span className="text-xs font-mono text-stone-500 font-semibold">
                        Posted: {selectedSplitListing.postedAgoLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-stone-700">
                      <div>
                        <span className="text-stone-500 font-medium block text-xs">Role Discipline:</span>
                        <span className="font-bold text-stone-900 text-sm sm:text-base">{selectedSplitListing.categoryLabel}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 font-medium block text-xs">Degree Requirement:</span>
                        <span className="font-bold text-stone-900 text-sm sm:text-base">{selectedSplitListing.degreeRequired}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Bottom Actions */}
                <div className="pt-5 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Archive / Restore Button */}
                  {archivedIdSet.has(selectedSplitListing.id) ? (
                    <button
                      onClick={() => handleUnarchiveListing(selectedSplitListing.id)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-sm transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <RotateCcw className="h-4 w-4 text-amber-300" />
                      <span>Restore to Feed</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArchiveListing(selectedSplitListing)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-sm transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      title="Hide this listing and deduct from active count"
                    >
                      <Archive className="h-4 w-4 text-stone-800" />
                      <span>Dismiss / Archive ✕</span>
                    </button>
                  )}

                  {/* Right Actions: Pitch AI, Applied, Apply on ATS */}
                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                    {selectedSplitListing.status === 'open' && (
                      <button
                        onClick={() => onSelectCompanyForPitch(selectedSplitListing.company, selectedSplitListing.title)}
                        className="px-3.5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        title="Generate an AI pitch or referral ask"
                      >
                        <Send className="h-4 w-4 text-stone-500" />
                        <span>Pitch AI</span>
                      </button>
                    )}

                    {appliedIdSet.has(selectedSplitListing.id) ? (
                      <button
                        onClick={() => handleUnmarkApplied(selectedSplitListing.id)}
                        className="px-4 py-2.5 rounded-xl border border-emerald-400 bg-emerald-100 text-emerald-950 font-bold text-sm hover:bg-emerald-200 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="h-4 w-4 text-emerald-700" />
                        <span>Applied (Click to Unmark)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkApplied(selectedSplitListing)}
                        className="px-4 py-2.5 rounded-xl border border-emerald-400 bg-emerald-50 text-emerald-900 font-bold text-sm hover:bg-emerald-100 transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span>Applied</span>
                      </button>
                    )}

                    <a
                      href={selectedSplitListing.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-sm flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                    >
                      <span>Apply on Portal</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-500 text-sm">
                Select an opening on the left to inspect requisition details.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentFeedListings.map((listing) => {
            const isFresh = listing.isUrgentFresh;
            const isClosed = listing.status === 'closed' || feedView === 'closed';
            const isApplied = appliedIdSet.has(listing.id);
            const isArchived = archivedIdSet.has(listing.id);

            return (
              <div
                key={listing.id}
                className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative ${
                  isArchived
                    ? 'border-stone-200 bg-stone-50/50 opacity-90'
                    : isApplied
                    ? 'border-emerald-300/80 bg-emerald-50/20'
                    : isClosed
                    ? 'border-stone-200 bg-stone-50/40 opacity-90'
                    : isFresh
                    ? 'border-amber-400/90 hover:border-amber-500'
                    : 'border-stone-200/90 hover:border-stone-300'
                }`}
              >
                {/* Header Strip */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-stone-100 border border-stone-200/90 flex items-center justify-center text-stone-900 font-bold text-sm shrink-0 group-hover:border-amber-400 transition">
                        {listing.company.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-stone-500 uppercase tracking-wide truncate">
                            {listing.company}
                          </span>
                          {!isClosed && (
                            <span
                              title="Verified Active Requisition on Company Career Portal"
                              className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded"
                            >
                              <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                              <span>Verified ATS</span>
                            </span>
                          )}
                        </div>
                        <h3
                          onClick={() => setActiveModalListing(listing)}
                          className="text-base font-bold text-stone-900 group-hover:text-amber-900 transition leading-snug line-clamp-1 cursor-pointer mt-0.5"
                        >
                          {listing.title}
                        </h3>
                      </div>
                    </div>

                    {/* Status Pill & Dark Gray Archive Button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isArchived ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-300 text-xs font-semibold flex items-center gap-1">
                          <EyeOff className="w-3.5 h-3.5 text-stone-700" />
                          Hidden
                        </span>
                      ) : isApplied ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Applied
                        </span>
                      ) : isClosed ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Closed
                        </span>
                      ) : isFresh ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold flex items-center gap-1 animate-pulse">
                          <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          Closes Fast
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Live
                        </span>
                      )}

                      {/* 1-Click Dark Gray / Black Archive Button */}
                      {!isArchived && feedView === 'active' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveListing(listing);
                          }}
                          title="Archive / Hide this listing (removes from feed)"
                          className="p-1.5 rounded-lg text-stone-800 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                        >
                          <Archive className="h-3.5 w-3.5 text-stone-800 shrink-0" />
                          <span className="text-[11px] font-bold text-stone-800 hidden 2xl:inline">Archive</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Urgency Alert Bar */}
                  {isArchived ? (
                    <div className="mb-3 px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-200 text-xs text-stone-800 flex items-center justify-between font-medium">
                      <span className="flex items-center gap-1.5">
                        <Archive className="w-3.5 h-3.5 text-stone-700 shrink-0" />
                        Dismissed from live radar
                      </span>
                      <button
                        onClick={() => handleUnarchiveListing(listing.id)}
                        className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                      >
                        Restore
                      </button>
                    </div>
                  ) : isApplied ? (
                    <div className="mb-3 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between font-medium">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Applied via official ATS portal
                      </span>
                      <button
                        onClick={() => handleUnmarkApplied(listing.id)}
                        className="text-emerald-700 hover:text-emerald-950 font-bold underline cursor-pointer"
                      >
                        Unmark
                      </button>
                    </div>
                  ) : isClosed ? (
                    <div className="mb-3 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200/80 text-xs text-rose-900 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{listing.closedAgoLabel || 'Application window closed'} • Requisition filled on ATS</span>
                    </div>
                  ) : isFresh ? (
                    <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/90 text-xs text-amber-950 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Posted {listing.postedAgoLabel} • Closes within 24–48h once capacity reached</span>
                    </div>
                  ) : null}

                  {/* Badges Row */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3.5 text-xs">
                    {!isClosed && (listing.eligibleBatches.includes(candidateTargetBatch) || listing.eligibleBatches.length === 0) && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[11px]">
                        ⭐ Match (Batch {candidateTargetBatch})
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold text-[11px]">
                      {listing.roleType}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[11px]">
                      {listing.categoryLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 flex items-center gap-1 text-[11px]">
                      <MapPin className="h-3 w-3 text-stone-400" />
                      {listing.locations[0] || 'India'}
                    </span>
                  </div>
                </div>

                {/* Details Footer: Clean 2-Column Grid (No Vertical Tightness) */}
                <div className="grid grid-cols-2 gap-2.5 py-3 border-t border-stone-100 text-xs">
                  <div>
                    <span className="text-stone-400 font-medium text-[11px] block">Stipend:</span>
                    <span className="font-bold text-emerald-800 text-xs truncate block">{listing.stipend}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-medium text-[11px] block">Eligible:</span>
                    <span className="font-semibold text-stone-800 text-xs truncate block">{listing.eligibleBatchesLabel}</span>
                  </div>
                </div>

                {/* Real-World Action Buttons with I Applied, Portal Link, & Details */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-100 gap-2">
                  <button
                    onClick={() => setActiveModalListing(listing)}
                    className="text-xs font-semibold text-stone-500 hover:text-stone-900 cursor-pointer flex items-center gap-0.5"
                  >
                    Details <ChevronRight className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    {isArchived ? (
                      <button
                        onClick={() => handleUnarchiveListing(listing.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-amber-300" /> Restore to Feed
                      </button>
                    ) : isApplied ? (
                      <>
                        <button
                          onClick={() => onSelectCompanyForPitch(listing.company, listing.title)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition cursor-pointer"
                          title="Draft email pitch or referral bump"
                        >
                          <Send className="h-3 w-3 text-stone-400" /> Pitch AI
                        </button>
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-bold transition shadow-2xs"
                        >
                          Portal <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    ) : isClosed ? (
                      <span className="text-xs text-stone-400 font-medium">
                        Drive Ended
                      </span>
                    ) : (
                      <>
                        {/* 1-Click "Applied" Button */}
                        <button
                          onClick={() => handleMarkApplied(listing)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition shadow-2xs cursor-pointer"
                          title="Mark that you submitted an application on the portal"
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Applied</span>
                        </button>

                        {/* Direct Official ATS Portal Application Link */}
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-bold transition shadow-2xs"
                        >
                          <span>Apply</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </>
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    {activeModalListing.company}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold">
                    {activeModalListing.categoryLabel}
                  </span>
                  {appliedIdSet.has(activeModalListing.id) ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Applied by Candidate
                    </span>
                  ) : archivedIdSet.has(activeModalListing.id) ? (
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-300 text-[10px] font-semibold flex items-center gap-1">
                      <Archive className="w-3 h-3 text-stone-500" /> Archived / Hidden
                    </span>
                  ) : activeModalListing.status === 'closed' ? (
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

            {/* ATS Verification Heartbeat Badge */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Official ATS Requisition:</strong> Verified active on career portal
                </span>
              </div>
              <span className="font-mono text-[11px] text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300">
                HTTP 200 OK • Live
              </span>
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

            {/* Modal Quick Actions: Applied Toggle & Archive Toggle */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-stone-600">
                <span className="font-bold text-stone-800 block">Candidate Tracking Status:</span>
                <span>Manage this opening in your personal radar</span>
              </div>
              <div className="flex items-center gap-2">
                {appliedIdSet.has(activeModalListing.id) ? (
                  <button
                    onClick={() => handleUnmarkApplied(activeModalListing.id)}
                    className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-100 text-emerald-900 font-bold text-xs hover:bg-emerald-200 transition cursor-pointer"
                  >
                    ✓ Applied (Click to Unmark)
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkApplied(activeModalListing)}
                    className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition cursor-pointer"
                  >
                    ✓ Applied
                  </button>
                )}

                {archivedIdSet.has(activeModalListing.id) ? (
                  <button
                    onClick={() => handleUnarchiveListing(activeModalListing.id)}
                    className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 font-bold text-xs hover:bg-amber-100 transition cursor-pointer"
                  >
                    Restore to Feed
                  </button>
                ) : (
                  <button
                    onClick={() => handleArchiveListing(activeModalListing)}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-100 text-stone-800 font-bold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Archive className="h-3.5 w-3.5 text-stone-800" />
                    <span>Archive / Hide</span>
                  </button>
                )}
              </div>
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
