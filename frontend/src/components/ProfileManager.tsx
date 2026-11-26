import React, { useState } from 'react';
import type { CandidateProfile, Project } from '../types';
import { Plus, Trash2, Upload, ExternalLink, FileCheck, Mail, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProfileManagerProps {
  profile: CandidateProfile | null;
  projects: Project[];
  onProfileUpdated: (updated: CandidateProfile) => void;
  onProjectAdded: (proj: Project) => void;
  onProjectDeleted: (id: number) => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  profile,
  projects,
  onProfileUpdated,
  onProjectAdded,
  onProjectDeleted,
}) => {
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [degree, setDegree] = useState(profile?.degree || '');
  const [linkedin, setLinkedin] = useState(profile?.linkedin || '');
  const [github, setGithub] = useState(profile?.github || '');
  const [portfolio, setPortfolio] = useState(profile?.portfolio || '');
  const [targetBatch, setTargetBatch] = useState<number>(profile?.targetBatch || 2028);
  const [targetRoles, setTargetRoles] = useState<string>(profile?.targetRoles || 'SWE, SDE, Backend, Fullstack, Systems');
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState<boolean>(profile?.emailAlertsEnabled ?? true);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSendingTestAlert, setIsSendingTestAlert] = useState(false);
  const [testAlertNotice, setTestAlertNotice] = useState<string | null>(null);

  // New project state (point-by-point)
  const [projectTitle, setProjectTitle] = useState('');
  const [projectTags, setProjectTags] = useState('');
  const [projectPoints, setProjectPoints] = useState<string[]>(['']);
  const [projectGithub, setProjectGithub] = useState('');
  const [projectLive, setProjectLive] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [projectMsg, setProjectMsg] = useState<string | null>(null);

  const handlePointChange = (index: number, value: string) => {
    // If user pasted multi-line text or bullets, auto-split into individual points
    if (value.includes('\n') || value.includes('•') || value.includes('\u2022')) {
      const splitLines = value
        .split(/\r?\n|•|\u2022/)
        .map((s) => s.trim().replace(/^[-*]\s*/, ''))
        .filter(Boolean);
      if (splitLines.length > 1) {
        const next = [...projectPoints];
        next.splice(index, 1, ...splitLines);
        setProjectPoints(next);
        return;
      }
    }
    const next = [...projectPoints];
    next[index] = value;
    setProjectPoints(next);
  };

  const handleAddPointField = () => {
    setProjectPoints([...projectPoints, '']);
  };

  const handleRemovePointField = (index: number) => {
    if (projectPoints.length <= 1) {
      setProjectPoints(['']);
      return;
    }
    setProjectPoints(projectPoints.filter((_, i) => i !== index));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);

    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('college', college);
      formData.append('degree', degree);
      formData.append('linkedin', linkedin);
      formData.append('github', github);
      formData.append('portfolio', portfolio);
      formData.append('targetBatch', String(targetBatch));
      formData.append('targetRoles', targetRoles);
      formData.append('emailAlertsEnabled', String(emailAlertsEnabled));
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const res = await fetch('/api/profile', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile.');

      onProfileUpdated(data.profile);
      setProfileMsg({ type: 'success', text: 'Profile saved successfully.' });
      setResumeFile(null);
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Error saving profile.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleParseResume = async () => {
    if (!resumeFile && !profile?.hasResume) {
      setProfileMsg({
        type: 'error',
        text: 'Please select a resume PDF or upload one first.',
      });
      return;
    }

    setIsParsingResume(true);
    setProfileMsg(null);
    setParseSuccessMsg(null);

    try {
      const formData = new FormData();
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const res = await fetch('/api/profile/parse-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract resume details.');

      // Auto-update form fields with extracted details
      if (data.extracted) {
        if (data.extracted.fullName) setFullName(data.extracted.fullName);
        if (data.extracted.email) setEmail(data.extracted.email);
        if (data.extracted.phone) setPhone(data.extracted.phone);
        if (data.extracted.college) setCollege(data.extracted.college);
        if (data.extracted.degree) setDegree(data.extracted.degree);
        if (data.extracted.targetBatch) setTargetBatch(data.extracted.targetBatch);
        if (data.extracted.linkedin) setLinkedin(data.extracted.linkedin);
        if (data.extracted.github) setGithub(data.extracted.github);
        if (data.extracted.portfolio) setPortfolio(data.extracted.portfolio);
      }

      if (data.profile) {
        onProfileUpdated(data.profile);
      }

      if (Array.isArray(data.projects)) {
        for (const p of data.projects) {
          if (!projects.some((existing) => existing.id === p.id)) {
            onProjectAdded(p);
          }
        }
      }

      setParseSuccessMsg(
        `✨ AI extracted resume: profile updated and ${data.newlyAddedCount || 0} technical projects imported into your portfolio!`
      );
      setResumeFile(null);
      setTimeout(() => setParseSuccessMsg(null), 8000);
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err.message || 'Error parsing resume with Gemini.',
      });
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleSendTestAlert = async () => {
    setIsSendingTestAlert(true);
    setTestAlertNotice(null);
    try {
      const res = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestAlertNotice(data.message || `Test job alert sent to ${email}!`);
      } else {
        setTestAlertNotice(data.error || 'Failed to send test alert.');
      }
    } catch (err: any) {
      setTestAlertNotice(err.message || 'Error triggering test alert.');
    } finally {
      setIsSendingTestAlert(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPoints = projectPoints
      .map((p) => p.trim().replace(/^[-*•]\s*/, ''))
      .filter(Boolean);

    if (!projectTitle || cleanPoints.length === 0) {
      setProjectMsg('Project name and at least one bullet point are required.');
      return;
    }

    setIsAddingProject(true);
    setProjectMsg(null);

    const formattedDesc = cleanPoints.map((p) => `• ${p}`).join('\n');

    try {
      const res = await fetch('/api/profile/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectTitle,
          tags: projectTags || 'General',
          description: formattedDesc,
          githubUrl: projectGithub || null,
          liveUrl: projectLive || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add project.');

      onProjectAdded(data);
      setProjectTitle('');
      setProjectTags('');
      setProjectPoints(['']);
      setProjectGithub('');
      setProjectLive('');
    } catch (err: any) {
      setProjectMsg(err.message || 'Error adding project.');
    } finally {
      setIsAddingProject(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-24">
      {/* Candidate Profile Details & Resume */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-6 sm:p-7 shadow-2xs space-y-5">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-stone-900">Candidate Identity & Resume</h2>
          <p className="text-sm text-stone-500 mt-1">
            AutoReach references these details and attaches your uploaded resume to outgoing cold applications.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-600 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-[#faf9f6]/60 border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-600 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="johndoe@gmail.com"
                className="w-full bg-[#faf9f6]/60 border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-600 mb-1.5">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 ..."
                className="w-full bg-[#faf9f6]/60 border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-600 mb-1.5">College / University</label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="College Name"
                className="w-full bg-[#faf9f6]/60 border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-600 mb-1.5">Degree & Branch</label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="B.Tech Computer Science (2026)"
                className="w-full bg-[#faf9f6]/60 border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-600 mb-1.5">LinkedIn Profile URL</label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full bg-[#faf9f6]/60 border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-stone-600 mb-1.5">GitHub Profile URL</label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full bg-[#faf9f6]/60 border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-600 mb-1.5">Portfolio (Optional)</label>
              <input
                type="url"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#faf9f6]/60 border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 rounded-lg"
              />
            </div>
          </div>

          {/* Automated Career Radar & Real-Time Alerts Box */}
          <div className="pt-4 border-t border-stone-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-xs shadow-2xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Career Radar & Instant Email Alerts</h3>
                  <p className="text-xs text-stone-500">AutoReach immediately notifies you via email the minute a matching tech opening drops.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendTestAlert}
                disabled={isSendingTestAlert}
                className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <Mail className="h-3.5 w-3.5 text-amber-600" />
                <span>{isSendingTestAlert ? 'Delivering...' : 'Send Test Alert to Email'}</span>
              </button>
            </div>

            {testAlertNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{testAlertNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50/70 p-4 rounded-xl border border-stone-200">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                  Target Graduation Batch
                </label>
                <select
                  value={targetBatch}
                  onChange={(e) => setTargetBatch(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-stone-200 px-3.5 py-2 text-sm text-stone-900 font-semibold focus:outline-none focus:border-amber-400 rounded-lg shadow-2xs"
                >
                  <option value={2028}>Batch 2028 (1st / 2nd Year - STEP / Summer Intern)</option>
                  <option value={2027}>Batch 2027 (Pre-final Year - Primary Summer SWE)</option>
                  <option value={2026}>Batch 2026 (Final Year - 6M Spring & Full-Time PPO)</option>
                  <option value={2025}>Batch 2025 (Graduates - Full-Time Off-Campus)</option>
                </select>
                <span className="text-[11px] text-stone-400 mt-1 block">
                  AutoReach prioritizes opportunities accepting this graduation year.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                  Target Roles / Tracks
                </label>
                <input
                  type="text"
                  value={targetRoles}
                  onChange={(e) => setTargetRoles(e.target.value)}
                  placeholder="SWE, SDE, Backend, Fullstack, Systems"
                  className="w-full bg-white border border-stone-200 px-3.5 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:border-amber-400 rounded-lg shadow-2xs"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Comma-separated keywords matched against job titles and categories.
                </span>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Instant Email Notifications</span>
                  <span className="text-[11px] text-stone-500">
                    Dispatches priority email alert with 1-click apply links to <strong>{email}</strong>
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlertsEnabled}
                    onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Resume Upload Pill */}
          <div className="pt-3 border-t border-stone-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#faf9f6]/60 p-4 rounded-xl border border-stone-200/80">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-4 py-2 rounded-lg bg-white hover:bg-stone-50 border border-stone-200 text-sm font-medium text-stone-800 flex items-center gap-2 transition shadow-2xs">
                  <Upload className="h-4 w-4" />
                  <span>Choose PDF</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setResumeFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>

                <div className="text-sm">
                  {resumeFile ? (
                    <span className="text-stone-800 font-medium">Ready to upload: {resumeFile.name}</span>
                  ) : profile?.hasResume ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-emerald-600" />
                      Active Resume: {profile.resumeFileName}
                    </span>
                  ) : (
                    <span className="text-stone-500">No PDF uploaded yet</span>
                  )}
                </div>
              </div>

              {profileMsg && (
                <span
                  className={`text-sm font-medium ${
                    profileMsg.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {profileMsg.text}
                </span>
              )}

              <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleParseResume}
                  disabled={isParsingResume || (!resumeFile && !profile?.hasResume)}
                  className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer shadow-2xs"
                  title="Gemini will analyze your resume PDF and automatically extract your profile details & projects"
                >
                  <Sparkles className={`h-4 w-4 ${isParsingResume ? 'animate-spin' : ''}`} />
                  <span>{isParsingResume ? 'Extracting with Gemini...' : 'Auto-Fill from Resume (AI)'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-sm font-medium transition disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>

            {parseSuccessMsg && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
                <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{parseSuccessMsg}</span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Projects Showcase Library */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-6 sm:p-7 shadow-2xs space-y-5">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-stone-900">
            Project Showcase Library ({projects.length})
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            AutoReach scans these projects and cites the 1–2 most relevant ones in your cold pitches.
          </p>
        </div>

        {/* Add Project Form */}
        <form onSubmit={handleAddProject} className="bg-[#f9fafb] p-4 sm:p-5 rounded-lg border border-stone-200/80 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-600 mb-1.5">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Distributed Task Queue"
                className="w-full bg-white border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-600 mb-1.5">
                Tech Stack Tags (Comma separated)
              </label>
              <input
                type="text"
                value={projectTags}
                onChange={(e) => setProjectTags(e.target.value)}
                placeholder="e.g. Node.js, Redis, BullMQ"
                className="w-full bg-white border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-semibold text-stone-700">
                Key Accomplishments & Bullet Points <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddPointField}
                className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Bullet Point</span>
              </button>
            </div>

            <div className="space-y-2">
              {projectPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 h-8.5 flex items-center justify-center text-xs font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-200/80 shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    required={idx === 0}
                    value={point}
                    onChange={(e) => handlePointChange(idx, e.target.value)}
                    placeholder={
                      idx === 0
                        ? "e.g. Built high-throughput Redis job queue handling 10k tasks/min"
                        : idx === 1
                        ? "e.g. Engineered automatic exponential backoff retry mechanism"
                        : "e.g. Reduced database query latency by 45% using indexed queries"
                    }
                    className="flex-1 bg-white border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 rounded-lg"
                  />
                  {projectPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePointField(idx)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                      title="Remove bullet point"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-stone-400">
              Tip: You can paste multi-line bullet points directly from your resume; AutoReach will auto-split them into individual points!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
              <input
                type="url"
                value={projectGithub}
                onChange={(e) => setProjectGithub(e.target.value)}
                placeholder="GitHub link (optional)"
                className="bg-white border border-stone-200 px-3 py-1.5 text-xs sm:text-sm text-stone-800 focus:outline-none focus:border-stone-400 rounded-lg"
              />
              <input
                type="url"
                value={projectLive}
                onChange={(e) => setProjectLive(e.target.value)}
                placeholder="Demo link (optional)"
                className="bg-white border border-stone-200 px-3 py-1.5 text-xs sm:text-sm text-stone-800 focus:outline-none focus:border-stone-400 rounded-lg"
              />
            </div>

            {projectMsg && <span className="text-sm text-rose-600">{projectMsg}</span>}

            <button
              type="submit"
              disabled={isAddingProject}
              className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-sm font-medium flex items-center gap-1.5 transition self-end sm:self-auto shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Project</span>
            </button>
          </div>
        </form>

        {/* Existing Projects */}
        <div className="space-y-3 pt-1">
          {projects.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">
              No projects added yet.
            </p>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-[#faf9f6]/60 border border-stone-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-sm sm:text-base text-stone-900">{proj.title}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold border border-stone-200/80">
                      {proj.tags}
                    </span>
                  </div>

                  {/* Bullet points display */}
                  <div className="space-y-1.5 pt-1">
                    {proj.description
                      .split(/\r?\n|•|\u2022/)
                      .map((line) => line.trim().replace(/^[-*]\s*/, ''))
                      .filter((line) => line.length > 0)
                      .map((point, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-stone-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span className="leading-relaxed">{point}</span>
                        </div>
                      ))}
                  </div>

                  {(proj.githubUrl || proj.liveUrl) && (
                    <div className="flex items-center gap-4 text-xs sm:text-sm pt-2">
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1.5 underline"
                        >
                          <ExternalLink className="h-3 w-3" /> GitHub
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1.5 underline"
                        >
                          <ExternalLink className="h-3 w-3" /> Live Demo
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onProjectDeleted(proj.id)}
                  title="Remove Project"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition self-end sm:self-start cursor-pointer shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
