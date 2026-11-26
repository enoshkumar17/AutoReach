import React, { useState, useMemo, useEffect } from 'react';
import { ALL_STUDENT_PROGRAMS, type StudentProgramItem } from '../data/hiringData';
import {
  Search,
  GraduationCap,
  ExternalLink,
  X,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Check,
} from 'lucide-react';

interface StudentProgramsProps {
  onSelectCompanyForPitch?: (companyName: string, role: string) => void;
  userId?: string;
}

export const StudentPrograms: React.FC<StudentProgramsProps> = ({
  userId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeModalProgram, setActiveModalProgram] = useState<StudentProgramItem | null>(null);

  // Registration tracking persisted in localStorage
  const REG_KEY = userId ? `autoreach_${userId}_registered_programs` : 'autoreach_guest_registered_programs';
  const [registeredIds, setRegisteredIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(REG_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(REG_KEY, JSON.stringify(registeredIds));
    } catch {}
  }, [registeredIds, REG_KEY]);

  const toggleRegisterProgram = (programId: string) => {
    setRegisteredIds((prev) =>
      prev.includes(programId) ? prev.filter((id) => id !== programId) : [...prev, programId]
    );
  };

  const categories = [
    { id: 'ALL', label: 'All Opportunities', count: ALL_STUDENT_PROGRAMS.length },
    {
      id: 'Internships & Career Programs',
      label: '🎓 Internships & Career Programs',
      count: ALL_STUDENT_PROGRAMS.filter((p) => p.type === 'Internships & Career Programs').length,
    },
    {
      id: 'Leadership & Community Programs',
      label: '👑 Leadership & Community Programs',
      count: ALL_STUDENT_PROGRAMS.filter((p) => p.type === 'Leadership & Community Programs').length,
    },
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
  const upcomingCount = ALL_STUDENT_PROGRAMS.filter((p) => p.status === 'UPCOMING_SOON').length;

  return (
    <div className="space-y-6 pb-20">
      {/* 80% Clean SaaS Header + 20% Enhanced Warm Accent */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle Pastel Yellow Accent Ribbon Glow */}
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
              Curated opportunities specifically designed for college students: <strong>14 Flagship Internships & Career Pathways</strong> (Google STEP, Uber STAR, LinkedIn CoachIN, Amazon WoW, Outreachy, GSoC) and <strong>14 Campus Leadership & Ambassador Fellowships</strong> (GitHub Campus Expert, MLSA, GDSC, Millennium Fellowship).
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="p-3.5 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[100px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Open Now</span>
              <span className="text-xl font-bold text-emerald-700">{openNowCount} Programs</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#fbfbfa] border border-stone-200 text-center min-w-[100px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Upcoming</span>
              <span className="text-xl font-bold text-amber-600">{upcomingCount} Programs</span>
            </div>
          </div>
        </div>

        {/* Clean Filter Controls */}
        <div className="mt-6 pt-5 border-t border-stone-100 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between relative z-10">
          {/* Category Tabs matching the 2 main lists */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
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
                placeholder="Search programs or skills..."
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

      {/* Program Cards Grid (Strict 80% Clean + 20% Enhanced) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPrograms.map((prog) => {
          const isOpen = prog.status === 'OPEN_NOW';
          const isInternship = prog.type === 'Internships & Career Programs';

          return (
            <div
              key={prog.id}
              onClick={() => setActiveModalProgram(prog)}
              className="bg-white border border-stone-200/90 rounded-xl p-5 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            >
              {/* Subtle accent hover indicator on top border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                {/* Header: Company & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-stone-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {prog.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider truncate block">
                        {prog.company}
                      </span>
                      <span className="text-[10px] font-medium text-stone-400">
                        {isInternship ? '🎓 Career Internship' : '👑 Leadership & Fellowship'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {registeredIds.includes(prog.id) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <Check className="w-3 h-3 text-emerald-700" /> Registered
                      </span>
                    )}

                    {isOpen ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Open Now
                      </span>
                    ) : prog.status === 'UPCOMING_SOON' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Upcoming
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-600">
                        Annual Cycle
                      </span>
                    )}
                  </div>
                </div>

                {/* Program Name */}
                <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-800 transition line-clamp-2 mb-2">
                  {prog.name}
                </h3>

                {/* Overview Description */}
                <p className="text-xs text-stone-600 line-clamp-3 mb-4 leading-relaxed">
                  {prog.overview}
                </p>

                {/* Metadata List */}
                <div className="space-y-1.5 text-xs text-stone-600 pt-3 border-t border-stone-100 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-400 font-medium">Expected Month:</span>
                    <span className="font-semibold text-stone-800">{prog.expectedMonth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-400 font-medium">Eligible Batches:</span>
                    <span className="font-medium text-stone-700 truncate max-w-[180px] text-right">
                      {prog.targetBatches}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-400 font-medium">Stipend / Benefit:</span>
                    <span className="font-bold text-emerald-800 text-[11px] truncate max-w-[180px] text-right">
                      {prog.stipendOrBenefit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1 group-hover:gap-1.5 transition-all">
                  View selection & requirements <ChevronRight className="h-3.5 w-3.5" />
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
      {activeModalProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8">
            <button
              onClick={() => setActiveModalProgram(null)}
              className="absolute top-5 right-5 p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 mb-6 pr-8">
              <div className="w-12 h-12 rounded-xl bg-stone-900 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
                {activeModalProgram.company.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    {activeModalProgram.company}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700">
                    {activeModalProgram.type}
                  </span>
                  {activeModalProgram.status === 'OPEN_NOW' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ● Active Now
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
                  {activeModalProgram.name}
                </h3>
              </div>
            </div>

            {/* Overview */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 mb-6">
              <p className="text-sm text-stone-700 leading-relaxed">
                {activeModalProgram.overview}
              </p>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="p-3.5 rounded-xl border border-stone-200 bg-[#fbfbfa]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Expected Timeline
                </span>
                <span className="text-sm font-semibold text-stone-800">
                  {activeModalProgram.expectedMonth}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-stone-200 bg-[#fbfbfa]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Target Batches / Eligibility
                </span>
                <span className="text-sm font-semibold text-stone-800">
                  {activeModalProgram.targetBatches}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-stone-200 bg-[#fbfbfa] sm:col-span-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Stipend, Perks & Offer Trajectory
                </span>
                <span className="text-sm font-bold text-emerald-700">
                  {activeModalProgram.stipendOrBenefit}
                </span>
              </div>
            </div>

            {/* Selection Process */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Selection Process & Interview Stages
              </h4>
              <div className="p-3.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-700 font-medium leading-relaxed">
                {activeModalProgram.selectionProcess}
              </div>
            </div>

            {/* Key Requirements Checklist */}
            <div className="mb-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Core Requirements & Profile Fit
              </h4>
              <ul className="space-y-2">
                {activeModalProgram.keyRequirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-stone-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="pt-5 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Registration Tracking Action */}
              {registeredIds.includes(activeModalProgram.id) ? (
                <button
                  onClick={() => toggleRegisterProgram(activeModalProgram.id)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-100 hover:bg-emerald-200 text-xs font-bold text-emerald-900 transition cursor-pointer"
                  title="Click to unmark registration"
                >
                  <Check className="h-4 w-4 text-emerald-700" />
                  <span>✓ Registered (Click to unmark)</span>
                </button>
              ) : (
                <button
                  onClick={() => toggleRegisterProgram(activeModalProgram.id)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-900 transition cursor-pointer shadow-2xs"
                  title="Mark that you registered on the official portal"
                >
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>✓ I Registered for this Program</span>
                </button>
              )}

              {/* Direct Official Program Portal Link */}
              <a
                href={activeModalProgram.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs shadow-xs hover:shadow transition cursor-pointer"
              >
                <span>Official Program Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
