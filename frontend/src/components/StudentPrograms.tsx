import React, { useState, useMemo } from 'react';
import { ALL_STUDENT_PROGRAMS, type StudentProgramItem } from '../data/hiringData';
import {
  Search,
  GraduationCap,
  ExternalLink,
  Send,
  X,
  ChevronRight,
  Award,
  Sparkles,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface StudentProgramsProps {
  onSelectCompanyForPitch: (companyName: string, role: string) => void;
}

export const StudentPrograms: React.FC<StudentProgramsProps> = ({
  onSelectCompanyForPitch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeModalProgram, setActiveModalProgram] = useState<StudentProgramItem | null>(null);

  const categories = [
    { id: 'ALL', label: 'All Opportunities' },
    { id: 'Early Career & Diversity', label: '🌱 1st & 2nd Year / Diversity' },
    { id: 'Open Source & Research', label: '🌐 Open Source & Research' },
    { id: 'Community & Leadership', label: '👑 Campus Leadership & Ambassador' },
  ];

  const filteredPrograms = useMemo(() => {
    return ALL_STUDENT_PROGRAMS.filter((prog) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prog.name.toLowerCase().includes(q) ||
        prog.company.toLowerCase().includes(q) ||
        prog.overview.toLowerCase().includes(q) ||
        prog.stipendOrBenefit.toLowerCase().includes(q) ||
        prog.targetBatches.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === 'ALL' || prog.type === selectedCategory;

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'OPEN_NOW' && prog.status === 'OPEN_NOW') ||
        (selectedStatus === 'UPCOMING_SOON' && prog.status === 'UPCOMING_SOON');

      return matchesSearch && matchesCat && matchesStatus;
    }).sort((a, b) => {
      if (a.status === 'OPEN_NOW' && b.status !== 'OPEN_NOW') return -1;
      if (a.status !== 'OPEN_NOW' && b.status === 'OPEN_NOW') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, selectedCategory, selectedStatus]);

  const openNowCount = ALL_STUDENT_PROGRAMS.filter((p) => p.status === 'OPEN_NOW').length;

  return (
    <div className="space-y-6 pb-20">
      {/* 80% Clean + 20% Enhanced Editorial Header */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle Pastel Yellow Accent Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-200/35 via-yellow-100/20 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-semibold border border-amber-300">
              <GraduationCap className="h-3.5 w-3.5 text-amber-600" />
              <span>College Opportunities & Student Fellowships</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Early Internships, Open Source Fellowships & Leadership
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Curated opportunities specifically designed for college undergraduates: 1st & 2nd-year fast-track pipelines (Google STEP, Microsoft Explore, Uber STAR), premier open source fellowships (GSoC, Outreachy), and top global campus ambassador programs.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="p-3.5 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[105px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Open Now</span>
              <span className="text-xl font-bold text-emerald-700">{openNowCount} Programs</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[105px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Total Tracked</span>
              <span className="text-xl font-bold text-amber-600">{ALL_STUDENT_PROGRAMS.length} Fellowships</span>
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
            placeholder="Search programs (Google STEP, GSoC, MLSA, Outreachy, Uber STAR)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f9fafb] border border-stone-200 rounded-lg pl-9 pr-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 font-sans"
          />
        </div>

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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
              selectedStatus === 'UPCOMING_SOON'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200/70 text-stone-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upcoming (Jan–Apr)</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Programs Grid: Clean, Minimal, Production-grade Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrograms.map((program) => {
          const isOpenNow = program.status === 'OPEN_NOW';
          const isUpcoming = program.status === 'UPCOMING_SOON';

          return (
            <div
              key={program.id}
              onClick={() => setActiveModalProgram(program)}
              className="bg-white border border-stone-200/90 hover:border-amber-400 rounded-xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer relative"
            >
              {/* Top Strip */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-lg bg-[#fbfbfa] border border-stone-200/90 flex items-center justify-center text-stone-800 font-bold text-sm shrink-0 group-hover:border-amber-400 transition">
                      {program.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-stone-400 block tracking-wide">
                        {program.company}
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 group-hover:text-amber-800 transition leading-snug line-clamp-1">
                        {program.name}
                      </h3>
                    </div>
                  </div>

                  {isOpenNow && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold tracking-tight whitespace-nowrap shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Open Now
                    </span>
                  )}
                  {isUpcoming && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold tracking-tight whitespace-nowrap shrink-0">
                      Upcoming
                    </span>
                  )}
                  {!isOpenNow && !isUpcoming && (
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-semibold tracking-tight whitespace-nowrap shrink-0">
                      Annual Cycle
                    </span>
                  )}
                </div>

                {/* Tag / Category */}
                <div className="mb-3">
                  <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                    {program.type}
                  </span>
                </div>

                {/* Overview Summary */}
                <p className="text-xs text-stone-600 leading-relaxed line-clamp-2 mb-4">
                  {program.overview}
                </p>
              </div>

              {/* Highlights Block */}
              <div className="space-y-2 pt-3 border-t border-stone-100 text-[11px]">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="text-stone-400 font-medium">Timeline:</span>
                  <span className="font-semibold text-stone-800">{program.expectedMonth}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span className="text-stone-400 font-medium">Target Batches:</span>
                  <span className="font-semibold text-stone-800 truncate max-w-[170px]" title={program.targetBatches}>
                    {program.targetBatches}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span className="text-stone-400 font-medium">Stipend / Perks:</span>
                  <span className="font-bold text-amber-700 truncate max-w-[170px]" title={program.stipendOrBenefit}>
                    {program.stipendOrBenefit}
                  </span>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs font-semibold text-stone-500 group-hover:text-stone-900 transition">
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-700">
                    <span>View selection & requirements</span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition" />
                  </span>
                  <span className="text-[10px] text-stone-400">Click to expand</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPrograms.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
          <BookOpen className="h-8 w-8 text-stone-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-stone-700">No student programs match your criteria</h4>
          <p className="text-xs text-stone-400 mt-1">Try clearing your filters or search terms.</p>
        </div>
      )}

      {/* "Box Opening" Detailed Dossier Modal */}
      {activeModalProgram && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    {activeModalProgram.company}
                  </span>
                  <span className="text-xs font-medium text-stone-500">
                    {activeModalProgram.type}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-stone-900">
                  {activeModalProgram.name}
                </h3>
              </div>

              <button
                onClick={() => setActiveModalProgram(null)}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Overview */}
            <div className="p-4 rounded-xl bg-[#fafafa] border border-stone-200/80 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <p>{activeModalProgram.overview}</p>
            </div>

            {/* 3 Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-amber-800 block mb-0.5">Timeline / Months</span>
                <span className="text-stone-900 font-semibold">{activeModalProgram.expectedMonth}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f9fafb] border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Target Batches</span>
                <span className="text-stone-900 font-semibold">{activeModalProgram.targetBatches}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-0.5">Stipend & Perks</span>
                <span className="text-emerald-950 font-bold">{activeModalProgram.stipendOrBenefit}</span>
              </div>
            </div>

            {/* Selection Process Walkthrough */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-stone-500" />
                <span>Selection & Assessment Flow</span>
              </h4>
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm text-stone-800 leading-relaxed">
                {activeModalProgram.selectionProcess}
              </div>
            </div>

            {/* Key Requirements Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-600" />
                <span>Key Eligibility & Preparation Criteria</span>
              </h4>
              <div className="space-y-2">
                {activeModalProgram.keyRequirements.map((req, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-stone-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
              <a
                href={activeModalProgram.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <span>Official Program Page</span>
                <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
              </a>

              <button
                onClick={() => {
                  onSelectCompanyForPitch(activeModalProgram.company, activeModalProgram.name);
                  setActiveModalProgram(null);
                }}
                className="py-2.5 px-5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Pitch AutoReach for {activeModalProgram.company}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
