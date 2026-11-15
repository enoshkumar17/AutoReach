import React, { useState, useMemo } from 'react';
import { ALL_FLAGSHIP_HACKATHONS, type HackathonItem } from '../data/hiringData';
import {
  Search,
  Trophy,
  ExternalLink,
  Send,
  X,
  ChevronRight,
  Award,
  Clock,
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

  const filteredHackathons = useMemo(() => {
    return ALL_FLAGSHIP_HACKATHONS.filter((h) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.company.toLowerCase().includes(q) ||
        h.overview.toLowerCase().includes(q) ||
        h.rewards.toLowerCase().includes(q);

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

  return (
    <div className="space-y-6 pb-20">
      {/* 80% Clean + 20% Enhanced Editorial Header */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle Pastel Yellow Accent Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-200/35 via-yellow-100/20 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-semibold border border-amber-300">
              <Trophy className="h-3.5 w-3.5 text-amber-600" />
              <span>Flagship Tech Hackathons & Coding Competitions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Top Big Company Hackathons Worth Participating In
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Bypass 10,000+ standard resume applications. These 20+ verified corporate hackathons (Flipkart GRiD, Walmart CodeHers, JPMC Code for Good, Google Girl Hackathon) offer <strong>direct pre-placement interview (PPI) calls and summer internship offers</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="p-3.5 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[110px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Open Now</span>
              <span className="text-xl font-bold text-emerald-700">{openNowCount} Challenges</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[110px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Total Tracked</span>
              <span className="text-xl font-bold text-amber-600">20+ Contests</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hackathons (Flipkart GRiD, Walmart CodeHers, JPMC, Google Girl)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f9fafb] border border-stone-200 rounded-lg pl-9 pr-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 font-sans"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'OPEN_NOW' ? 'ALL' : 'OPEN_NOW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
              selectedStatus === 'OPEN_NOW'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200/70 text-stone-700'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span>Open Right Now</span>
          </button>

          <button
            onClick={() => setSelectedStatus(selectedStatus === 'UPCOMING_SOON' ? 'ALL' : 'UPCOMING_SOON')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedStatus === 'UPCOMING_SOON'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200/70 text-stone-700'
            }`}
          >
            <span>Upcoming</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'All Challenges' },
          { id: 'Hiring & PPI Challenge', label: '💼 Direct SDE PPI Challenges' },
          { id: 'Diversity (Women in Tech)', label: '🌸 Women in Tech Hackathons' },
          { id: 'Ideation & Prototyping', label: '🚀 Innovation & Govt Cups' },
        ].map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between px-1 text-xs text-stone-500">
        <span>
          Showing <strong>{filteredHackathons.length}</strong> flagship hiring challenges
        </span>
        <span className="text-stone-400">
          💡 Click any card to inspect the format, prize pool, and official portal
        </span>
      </div>

      {/* Cards Grid: Clean, Minimal, Crisp */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHackathons.map((h) => {
          const isOpenNow = h.status === 'OPEN_NOW';
          const isUpcoming = h.status === 'UPCOMING_SOON';

          return (
            <div
              key={h.id}
              onClick={() => setActiveModalHackathon(h)}
              className="group bg-white border border-stone-200/90 hover:border-amber-400 rounded-xl p-5 shadow-2xs hover:shadow-md transition-all duration-150 flex flex-col justify-between space-y-4 cursor-pointer relative"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-stone-900 text-base leading-tight group-hover:text-amber-800 transition">
                      {h.name}
                    </h3>
                    <span className="text-xs text-stone-500 font-medium block mt-0.5">
                      Organized by <strong className="text-stone-800">{h.company}</strong>
                    </span>
                  </div>

                  <div>
                    {isOpenNow ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Open to Register</span>
                      </span>
                    ) : isUpcoming ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3 text-amber-600" />
                        <span>{h.statusLabel}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
                        {h.statusLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rewards & Fast-Track Badge */}
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-950 font-bold">
                    <Award className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Hiring Rewards & Incentives:</span>
                  </div>
                  <p className="text-stone-800 font-medium pl-5 leading-relaxed">
                    {h.rewards}
                  </p>
                </div>

                {/* Format Preview */}
                <div className="text-xs text-stone-600">
                  <span className="text-stone-400 font-medium block mb-1">Challenge Format:</span>
                  <p className="line-clamp-2 leading-relaxed bg-[#f9fafb] p-2.5 rounded-lg border border-stone-100 font-mono text-[11px]">
                    {h.format}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-800">{h.expectedMonth}</span>
                  <span>•</span>
                  <span>{h.targetBatches}</span>
                </div>

                <div className="flex items-center gap-1 text-amber-800 font-semibold group-hover:text-amber-900 transition">
                  <span>View Details</span>
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* "Box Opening" Detailed Dossier Modal */}
      {activeModalHackathon && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    {activeModalHackathon.company}
                  </span>
                  <span className="text-xs font-medium text-stone-500">
                    {activeModalHackathon.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-stone-900">
                  {activeModalHackathon.name}
                </h3>
              </div>

              <button
                onClick={() => setActiveModalHackathon(null)}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Overview */}
            <div className="p-4 rounded-xl bg-[#fafafa] border border-stone-200/80 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <p>{activeModalHackathon.overview}</p>
            </div>

            {/* Metric Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-amber-800 block mb-0.5">Timeline / Month</span>
                <span className="text-stone-900 font-semibold">{activeModalHackathon.expectedMonth}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f9fafb] border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Target Batches</span>
                <span className="text-stone-900 font-semibold">{activeModalHackathon.targetBatches}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-0.5">Rewards & PPIs</span>
                <span className="text-emerald-950 font-bold">{activeModalHackathon.rewards}</span>
              </div>
            </div>

            {/* Format Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Challenge Format & Stages</h4>
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs text-stone-800 leading-relaxed">
                {activeModalHackathon.format}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
              <a
                href={activeModalHackathon.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <span>Official Challenge Portal</span>
                <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
              </a>

              <button
                onClick={() => {
                  onSelectCompanyForPitch(activeModalHackathon.company, activeModalHackathon.name);
                  setActiveModalHackathon(null);
                }}
                className="py-2.5 px-5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Pitch AutoReach for {activeModalHackathon.company}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
