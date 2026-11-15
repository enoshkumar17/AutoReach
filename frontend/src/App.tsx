import { useState, useEffect } from 'react';
import { Navbar, type TabType } from './components/Navbar';
import { NewOutreach } from './components/NewOutreach';
import { ApplicationsTracker } from './components/ApplicationsTracker';
import { ProfileManager } from './components/ProfileManager';
import { SettingsTab } from './components/SettingsTab';
import { LiveOpeningsFeed } from './components/LiveOpeningsFeed';
import { CompanyHiringCycles } from './components/CompanyHiringCycles';
import { HackathonsDirectory } from './components/HackathonsDirectory';
import { StudentPrograms } from './components/StudentPrograms';
import { DoodleRecipeBook, DoodleWavyUnderline, DoodleStar } from './components/DoodleIcons';
import type { CandidateProfile, Project, Application, EnvConfig } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('outreach');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [envConfig, setEnvConfig] = useState<EnvConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Prefill state from Guides/Cycles/Live -> Outreach
  const [prefilledCompany, setPrefilledCompany] = useState<string | null>(null);
  const [prefilledRole, setPrefilledRole] = useState<string | null>(null);

  const handleSelectCompanyForPitch = (companyName: string, role: string) => {
    setPrefilledCompany(companyName);
    setPrefilledRole(role);
    setActiveTab('outreach');
  };

  // Initial data loading
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [profileRes, appsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/applications'),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.profile);
          setProjects(profileData.projects || []);
          setEnvConfig(profileData.envConfig || null);
        }

        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApplications(appsData.applications || []);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Silently check for new replies whenever switching to Applications tab
  useEffect(() => {
    if (activeTab === 'tracker') {
      fetch('/api/applications/check-replies', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data.applications) {
            setApplications(data.applications);
          }
        })
        .catch(() => {});
    }
  }, [activeTab]);

  const handleApplicationSent = (newApp: Application) => {
    setApplications((prev) => [newApp, ...prev]);
  };

  const handleStatusChange = async (id: number, newStatus: Application['status']) => {
    try {
      const res = await fetch(`/api/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
        );
      }
    } catch (err) {
      console.error('Failed to update application status:', err);
    }
  };

  const handleDeleteApplication = async (id: number) => {
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setApplications((prev) => prev.filter((app) => app.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  const handleProjectAdded = (newProj: Project) => {
    setProjects((prev) => [newProj, ...prev]);
  };

  const handleProjectDeleted = async (id: number) => {
    try {
      const res = await fetch(`/api/profile/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] text-stone-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-stone-600">Loading AutoReach...</span>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const candidateFirstName = profile?.fullName ? profile.fullName.trim().split(' ')[0] : 'Enosh';
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-stone-900 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sentCount={applications.length}
        hasResume={!!profile?.hasResume}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-16">
        {/* Human-crafted Morning Greeting & Pipeline Status */}
        <div className="mb-8 p-5 sm:p-6 bg-[#fffefc] border-2 border-stone-800 rounded-[255px_18px_225px_18px/18px_225px_18px_255px] shadow-[3.5px_4px_0px_#1c1917] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Soft Watercolor Washes */}
          <div className="absolute -top-6 -right-6 w-36 h-36 bg-amber-200/50 rounded-full blur-[4px] pointer-events-none" />
          <div className="absolute -bottom-8 left-1/3 w-32 h-24 bg-emerald-200/40 rounded-full blur-[4px] pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            <DoodleRecipeBook className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-hand text-xs sm:text-sm font-bold text-amber-900 bg-amber-100 border border-stone-800 px-2.5 py-0.5 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] -rotate-1 inline-flex items-center gap-1 shadow-2xs">
                  <DoodleStar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Daily Placement Notebook</span>
                </span>
                <span className="text-xs text-stone-500 font-medium font-hand">
                  {todayFormatted}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                <span>{greeting}, {candidateFirstName}!</span>
              </h1>
              <DoodleWavyUnderline className="w-36 h-2 text-amber-500 mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs flex-wrap relative z-10">
            <span className="px-3 py-1.5 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] bg-emerald-100 text-emerald-950 border-2 border-stone-800 font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#1c1917]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Pipeline Active</span>
            </span>
            <span className="px-3 py-1.5 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] bg-white text-stone-900 border-2 border-stone-800 font-bold shadow-[2px_2px_0px_#1c1917]">
              {applications.length} Dispatched
            </span>
            <span className={`px-3 py-1.5 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 border-stone-800 font-bold shadow-[2px_2px_0px_#1c1917] ${profile?.hasResume ? 'bg-amber-100 text-amber-950' : 'bg-red-50 text-red-900'}`}>
              {profile?.hasResume ? '✓ Resume Attached' : '⚠️ No Resume'}
            </span>
          </div>
        </div>

        {/* 1. Cold Outreach Tab */}
        {activeTab === 'outreach' && (
          <NewOutreach
            profile={profile}
            projects={projects}
            onApplicationSent={handleApplicationSent}
            onNavigateToSettings={() => setActiveTab('settings')}
            hasGeminiKey={!!envConfig?.hasGeminiKey}
            hasGmailConfig={!!envConfig?.hasGmailConfig}
            prefilledCompany={prefilledCompany}
            prefilledRole={prefilledRole}
            onClearPrefilled={() => {
              setPrefilledCompany(null);
              setPrefilledRole(null);
            }}
          />
        )}

        {/* 2. Real-Time Scraped ATS Live Openings */}
        {activeTab === 'live' && (
          <LiveOpeningsFeed
            onSelectCompanyForPitch={handleSelectCompanyForPitch}
          />
        )}

        {/* 3. Company Hiring Cycles & Reopening Timelines */}
        {activeTab === 'cycles' && (
          <CompanyHiringCycles
            onSelectCompanyForPitch={handleSelectCompanyForPitch}
          />
        )}

        {/* 4. Flagship Hackathons & Competitions */}
        {activeTab === 'hackathons' && (
          <HackathonsDirectory
            onSelectCompanyForPitch={handleSelectCompanyForPitch}
          />
        )}

        {/* 5. Student Opportunities & Fellowships */}
        {activeTab === 'programs' && (
          <StudentPrograms
            onSelectCompanyForPitch={handleSelectCompanyForPitch}
          />
        )}

        {/* 6. Applications Pipeline & Tracking */}
        {activeTab === 'tracker' && (
          <ApplicationsTracker
            applications={applications}
            onStatusChange={handleStatusChange}
            onDeleteApplication={handleDeleteApplication}
            onApplicationsUpdated={(updated) => setApplications(updated)}
          />
        )}

        {/* 7. Candidate Profile & Resume */}
        {activeTab === 'profile' && (
          <ProfileManager
            profile={profile}
            projects={projects}
            onProfileUpdated={(updated) => setProfile(updated)}
            onProjectAdded={handleProjectAdded}
            onProjectDeleted={handleProjectDeleted}
          />
        )}

        {/* 8. Settings & Credentials */}
        {activeTab === 'settings' && (
          <SettingsTab
            envConfig={envConfig}
            onConfigUpdated={(newCfg) => setEnvConfig(newCfg)}
          />
        )}
      </main>

      <footer className="border-t border-stone-200/80 bg-[#faf9f6] py-6 text-center text-[11px] text-stone-400">
        AutoReach • Autonomous Cold Outreach, Live ATS Monitoring & Placement Radar
      </footer>
    </div>
  );
}
