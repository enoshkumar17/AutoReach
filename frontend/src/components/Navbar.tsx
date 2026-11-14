import React from 'react';
import { Send, BarChart3, User, Settings, Compass } from 'lucide-react';

interface NavbarProps {
  activeTab: 'outreach' | 'tracker' | 'guide' | 'profile' | 'settings';
  setActiveTab: (tab: 'outreach' | 'tracker' | 'guide' | 'profile' | 'settings') => void;
  sentCount: number;
  hasResume: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  sentCount,
  hasResume,
}) => {
  return (
    <header className="border-b border-stone-200/80 bg-[#faf9f6]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Identity */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveTab('outreach')}
          >
            <div className="h-8 w-8 rounded-lg bg-stone-900 flex items-center justify-center text-stone-50 shadow-xs">
              <span className="font-semibold text-xs tracking-wider">AR</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-stone-900">
                AutoReach
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-stone-200/70 text-stone-700">
                v2.0
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('outreach')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'outreach'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Send className="h-4 w-4" />
              <span>New Outreach</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Hiring Radar</span>
            </button>

            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all relative cursor-pointer ${
                activeTab === 'tracker'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Applications</span>
              {sentCount > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'tracker'
                      ? 'bg-stone-800 text-stone-300'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {sentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all relative cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Profile & Resume</span>
              {!hasResume && (
                <span className="h-2 w-2 rounded-full bg-amber-500" title="Resume required" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
              title="Settings & Credentials"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
