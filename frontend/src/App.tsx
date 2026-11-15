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
import { NotificationDrawer } from './components/NotificationDrawer';
import type { CandidateProfile, Project, Application, EnvConfig, NotificationItem } from './types';
import {
  Sparkles,
  Flame,
  Calendar,
  Search,
  Bell,
  ArrowUpRight,
  Clock,
  ArrowRight,
  ShieldCheck,
  Trophy,
  GraduationCap,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('outreach');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [envConfig, setEnvConfig] = useState<EnvConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liveStats, setLiveStats] = useState<{ openCount: number; freshCount: number }>({ openCount: 52, freshCount: 6 });

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  // Prefill state from Guides/Cycles/Live -> Outreach
  const [prefilledCompany, setPrefilledCompany] = useState<string | null>(null);
  const [prefilledRole, setPrefilledRole] = useState<string | null>(null);

  const handleSelectCompanyForPitch = (companyName: string, role: string) => {
    setPrefilledCompany(companyName);
    setPrefilledRole(role);
    setActiveTab('outreach');
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (_) {}
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (_) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (_) {}
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const item = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (item && !item.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (_) {}
  };

  const handleSendTestEmail = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile?.email || 'enoshkumar2006@gmail.com' }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchNotifications();
        return { success: true, message: data.message || 'Test alert delivered to your email!' };
      }
      return { success: false, message: data.error || 'Failed to send test alert email.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error delivering test alert.' };
    }
  };

  const handleCheckPortalsNow = async () => {
    try {
      const res = await fetch('/api/notifications/check-now', { method: 'POST' });
      if (res.ok) {
        await Promise.all([fetchNotifications(), loadInitialData()]);
      }
    } catch (_) {}
  };

  // Initial data loading
  async function loadInitialData() {
    try {
      const [profileRes, appsRes, liveRes, notifRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/applications'),
        fetch('/api/live-listings'),
        fetch('/api/notifications'),
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

      if (liveRes.ok) {
        const liveData = await liveRes.json();
        if (liveData.openCount) {
          setLiveStats({ openCount: liveData.openCount, freshCount: liveData.freshCount || 6 });
        }
      }

      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
        setUnreadCount(notifData.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();

    // Periodic notification poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30 * 1000);
    return () => clearInterval(interval);
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
        {/* Executive Header & Intelligence Radar (Inspired by Atlas Dashboard Standard) */}
        <div className="space-y-4 mb-8">
          {/* Top Row: Date, Greeting & Command Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-0.5">
                {todayFormatted}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                {greeting}, {candidateFirstName}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-stone-200/90 text-xs text-stone-400 shadow-2xs">
                <Search className="h-3.5 w-3.5 text-stone-400" />
                <span className="text-stone-500 font-medium hidden sm:inline">Ask AutoReach anything...</span>
                <span className="text-[10px] font-mono bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded border border-stone-200">
                  ⌘K
                </span>
              </div>
              <button
                onClick={() => setIsNotificationOpen(true)}
                className="w-9 h-9 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/90 flex items-center justify-center text-stone-700 shadow-2xs relative transition cursor-pointer"
                title="Immediate Career Alerts & Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Atlas-Style Morning Career Brief Card */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-200/30 via-yellow-100/15 to-transparent rounded-bl-full pointer-events-none" />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-xs shadow-2xs">
                    <Sparkles className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-bold text-stone-900">AutoReach Intelligence</span>
                  <span className="text-[11px] text-stone-400">• Morning Career Brief</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Radar Active
                </span>
              </div>

              <p className="text-sm sm:text-base text-stone-800 leading-relaxed font-normal max-w-4xl">
                {liveStats.freshCount} high-priority tech openings require immediate application before they hit maximum applicant volume in 24–48 hours. 5 top companies have active hiring cycles this month, and applications for <strong>Google STEP</strong> and the <strong>Juspay Hiring Challenge</strong> are currently open.
              </p>

              {/* Quick Navigation Action Chips */}
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab('live')}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  <span>Fast Closing (&lt;48h)</span>
                </button>
                <button
                  onClick={() => setActiveTab('cycles')}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5 text-stone-600" />
                  <span>Active Nov Drives</span>
                </button>
                <button
                  onClick={() => setActiveTab('hackathons')}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trophy className="h-3.5 w-3.5 text-amber-600" />
                  <span>27 Flagship Hackathons</span>
                </button>
                <button
                  onClick={() => setActiveTab('programs')}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                  <span>28 Student Programs</span>
                </button>
                <button
                  onClick={() => setActiveTab('live')}
                  className="ml-auto text-xs font-bold text-stone-900 hover:text-amber-800 flex items-center gap-1 transition cursor-pointer"
                >
                  Read full live feed <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Atlas-Style Status Widgets (Green 82 / Orange 14 / Schedule) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Widget 1: Emerald Live ATS Radar */}
            <div
              onClick={() => setActiveTab('live')}
              className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl p-5 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                  Live ATS Openings
                </span>
                <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-white group-hover:scale-110 transition">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="my-2">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">{liveStats.openCount}</span>
                <span className="text-xs text-emerald-100 font-medium block mt-1">
                  Positions scraped directly from official ATS boards
                </span>
              </div>

              <div className="pt-3 border-t border-emerald-500/50 flex items-center justify-between text-[11px] text-emerald-100">
                <span className="inline-flex items-center gap-1.5 bg-emerald-800/60 px-2 py-0.5 rounded-md font-semibold">
                  <ShieldCheck className="h-3 w-3 text-emerald-300" /> Workday & Greenhouse Verified
                </span>
                <span className="font-mono">Updated today</span>
              </div>
            </div>

            {/* Widget 2: Amber/Orange Fast Closing Widget */}
            <div
              onClick={() => setActiveTab('live')}
              className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-5 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-100">
                  Closes Fast (&lt;48h)
                </span>
                <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-white group-hover:scale-110 transition">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="my-2">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">{liveStats.freshCount}</span>
                <span className="text-xs text-amber-100 font-medium block mt-1">
                  High applicant churn · Window closes within 1–2 days
                </span>
              </div>

              <div className="pt-3 border-t border-orange-500/50 flex items-center justify-between text-[11px] text-amber-100">
                <span className="inline-flex items-center gap-1.5 bg-orange-800/60 px-2 py-0.5 rounded-md font-semibold">
                  <Flame className="h-3 w-3 text-amber-300" /> Priority Attention
                </span>
                <span className="font-mono">Apply now</span>
              </div>
            </div>

            {/* Widget 3: Schedule / Hiring Cycles Timeline */}
            <div
              onClick={() => setActiveTab('cycles')}
              className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-amber-300 transition cursor-pointer flex flex-col justify-between sm:col-span-2 lg:col-span-1 group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" /> Hiring Waves Schedule
                </span>
                <span className="text-[11px] font-bold text-amber-800 flex items-center gap-0.5">
                  Open calendar <ArrowRight className="h-3 w-3" />
                </span>
              </div>

              <div className="my-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-900">Current Intake:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                    November Peak (5 Active)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span>Next Spring Wave:</span>
                  <span className="font-medium text-stone-800">Jan – Feb (8 Companies)</span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span>Summer SWE Primary:</span>
                  <span className="font-medium text-stone-800">June – August</span>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span className="inline-flex items-center gap-1 text-stone-700 font-medium">
                  <Clock className="h-3 w-3 text-stone-400" /> 18 Verified Indian Portals
                </span>
                <span className="text-emerald-700 font-bold">5 Open Now</span>
              </div>
            </div>
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
          />
        )}

        {/* 2. Real-Time ATS Scraped Live Openings Tab */}
        {activeTab === 'live' && (
          <LiveOpeningsFeed
            onSelectCompanyForPitch={handleSelectCompanyForPitch}
            candidateTargetBatch={profile?.targetBatch || 2028}
          />
        )}

        {/* 3. Company Hiring Cycles Calendar Tab */}
        {activeTab === 'cycles' && (
          <CompanyHiringCycles
            onSelectCompanyForPitch={handleSelectCompanyForPitch}
          />
        )}

        {/* 4. Flagship Hackathons & Competitions Tab */}
        {activeTab === 'hackathons' && (
          <HackathonsDirectory
            onSelectCompanyForPitch={handleSelectCompanyForPitch}
          />
        )}

        {/* 5. Student Programs & Fellowships Tab */}
        {activeTab === 'programs' && (
          <StudentPrograms
            onSelectCompanyForPitch={handleSelectCompanyForPitch}
          />
        )}

        {/* 6. Applications Kanban / Pipeline Tracker */}
        {activeTab === 'tracker' && (
          <ApplicationsTracker
            applications={applications}
            onStatusChange={handleStatusChange}
            onDeleteApplication={handleDeleteApplication}
          />
        )}

        {/* 7. Profile & Projects Manager */}
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

        {/* Global Notification Drawer */}
        <NotificationDrawer
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDeleteNotification={handleDeleteNotification}
          onSelectCompanyForPitch={handleSelectCompanyForPitch}
          onSendTestEmail={handleSendTestEmail}
          onCheckPortalsNow={handleCheckPortalsNow}
        />
      </main>

      <footer className="border-t border-stone-200/80 bg-white py-6 text-center text-xs text-stone-400">
        AutoReach • Autonomous Cold Outreach, Live ATS Monitoring & Placement Radar
      </footer>
    </div>
  );
}
