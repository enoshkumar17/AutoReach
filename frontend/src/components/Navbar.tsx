import React from 'react';
import {
  Send,
  Zap,
  Calendar,
  Trophy,
  GraduationCap,
  BarChart3,
  User,
  Settings,
} from 'lucide-react';

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
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  sentCount,
  hasResume,
}) => {
  const navItems: Array<{
    id: TabType;
    label: string;
    icon: React.ReactNode;
    badge?: React.ReactNode;
  }> = [
    {
      id: 'outreach',
      label: 'Cold Outreach',
      icon: <Send className="h-3.5 w-3.5" />,
    },
    {
      id: 'live',
      label: 'Live Openings',
      icon: <Zap className="h-3.5 w-3.5" />,
      badge: <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />,
    },
    {
      id: 'cycles',
      label: 'Hiring Cycles',
      icon: <Calendar className="h-3.5 w-3.5" />,
    },
    {
      id: 'hackathons',
      label: 'Hackathons',
      icon: <Trophy className="h-3.5 w-3.5" />,
    },
    {
      id: 'programs',
      label: 'Student Programs',
      icon: <GraduationCap className="h-3.5 w-3.5" />,
    },
    {
      id: 'tracker',
      label: 'Applications',
      icon: <BarChart3 className="h-3.5 w-3.5" />,
      badge: sentCount > 0 ? (
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeTab === 'tracker'
              ? 'bg-amber-300 text-stone-900 border border-stone-800'
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
      icon: <User className="h-3.5 w-3.5" />,
      badge: !hasResume ? (
        <span className="h-2 w-2 rounded-full bg-amber-500" title="Resume required" />
      ) : null,
    },
  ];

  return (
    <header className="border-b-2 border-stone-800/80 bg-[#fbf9f5]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Product Identity */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
            onClick={() => setActiveTab('outreach')}
          >
            <div className="h-8 w-8 bg-stone-900 border-2 border-stone-900 -rotate-2 rounded-[6px_10px_7px_9px] shadow-[2px_2px_0px_#1c1917] flex items-center justify-center text-amber-200 group-hover:rotate-0 transition-transform">
              <span className="font-bold text-xs tracking-wider">AR</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-stone-900">
                AutoReach
              </span>
              <span className="hidden sm:inline-block font-hand text-xs font-bold px-2 py-0.5 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] bg-amber-200 text-amber-950 border border-stone-800 rotate-1 shadow-2xs">
                v2.8 sketchbook
              </span>
            </div>
          </div>

          {/* Navigation Items (Scrollable on small screens with irregular sketch buttons) */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer shrink-0 transition-all ${
                    isActive
                      ? 'bg-stone-900 text-amber-100 border-2 border-stone-900 shadow-[2px_2.5px_0px_#1c1917] rounded-[255px_18px_225px_18px/18px_225px_18px_255px] -rotate-[0.5deg]'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg'
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
              className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ml-1 border ${
                activeTab === 'settings'
                  ? 'bg-stone-900 text-amber-100 border-stone-900 shadow-[2px_2px_0px_#1c1917]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 border-transparent'
              }`}
              title="Settings & Credentials"
            >
              <Settings className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
