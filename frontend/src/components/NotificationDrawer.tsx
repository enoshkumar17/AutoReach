import React, { useState } from 'react';
import type { NotificationItem } from '../types';
import {
  Bell,
  X,
  CheckCircle2,
  ExternalLink,
  Send,
  Trash2,
  Sparkles,
  Flame,
  CheckCheck,
  RefreshCw,
  Mail,
  ShieldCheck,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: number) => void;
  onSelectCompanyForPitch: (companyName: string, role: string) => void;
  onSendTestEmail: () => Promise<{ success: boolean; message: string }>;
  onSendDailyDigest?: () => Promise<{ success: boolean; message: string }>;
  onCheckPortalsNow: () => Promise<void>;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onSelectCompanyForPitch,
  onSendTestEmail,
  onSendDailyDigest,
  onCheckPortalsNow,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'ALERTS' | 'URGENT'>('ALL');
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [checkingPortals, setCheckingPortals] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [browserPushEnabled, setBrowserPushEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'ALERTS') return n.type === 'JOB_ALERT';
    if (filter === 'URGENT') return n.type === 'CLOSING_SOON';
    return true;
  });

  const handleTestClick = async () => {
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await onSendTestEmail();
      setTestResult(res.message);
      setTimeout(() => setTestResult(null), 7000);
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendDigestClick = async () => {
    if (!onSendDailyDigest) return;
    setSendingDigest(true);
    setTestResult(null);
    try {
      const res = await onSendDailyDigest();
      setTestResult(res.message);
      setTimeout(() => setTestResult(null), 7000);
    } finally {
      setSendingDigest(false);
    }
  };

  const handleRequestPushPermission = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setBrowserPushEnabled(true);
          new Notification('⚡ AutoReach Radar Active', {
            body: 'Desktop notifications enabled! You will be alerted the second a matching SDE opening is verified.',
          });
          setTestResult('Desktop browser notifications successfully enabled!');
          setTimeout(() => setTestResult(null), 7000);
        } else {
          setTestResult('Desktop notification permission was not granted.');
        }
      } catch (err: any) {
        setTestResult('Unable to request notification permission: ' + err.message);
      }
    } else {
      setTestResult('Browser desktop notifications not supported by this browser.');
    }
  };

  const handleCheckNowClick = async () => {
    setCheckingPortals(true);
    try {
      await onCheckPortalsNow();
    } finally {
      setCheckingPortals(false);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);

      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days === 1) return 'Yesterday';
      return `${days}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200/90 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center relative shadow-2xs">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Immediate Career Alerts</h2>
              <span className="text-xs text-stone-500 font-medium">
                {unreadCount > 0 ? `${unreadCount} unread opportunities` : 'All alerts caught up'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Radar Actions Toolbar */}
        <div className="px-5 py-3 border-b border-stone-100 bg-[#fcfcfb] space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleCheckNowClick}
              disabled={checkingPortals}
              className="flex items-center gap-1.5 text-stone-700 hover:text-stone-950 font-semibold cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checkingPortals ? 'animate-spin text-amber-500' : 'text-stone-400'}`} />
              <span>{checkingPortals ? 'Checking Portals...' : 'Sync 100+ Portals'}</span>
            </button>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-stone-500 hover:text-stone-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-stone-100/80 flex-wrap">
            <button
              onClick={handleTestClick}
              disabled={sendingTest}
              className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50 text-[11px]"
            >
              <Mail className="h-3 w-3 text-amber-600" />
              <span>{sendingTest ? 'Sending...' : 'Test Instant Alert'}</span>
            </button>

            {onSendDailyDigest && (
              <button
                onClick={handleSendDigestClick}
                disabled={sendingDigest}
                className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50 text-[11px]"
              >
                <span>☀️</span>
                <span>{sendingDigest ? 'Generating...' : 'Send Morning Digest'}</span>
              </button>
            )}

            <button
              onClick={handleRequestPushPermission}
              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 cursor-pointer transition ${
                browserPushEnabled
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Bell className="h-3 w-3 text-stone-500" />
              <span>{browserPushEnabled ? 'Desktop Push Active' : 'Enable Desktop Push'}</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div className="mx-5 my-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="px-5 py-2.5 border-b border-stone-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
              filter === 'ALL'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
              filter === 'UNREAD'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('ALERTS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
              filter === 'ALERTS'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            🎯 Job Matches
          </button>
          <button
            onClick={() => setFilter('URGENT')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
              filter === 'URGENT'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            🔥 Fast Closing
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-stone-800">No notifications found</h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                AutoReach continuously monitors Workday, Greenhouse, Taleo, and 100+ company portals. When a job matching your batch drops, you will see it here and in your inbox!
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isUrgent = n.type === 'CLOSING_SOON';

              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition-all duration-150 relative space-y-2.5 ${
                    n.isRead
                      ? 'bg-white border-stone-200/80 hover:border-stone-300'
                      : 'bg-[#fafbfd] border-amber-300/80 shadow-2xs'
                  }`}
                >
                  {/* Top Bar: Match Score & Time */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                        {n.matchScore}% Profile Match
                      </span>
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Flame className="h-2.5 w-2.5 text-amber-600" />
                          Closes &lt;48h
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-stone-400">
                      <span>{formatRelativeTime(n.createdAt)}</span>
                      <button
                        onClick={() => onDeleteNotification(n.id)}
                        className="text-stone-300 hover:text-rose-500 cursor-pointer p-0.5"
                        title="Dismiss notification"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Message */}
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 leading-snug">
                      {n.title}
                    </h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {n.message}
                    </p>
                  </div>

                  {/* Email Sent Tag */}
                  {n.emailSent && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>Alert email delivered to your inbox</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {n.url && (
                        <a
                          href={n.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => onMarkAsRead(n.id)}
                          className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <span>Apply on Portal</span>
                          <ExternalLink className="h-3 w-3 text-stone-300" />
                        </a>
                      )}

                      {n.company && (
                        <button
                          onClick={() => {
                            onMarkAsRead(n.id);
                            onSelectCompanyForPitch(n.company || '', n.role || 'Software Engineering Intern');
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Send className="h-3 w-3 text-stone-400" />
                          <span>Draft Pitch</span>
                        </button>
                      )}
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={() => onMarkAsRead(n.id)}
                        className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 cursor-pointer"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-stone-200/90 bg-stone-50 text-[11px] text-stone-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Direct ATS Adapter Polling Active
          </span>
          <span className="font-mono text-[10px]">AutoReach v3.0</span>
        </div>
      </div>
    </div>
  );
};
