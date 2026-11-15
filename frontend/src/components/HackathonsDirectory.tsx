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
import { DoodleWavyUnderline } from './DoodleIcons';

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
      {/* Hand-crafted Sketchbook Header */}
      <div className="bg-[#fffefc] border-2 border-stone-800 rounded-[255px_18px_225px_18px/18px_225px_18px_255px] p-6 sm:p-8 shadow-[3.5px_4px_0px_#1c1917] relative overflow-hidden">
        {/* Soft Watercolor Washes */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-200/50 rounded-[45%_55%_65%_35%/40%_60%_40%_60%] blur-[3px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-36 h-28 bg-amber-200/40 rounded-[60%_40%_30%_70%/50%_60%_40%_50%] blur-[3px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] bg-amber-200 text-amber-950 text-xs font-bold border-2 border-stone-800 shadow-[1.5px_2px_0px_#1c1917] -rotate-1">
              <Trophy className="h-3.5 w-3.5 text-amber-700" />
              <span>Flagship Tech Hackathons & Coding Competitions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Top Big Company Hackathons Worth Participating In
            </h2>
            <DoodleWavyUnderline className="w-44 h-2 text-amber-500 mb-2" />
            <p className="text-sm text-stone-600 leading-relaxed">
              Bypass 10,000+ standard resume applications. These 20+ verified corporate hackathons (Flipkart GRiD, Walmart CodeHers, JPMC Code for Good, Google Girl Hackathon) offer <strong>direct pre-placement interview (PPI) calls and summer internship offers</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <div className="p-3 bg-white border-2 border-stone-800 rounded-[255px_12px_225px_12px/12px_225px_12px_255px] shadow-[2.5px_2.5px_0px_#1c1917] text-center min-w-[95px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Open Now</span>
              <span className="text-lg font-extrabold text-emerald-800">{openNowCount} Contests</span>
            </div>
            <div className="p-3 bg-amber-100 border-2 border-stone-800 rounded-[12px_255px_12px_225px/225px_12px_255px_12px] shadow-[2.5px_2.5px_0px_#1c1917] text-center min-w-[95px] rotate-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-0.5">Tracked</span>
              <span className="text-lg font-extrabold text-amber-950">20+ Verified</span>
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

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'ALL', label: 'All Hackathons' },
            { id: 'OPEN_NOW', label: '🔥 Open to Register' },
            { id: 'Diversity (Women in Tech)', label: 'Diversity & Women' },
            { id: 'Hiring & PPI Challenge', label: 'Direct PPI Hiring' },
            { id: 'Global Cup', label: 'Global Cups ($100k+)' },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id || (cat.id === 'OPEN_NOW' && selectedStatus === 'OPEN_NOW');
            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (cat.id === 'OPEN_NOW') {
                    setSelectedStatus(selectedStatus === 'OPEN_NOW' ? 'ALL' : 'OPEN_NOW');
                    setSelectedCategory('ALL');
                  } else {
                    setSelectedCategory(cat.id);
                    setSelectedStatus('ALL');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer border ${
                  isSelected
                    ? 'bg-stone-900 text-stone-50 border-stone-900'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
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

      {/* Cards Grid: Hand-drawn Irregular Wabi-Sabi Aesthetics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredHackathons.map((h, idx) => {
          const isOpenNow = h.status === 'OPEN_NOW';
          const isUpcoming = h.status === 'UPCOMING_SOON';
          const cardClass = idx % 2 === 0 ? 'sketch-card' : 'sketch-card-alt';

          return (
            <div
              key={h.id}
              onClick={() => setActiveModalHackathon(h)}
              className={`group p-5 flex flex-col justify-between space-y-4 cursor-pointer relative ${cardClass}`}
            >
              {/* Washi Tape on Open Contests */}
              {isOpenNow && <div className="washi-tape washi-tape-sage" />}

              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-base leading-tight group-hover:text-amber-900 transition">
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
                        <span>Open Now</span>
                      </span>
                    ) : isUpcoming ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3 text-amber-600" />
                        <span>{h.expectedMonth}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200 shrink-0">
                        {h.expectedMonth} (Annual)
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Rewards Box */}
                <div className="bg-[#fef9c3]/50 border border-amber-200/90 p-3 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Award className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Hiring Rewards & PPI Offers:</span>
                  </div>
                  <p className="text-stone-800 font-medium leading-relaxed">
                    {h.rewards}
                  </p>
                </div>

                {/* Brief Overview */}
                <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                  {h.overview}
                </p>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
                  <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                    👥 {h.targetBatches}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    {h.category}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium group-hover:text-stone-900 transition flex items-center gap-1">
                  <span>View challenge format & stages</span>
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
                </span>
                <span className="text-[11px] font-semibold text-stone-500">
                  {h.statusLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* "BOX OPENING" DETAIL MODAL */}
      {/* ========================================================================= */}
      {activeModalHackathon && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full p-6 sm:p-7 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-stone-900 text-xl leading-tight">
                    {activeModalHackathon.name}
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-900 border border-amber-300">
                    {activeModalHackathon.category}
                  </span>
                </div>
                <span className="text-xs text-stone-500 mt-1 block">
                  Organized by <strong className="text-stone-800">{activeModalHackathon.company}</strong> · Expected Month: <strong>{activeModalHackathon.expectedMonth}</strong>
                </span>
              </div>

              <button
                onClick={() => setActiveModalHackathon(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Rewards Callout */}
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 text-xs sm:text-sm space-y-1.5">
              <strong className="block text-amber-950 font-bold flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-600" />
                Pre-Placement Interviews & Prizes:
              </strong>
              <p className="text-stone-800 font-semibold leading-relaxed">
                {activeModalHackathon.rewards}
              </p>
            </div>

            {/* Overview & Format */}
            <div className="space-y-3 text-xs">
              <div>
                <strong className="text-stone-900 block mb-1">Competition Overview:</strong>
                <p className="text-stone-600 leading-relaxed bg-[#f9fafb] p-3 rounded-xl border border-stone-200">
                  {activeModalHackathon.overview}
                </p>
              </div>

              <div>
                <strong className="text-stone-900 block mb-1">Evaluation & Stages Format:</strong>
                <div className="bg-[#f9fafb] p-3 rounded-xl border border-stone-200 text-stone-700 font-mono text-[11px] leading-relaxed">
                  {activeModalHackathon.format}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-white border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Target Eligibility</span>
                  <span className="text-stone-800 font-semibold">{activeModalHackathon.targetBatches}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Current Status</span>
                  <span className="text-stone-800 font-semibold">{activeModalHackathon.statusLabel}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
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
                  onSelectCompanyForPitch(activeModalHackathon.company, `${activeModalHackathon.name} Finalist Pitch`);
                  setActiveModalHackathon(null);
                }}
                className="py-2.5 px-5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Pitch for {activeModalHackathon.company}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
