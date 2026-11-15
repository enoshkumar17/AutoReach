import React, { useState, useMemo } from 'react';
import { ALL_FLAGSHIP_HACKATHONS, type HackathonItem } from '../data/hiringData';
import {
  Search,
  Trophy,
  ExternalLink,
  Send,
  X,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';

interface HackathonsDirectoryProps {
  onSelectCompanyForPitch: (companyName: string, role: string) => void;
}

export const HackathonsDirectory: React.FC<HackathonsDirectoryProps> = ({
  onSelectCompanyForPitch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeModalHackathon, setActiveModalHackathon] = useState<HackathonItem | null>(null);

  const categories = [
    { id: 'ALL', label: 'All Hackathons', count: ALL_FLAGSHIP_HACKATHONS.length },
    {
      id: 'Hiring & PPI Challenge',
      label: '⚡ Direct PPI & Hiring Challenges',
      count: ALL_FLAGSHIP_HACKATHONS.filter((h) => h.category === 'Hiring & PPI Challenge').length,
    },
    {
      id: 'Women in Tech & Diversity',
      label: '👩‍💻 Women in Tech & Diversity',
      count: ALL_FLAGSHIP_HACKATHONS.filter((h) => h.category === 'Women in Tech & Diversity').length,
    },
    {
      id: 'Global Cup',
      label: '🏆 National & Global Cups',
      count: ALL_FLAGSHIP_HACKATHONS.filter((h) => h.category === 'Global Cup').length,
    },
    {
      id: 'Ideation & Prototyping',
      label: '💡 Ideation & Prototyping',
      count: ALL_FLAGSHIP_HACKATHONS.filter((h) => h.category === 'Ideation & Prototyping').length,
    },
  ];

  const filteredHackathons = useMemo(() => {
    return ALL_FLAGSHIP_HACKATHONS.filter((h) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.company.toLowerCase().includes(q) ||
        h.overview.toLowerCase().includes(q) ||
        h.rewards.toLowerCase().includes(q) ||
        h.targetBatches.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === 'ALL' || h.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'OPEN_NOW' && h.status === 'OPEN_NOW') ||
        (selectedStatus === 'UPCOMING_SOON' && h.status === 'UPCOMING_SOON');

      return matchesSearch && matchesCat && matchesStatus;
    }).sort((a, b) => {
      if (a.status === 'OPEN_NOW' && b.status !== 'OPEN_NOW') return -1;
      if (a.status !== 'OPEN_NOW' && b.status === 'OPEN_NOW') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, selectedCategory, selectedStatus]);

  const openNowCount = ALL_FLAGSHIP_HACKATHONS.filter((h) => h.status === 'OPEN_NOW').length;
  const upcomingCount = ALL_FLAGSHIP_HACKATHONS.filter((h) => h.status === 'UPCOMING_SOON').length;

  return (
    <div className="space-y-6 pb-20">
      {/* 80% Clean SaaS Header + 20% Enhanced Warm Accent */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle Pastel Yellow Accent Ribbon Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-200/35 via-yellow-100/20 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-semibold border border-amber-300">
              <Trophy className="h-3.5 w-3.5 text-amber-600" />
              <span>Flagship Tech Hackathons & Coding Competitions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              27 Big Company Hackathons Worth Participating In
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Bypass 10,000+ standard resume applications. These 27 verified corporate challenges (Flipkart GRiD, Walmart CodeHers, JPMC Code for Good, Google Girl Hackathon, Juspay Challenge) offer <strong>direct pre-placement interview (PPI) calls, summer internship offers, and cash prizes</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="p-3.5 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[100px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Open Now</span>
              <span className="text-xl font-bold text-emerald-700">{openNowCount} Hackathons</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[100px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Upcoming</span>
              <span className="text-xl font-bold text-amber-600">{upcomingCount} Hackathons</span>
            </div>
          </div>
        </div>

        {/* Clean Filter Controls */}
        <div className="mt-6 pt-5 border-t border-stone-100 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between relative z-10">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                  selectedCategory === cat.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* Search & Status */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search hackathons, companies, or perks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedStatus('ALL')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedStatus === 'ALL'
                    ? 'bg-amber-100 text-amber-950 border border-amber-300'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'OPEN_NOW' ? 'ALL' : 'OPEN_NOW')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  selectedStatus === 'OPEN_NOW'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Open Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hackathons Cards Grid (Strict 80% Clean + 20% Enhanced) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHackathons.map((hack) => {
          const isOpen = hack.status === 'OPEN_NOW';

          return (
            <div
              key={hack.id}
              onClick={() => setActiveModalHackathon(hack)}
              className="bg-white border border-stone-200/90 rounded-xl p-5 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                {/* Header: Company & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-stone-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {hack.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider truncate block">
                        {hack.company}
                      </span>
                      <span className="text-[10px] font-medium text-stone-400">
                        {hack.category}
                      </span>
                    </div>
                  </div>

                  {isOpen ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Open Now
                    </span>
                  ) : hack.status === 'UPCOMING_SOON' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      Upcoming
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-600 shrink-0">
                      Annual Cycle
                    </span>
                  )}
                </div>

                {/* Hackathon Name */}
                <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-800 transition line-clamp-2 mb-2">
                  {hack.name}
                </h3>

                {/* Overview Description */}
                <p className="text-xs text-stone-600 line-clamp-3 mb-4 leading-relaxed">
                  {hack.overview}
                </p>

                {/* Metadata List */}
                <div className="space-y-1.5 text-xs text-stone-600 pt-3 border-t border-stone-100 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-400 font-medium">Expected Month:</span>
                    <span className="font-semibold text-stone-800">{hack.expectedMonth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-400 font-medium">Eligible Batches:</span>
                    <span className="font-medium text-stone-700 truncate max-w-[180px] text-right">
                      {hack.targetBatches}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-400 font-medium">Rewards & Offers:</span>
                    <span className="font-bold text-emerald-800 text-[11px] truncate max-w-[180px] text-right">
                      {hack.rewards}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1 group-hover:gap-1.5 transition-all">
                  View rounds & roadmap <ChevronRight className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  Click to open
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* "Box-Opening" Dossier Modal */}
      {activeModalHackathon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8">
            <button
              onClick={() => setActiveModalHackathon(null)}
              className="absolute top-5 right-5 p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 mb-6 pr-8">
              <div className="w-12 h-12 rounded-xl bg-stone-900 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
                {activeModalHackathon.company.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    {activeModalHackathon.company}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700">
                    {activeModalHackathon.category}
                  </span>
                  {activeModalHackathon.status === 'OPEN_NOW' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ● Active Now
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
                  {activeModalHackathon.name}
                </h3>
              </div>
            </div>

            {/* Overview */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 mb-6">
              <p className="text-sm text-stone-700 leading-relaxed">
                {activeModalHackathon.overview}
              </p>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="p-3.5 rounded-xl border border-stone-200 bg-[#fbfbfa]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Expected Timeline
                </span>
                <span className="text-sm font-semibold text-stone-800">
                  {activeModalHackathon.expectedMonth}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-stone-200 bg-[#fbfbfa]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Target Batches / Eligibility
                </span>
                <span className="text-sm font-semibold text-stone-800">
                  {activeModalHackathon.targetBatches}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-stone-200 bg-[#fbfbfa] sm:col-span-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Rewards, PPI Offers & Cash Prizes
                </span>
                <span className="text-sm font-bold text-emerald-700">
                  {activeModalHackathon.rewards}
                </span>
              </div>
            </div>

            {/* Format & Rounds */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" /> Competition Rounds & Stages
              </h4>
              {activeModalHackathon.rounds && activeModalHackathon.rounds.length > 0 ? (
                <div className="space-y-2">
                  {activeModalHackathon.rounds.map((rnd, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-stone-200 bg-white flex items-start gap-2.5 text-xs text-stone-800"
                    >
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-950 font-bold text-[10px] shrink-0">
                        Stage {idx + 1}
                      </span>
                      <span className="font-medium">{rnd}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-700 font-medium">
                  {activeModalHackathon.format}
                </div>
              )}
            </div>

            {/* Insider Strategy Tips */}
            {activeModalHackathon.tips && (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 mb-8">
                <h4 className="text-xs font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Winning Strategy & Recruiter Insider Tip
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {activeModalHackathon.tips}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-5 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href={activeModalHackathon.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition"
              >
                Official Challenge Portal <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
                onClick={() => {
                  onSelectCompanyForPitch(activeModalHackathon.company, activeModalHackathon.name);
                  setActiveModalHackathon(null);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-xs hover:shadow transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" /> Pitch Recruiter for this Hackathon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
