import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { NewOutreach } from './components/NewOutreach';
import { ApplicationsTracker } from './components/ApplicationsTracker';
import { ProfileManager } from './components/ProfileManager';
import { SettingsTab } from './components/SettingsTab';
import type { CandidateProfile, Project, Application, EnvConfig } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'outreach' | 'tracker' | 'profile' | 'settings'>('outreach');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [envConfig, setEnvConfig] = useState<EnvConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="min-h-screen bg-[#faf9f6] text-stone-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-stone-600">Loading AutoReach...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sentCount={applications.length}
        hasResume={!!profile?.hasResume}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-8">
        {activeTab === 'outreach' && (
          <NewOutreach
            profile={profile}
            projects={projects}
            onApplicationSent={handleApplicationSent}
            onNavigateToSettings={() => setActiveTab('settings')}
            hasGeminiKey={!!envConfig?.hasGeminiKey}
            hasGmailConfig={!!envConfig?.hasGmailConfig}
          />
        )}

        {activeTab === 'tracker' && (
          <ApplicationsTracker
            applications={applications}
            onStatusChange={handleStatusChange}
            onDeleteApplication={handleDeleteApplication}
            onApplicationsUpdated={(updated) => setApplications(updated)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileManager
            profile={profile}
            projects={projects}
            onProfileUpdated={(updated) => setProfile(updated)}
            onProjectAdded={handleProjectAdded}
            onProjectDeleted={handleProjectDeleted}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            envConfig={envConfig}
            onConfigUpdated={(newCfg) => setEnvConfig(newCfg)}
          />
        )}
      </main>

      <footer className="border-t border-stone-200/80 bg-[#faf9f6] py-6 text-center text-[11px] text-stone-400">
        AutoReach • Autonomous Cold Outreach & Application Tracking
      </footer>
    </div>
  );
}
