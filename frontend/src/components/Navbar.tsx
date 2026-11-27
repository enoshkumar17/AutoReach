import React from 'react';
import { AutoReachLogo } from './AutoReachLogo';
import {
  Send,
  Zap,
  Calendar,
  Trophy,
  GraduationCap,
  BarChart3,
  User as UserIcon,
  Settings,
  LogIn,
  LogOut,
} from 'lucide-react';
import type { AuthUser } from '../types';

export type TabType =
  | 'outreach'
  | 'live'
  | 'cycles'
  | 'hackathons'
  | 'programs'
  | 'tracker'
  | 'profile'
  | 'settings';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  sentCount: number;
  hasResume: boolean;
  user: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  sentCount,
  hasResume,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const navItems: Array<{
    id: TabType;
    label: string;
    icon: React.ReactNode;
    badge?: React.ReactNode;
  }> = [
    {
      id: 'outreach',
      label: 'Outreach',
      icon: <Send className="h-4 w-4" />,
    },
    {
      id: 'live',
      label: 'Live Openings',
      icon: <Zap className="h-4 w-4" />,
      badge: <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />,
    },
    {
      id: 'cycles',
      label: 'Hiring Cycles',
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      id: 'hackathons',
      label: 'Hackathons',
      icon: <Trophy className="h-4 w-4" />,
    },
    {
      id: 'programs',
      label: 'Programs',
      icon: <GraduationCap className="h-4 w-4" />,
    },
    {
      id: 'tracker',
      label: 'Applications',
      icon: <BarChart3 className="h-4 w-4" />,
      badge: sentCount > 0 ? (
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeTab === 'tracker'
              ? 'bg-stone-800 text-stone-200'
              : 'bg-stone-200 text-stone-700'
          }`}
        >
          {sentCount}
        </span>
      ) : null,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <UserIcon className="h-4 w-4" />,
      badge: !hasResume ? (
        <span className="h-2 w-2 rounded-full bg-amber-500" title="Resume required" />
      ) : null,
    },
  ];

  return (
    <header className="border-b border-stone-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1350px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Product Identity - Perched on A */}
          <AutoReachLogo
            size="sm"
            layout="perched"
            showBadge
            theme="light"
            onClick={() => setActiveTab('outreach')}
          />

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge}
                </button>
              );
            })}

            {/* Settings Icon */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-lg text-[13.5px] font-semibold transition-all cursor-pointer shrink-0 ml-0.5 ${
                activeTab === 'settings'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
              title="Settings & Credentials"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* User Account State / Sign In / Sign Out */}
            <div className="h-5 w-px bg-stone-200 mx-1 shrink-0" />

            {user ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2 pl-1 pr-2.5 py-1 bg-stone-100 hover:bg-stone-200/90 rounded-full border border-stone-200 text-[13px] font-semibold text-stone-900 transition-all cursor-pointer shadow-2xs shrink-0"
                  title={`Logged in as ${user.name} (${user.email})`}
                >
                  <div className="h-6 w-6 rounded-full bg-stone-900 text-amber-300 flex items-center justify-center text-[11px] font-bold uppercase shrink-0">
                    {user.name.charAt(0) || 'U'}
                  </div>
                  <span className="font-semibold text-[13px] text-stone-900 whitespace-nowrap">
                    {user.name.trim().split(' ')[0]}
                  </span>
                </button>

                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-full text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                  title="Sign out of AutoReach"
                  aria-label="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
