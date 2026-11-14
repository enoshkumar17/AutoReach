export interface EnrichedMetadata {
  eligible_batches?: number[];
  degree?: string;
  duration_months?: number;
  term?: string;
  stipend?: string | null;
  model?: string;
}

export interface RawSarthzkListing {
  id: string;
  company: string;
  company_slug: string;
  title: string;
  category: string;
  locations: string[];
  date_posted?: string;
  first_seen?: string;
  last_seen?: string;
  external_id?: string;
  status: string;
  url: string;
  source?: string;
  is_remote?: boolean;
  closed_at?: string | null;
  enrichment?: EnrichedMetadata | null;
}

export interface LiveListingItem {
  id: string;
  company: string;
  companySlug: string;
  title: string;
  category: 'swe' | 'data_ml' | 'quant' | 'hardware' | 'product' | 'general';
  categoryLabel: string;
  roleType: 'Summer Intern' | '6-Month Intern' | 'PPO / Full-Time' | 'Internship';
  locations: string[];
  datePosted: string;
  postedAgoLabel: string;
  hoursOld: number;
  daysOld: number;
  isUrgentFresh: boolean; // Posted within last 48 hours
  deadline: string;
  eligibleBatches: number[];
  eligibleBatchesLabel: string;
  degreeRequired: string;
  durationMonths: number | null;
  stipend: string;
  url: string;
  source: 'direct_ats' | 'official_feed';
  status: 'open' | 'closed';
}

// In-memory cache for ultra-fast queries
let cachedListings: LiveListingItem[] = [];
let lastFetchedAt: Date | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

// Helper to calculate hours/days ago
function calculateAge(dateStr?: string, fallbackIso?: string): { hours: number; days: number; label: string } {
  const targetDate = dateStr ? new Date(dateStr) : (fallbackIso ? new Date(fallbackIso) : new Date());
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - targetDate.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let label = 'Recently';
  if (hours < 1) {
    label = 'Just now';
  } else if (hours < 24) {
    label = `${hours}h ago`;
  } else if (days === 1) {
    label = 'Yesterday';
  } else if (days < 30) {
    label = `${days}d ago`;
  } else {
    label = `${Math.floor(days / 30)}mo ago`;
  }

  return { hours, days, label };
}

// Map categories to friendly labels
function mapCategory(catRaw?: string): { category: LiveListingItem['category']; label: string } {
  const c = (catRaw || '').toLowerCase();
  if (c.includes('swe') || c.includes('software') || c.includes('backend') || c.includes('frontend') || c.includes('dev')) {
    return { category: 'swe', label: 'Software Engineering' };
  }
  if (c.includes('data') || c.includes('ml') || c.includes('ai') || c.includes('machine learning')) {
    return { category: 'data_ml', label: 'Data & AI / ML' };
  }
  if (c.includes('quant') || c.includes('trading')) {
    return { category: 'quant', label: 'Quant & High-Frequency' };
  }
  if (c.includes('product') || c.includes('pm')) {
    return { category: 'product', label: 'Product' };
  }
  if (c.includes('hardware') || c.includes('silicon') || c.includes('vlsi') || c.includes('embedded')) {
    return { category: 'hardware', label: 'Hardware & Systems' };
  }
  return { category: 'general', label: 'Tech & Engineering' };
}

// Determine role type (Summer, 6-month, PPO, or Full-time)
function determineRoleType(title: string, durationMonths?: number | null, term?: string): LiveListingItem['roleType'] {
  const t = title.toLowerCase();
  const tm = (term || '').toLowerCase();

  if (t.includes('6-month') || t.includes('6 month') || (durationMonths && durationMonths >= 5 && durationMonths <= 6)) {
    return '6-Month Intern';
  }
  if (tm.includes('summer') || (durationMonths && durationMonths <= 3) || t.includes('summer')) {
    return 'Summer Intern';
  }
  if (t.includes('full-time') || t.includes('full time') || t.includes('graduate') || t.includes('engineer i')) {
    return 'PPO / Full-Time';
  }
  return 'Internship';
}

/**
 * Fetch direct postings from Juspay's live career opening API
 */
async function fetchDirectJuspayListings(): Promise<LiveListingItem[]> {
  try {
    const res = await fetch('https://joinus.juspay.in/api/careerJobOpening', {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AutoReach/2.5',
      },
    });

    if (!res.ok) return [];
    const data: any = await res.json();
    const jobs = data?.allJobs;
    if (!Array.isArray(jobs)) return [];

    const activeTech = jobs.filter((j: any) => j.opening_status === true && (j.category === 'Engineering' || j.job_type === 'Intern' || j.job_title?.toLowerCase().includes('engineer') || j.job_title?.toLowerCase().includes('intern')));

    return activeTech.map((j: any) => {
      const isIntern = j.job_type?.toLowerCase().includes('intern') || j.job_title?.toLowerCase().includes('intern');
      const roleType: LiveListingItem['roleType'] = isIntern ? 'Summer Intern' : 'PPO / Full-Time';
      const age = calculateAge(undefined, new Date().toISOString());

      return {
        id: `direct:juspay:${j.job_id || Math.random().toString(36).slice(2)}`,
        company: 'Juspay',
        companySlug: 'juspay',
        title: j.job_title || 'Software Development Engineer',
        category: 'swe',
        categoryLabel: 'Software Engineering',
        roleType: roleType,
        locations: [j.job_location || 'Bangalore, India'],
        datePosted: new Date().toISOString().split('T')[0],
        postedAgoLabel: 'Live Active',
        hoursOld: 1,
        daysOld: 0,
        isUrgentFresh: true,
        deadline: 'Rolling (Closes when filled)',
        eligibleBatches: [2025, 2026, 2027],
        eligibleBatchesLabel: 'Batch 2025, 2026, 2027',
        degreeRequired: 'B.Tech / BE / ME / MCA',
        durationMonths: isIntern ? 3 : null,
        stipend: isIntern ? '₹40,000/mo + PPO opportunity' : 'Competitive CTC (₹20L+)',
        url: 'https://joinus.juspay.in/careers',
        source: 'direct_ats',
        status: 'open',
      };
    });
  } catch (err: any) {
    console.warn(`[LiveTracker] Juspay direct fetch notice: ${err.message}`);
    return [];
  }
}

/**
 * Fetch verified canonical tech postings from Sarthzk/internship-tracker
 */
async function fetchCanonicalListings(): Promise<LiveListingItem[]> {
  try {
    const res = await fetch('https://raw.githubusercontent.com/Sarthzk/internship-tracker/main/data/listings.json', {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AutoReach/2.5',
      },
    });

    if (!res.ok) return [];
    const rawList: RawSarthzkListing[] = (await res.json()) as RawSarthzkListing[];
    if (!Array.isArray(rawList)) return [];

    return rawList.map((item) => {
      const age = calculateAge(item.date_posted, item.first_seen);
      const isUrgentFresh = age.hours <= 48 && item.status === 'open';
      const catInfo = mapCategory(item.category || item.title);
      const duration = item.enrichment?.duration_months || null;
      const roleType = determineRoleType(item.title, duration, item.enrichment?.term);

      const batches = Array.isArray(item.enrichment?.eligible_batches) && item.enrichment!.eligible_batches.length > 0
        ? item.enrichment!.eligible_batches
        : [2026, 2027]; // Tech internships in India currently recruit 2026/2027 batches

      const batchesLabel = batches.map((b) => `Batch ${b}`).join(', ');

      let deadline = 'Rolling (Closes in 24-48h once full)';
      if (item.status === 'closed') {
        deadline = 'Closed';
      }

      let stipend = item.enrichment?.stipend || 'Competitive (Standard Industry Stipend)';
      if (!stipend || stipend === 'null') {
        stipend = 'Competitive';
      }

      return {
        id: item.id || `feed:${item.company_slug}:${item.external_id || Math.random().toString(36).slice(2)}`,
        company: item.company,
        companySlug: item.company_slug,
        title: item.title,
        category: catInfo.category,
        categoryLabel: catInfo.label,
        roleType: roleType,
        locations: Array.isArray(item.locations) && item.locations.length > 0 ? item.locations : ['India (Bangalore / Hyderabad)'],
        datePosted: item.date_posted || (item.first_seen ? item.first_seen.split('T')[0] : 'Recent'),
        postedAgoLabel: age.label,
        hoursOld: age.hours,
        daysOld: age.days,
        isUrgentFresh: isUrgentFresh,
        deadline: deadline,
        eligibleBatches: batches,
        eligibleBatchesLabel: batchesLabel,
        degreeRequired: item.enrichment?.degree || "Bachelor's / Master's degree in CS or related",
        durationMonths: duration,
        stipend: stipend,
        url: item.url,
        source: 'official_feed',
        status: item.status === 'open' ? 'open' : 'closed',
      };
    });
  } catch (err: any) {
    console.warn(`[LiveTracker] Canonical feed fetch notice: ${err.message}`);
    return [];
  }
}

/**
 * Sync all live listings, deduplicate, prioritize open & fresh listings, and cache
 */
export async function syncLiveListings(forceRefresh = false): Promise<LiveListingItem[]> {
  const isCacheValid = cachedListings.length > 0 && lastFetchedAt && (Date.now() - lastFetchedAt.getTime() < CACHE_TTL_MS);

  if (!forceRefresh && isCacheValid) {
    return cachedListings;
  }

  console.log('[LiveTracker] Fetching fresh live tech postings across India...');

  const [juspayListings, canonicalListings] = await Promise.all([
    fetchDirectJuspayListings(),
    fetchCanonicalListings(),
  ]);

  // Combine and deduplicate by company + role title
  const combined = [...juspayListings, ...canonicalListings];
  const seenKeys = new Set<string>();
  const deduplicated: LiveListingItem[] = [];

  for (const item of combined) {
    const key = `${item.company.toLowerCase()}:${item.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduplicated.push(item);
    }
  }

  // Sort:
  // 1. Open status first
  // 2. Urgent fresh (<48h) first
  // 3. Newer date posted
  deduplicated.sort((a, b) => {
    if (a.status === 'open' && b.status !== 'open') return -1;
    if (a.status !== 'open' && b.status === 'open') return 1;

    if (a.isUrgentFresh && !b.isUrgentFresh) return -1;
    if (!a.isUrgentFresh && b.isUrgentFresh) return 1;

    return a.hoursOld - b.hoursOld;
  });

  cachedListings = deduplicated;
  lastFetchedAt = new Date();

  console.log(`[LiveTracker] Successfully synced ${cachedListings.length} tech postings (${cachedListings.filter(l => l.status === 'open').length} open, ${cachedListings.filter(l => l.isUrgentFresh).length} fresh in <48h).`);

  return cachedListings;
}

export interface ListingsQueryOptions {
  q?: string;
  batch?: string;
  category?: string;
  freshOnly?: boolean;
  status?: string;
}

export async function getLiveListings(options: ListingsQueryOptions = {}) {
  const all = await syncLiveListings(false);

  let filtered = all;

  // Filter by status (default to open)
  if (options.status) {
    filtered = filtered.filter((item) => item.status === options.status);
  } else {
    // By default, show open listings first, closed at the end
    // Or if freshOnly is true, only show open listings
  }

  // Filter by fresh only (< 48 hrs)
  if (options.freshOnly) {
    filtered = filtered.filter((item) => item.isUrgentFresh && item.status === 'open');
  }

  // Filter by graduation batch (e.g., 2026, 2027)
  if (options.batch) {
    const batchYear = parseInt(options.batch, 10);
    if (!isNaN(batchYear)) {
      filtered = filtered.filter((item) => item.eligibleBatches.includes(batchYear));
    }
  }

  // Filter by category
  if (options.category && options.category !== 'all') {
    filtered = filtered.filter((item) => item.category === options.category);
  }

  // Filter by search query (company or role or location)
  if (options.q && options.q.trim()) {
    const query = options.q.toLowerCase().trim();
    filtered = filtered.filter((item) =>
      item.company.toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query) ||
      item.locations.some((l) => l.toLowerCase().includes(query)) ||
      item.categoryLabel.toLowerCase().includes(query)
    );
  }

  const openCount = all.filter((i) => i.status === 'open').length;
  const freshCount = all.filter((i) => i.isUrgentFresh && i.status === 'open').length;

  return {
    total: filtered.length,
    totalAll: all.length,
    openCount,
    freshCount,
    lastFetchedAt: lastFetchedAt?.toISOString() || new Date().toISOString(),
    listings: filtered,
  };
}
