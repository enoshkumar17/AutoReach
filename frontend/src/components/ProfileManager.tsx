import React, { useState } from 'react';
import type { CandidateProfile, Project } from '../types';
import { Plus, Trash2, Upload, ExternalLink, FileCheck } from 'lucide-react';

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
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New project state
  const [projectTitle, setProjectTitle] = useState('');
  const [projectTags, setProjectTags] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectGithub, setProjectGithub] = useState('');
  const [projectLive, setProjectLive] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [projectMsg, setProjectMsg] = useState<string | null>(null);

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

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle || !projectDesc) {
      setProjectMsg('Project title and description are required.');
      return;
    }

    setIsAddingProject(true);
    setProjectMsg(null);

    try {
      const res = await fetch('/api/profile/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectTitle,
          tags: projectTags || 'General',
          description: projectDesc,
          githubUrl: projectGithub || null,
          liveUrl: projectLive || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add project.');

      onProjectAdded(data);
      setProjectTitle('');
      setProjectTags('');
      setProjectDesc('');
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
      <div className="bg-white border border-stone-200/80 rounded-2xl p-7 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
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

              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-sm font-medium transition disabled:opacity-50 self-end sm:self-auto shadow-xs cursor-pointer"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Projects Showcase Library */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-7 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-stone-900">
            Project Showcase Library ({projects.length})
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            AutoReach scans these projects and cites the 1–2 most relevant ones in your cold pitches.
          </p>
        </div>

        {/* Add Project Form */}
        <form onSubmit={handleAddProject} className="bg-[#faf9f6]/60 p-5 rounded-xl border border-stone-200/80 space-y-4">
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

          <div>
            <label className="block text-xs sm:text-sm font-medium text-stone-600 mb-1.5">
              Description & Key Accomplishment <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              placeholder="e.g. Built a high-throughput job queue handling 10k tasks/min with Redis backoff retries and rate limiting."
              className="w-full bg-white border border-stone-200 p-3 text-sm text-stone-900 focus:outline-none focus:border-stone-400 rounded-lg"
            />
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
                className="bg-[#faf9f6]/60 border border-stone-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-semibold text-sm sm:text-base text-stone-900">{proj.title}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium border border-stone-200/80">
                      {proj.tags}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600 max-w-xl">{proj.description}</p>
                  {(proj.githubUrl || proj.liveUrl) && (
                    <div className="flex items-center gap-4 text-xs sm:text-sm pt-1">
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-stone-500 hover:text-stone-800 flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> GitHub
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-stone-500 hover:text-stone-800 flex items-center gap-1"
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
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition self-end sm:self-center cursor-pointer"
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
