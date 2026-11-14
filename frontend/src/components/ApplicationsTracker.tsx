import React, { useState } from 'react';
import type { Application } from '../types';
import { Search, Mail, Calendar, Eye, Trash2, X, RefreshCw, CheckCircle2, Download, Send, Clock, LayoutGrid, List } from 'lucide-react';

interface ApplicationsTrackerProps {
  applications: Application[];
  onStatusChange: (id: number, newStatus: Application['status']) => void;
  onDeleteApplication: (id: number) => void;
  onApplicationsUpdated?: (apps: Application[]) => void;
}

export const ApplicationsTracker: React.FC<ApplicationsTrackerProps> = ({
  applications,
  onStatusChange,
  onDeleteApplication,
  onApplicationsUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedAppForView, setSelectedAppForView] = useState<Application | null>(null);
  const [selectedAppForFollowup, setSelectedAppForFollowup] = useState<Application | null>(null);
  const [followupText, setFollowupText] = useState('');
  const [isSendingFollowup, setIsSendingFollowup] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // Metrics
  const total = applications.length;
  const sent = applications.filter((a) => a.status === 'SENT').length;
  const followUpDue = applications.filter((a) => a.status === 'FOLLOW_UP_DUE').length;
  const replied = applications.filter((a) => a.status === 'REPLIED').length;
  const interview = applications.filter((a) => a.status === 'INTERVIEW').length;
  const responseRate = total > 0 ? Math.round(((replied + interview) / total) * 100) : 0;

  // Filtered applications
  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.recipientName && app.recipientName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCheckReplies = async () => {
    setIsSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/applications/check-replies', { method: 'POST' });
      const data = await res.json();
      if (data.applications && onApplicationsUpdated) {
        onApplicationsUpdated(data.applications);
      }
      setSyncMsg(data.message || 'Inbox check complete.');
      setTimeout(() => setSyncMsg(null), 5000);
    } catch (err: any) {
      setSyncMsg(err.message || 'Failed to check replies.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenFollowupModal = (app: Application) => {
    setSelectedAppForFollowup(app);
    const recipientSalutation = app.recipientName ? `Hi ${app.recipientName}` : `Hi ${app.companyName} Team`;
    setFollowupText(`${recipientSalutation},

I wanted to quickly follow up on my note below regarding the ${app.role} opportunity. I remain very interested in contributing to ${app.companyName}'s engineering goals.

Please let me know if you might have 5-10 minutes for a brief chat this week.

Best regards,`);
  };

  const handleSendFollowup = async () => {
    if (!selectedAppForFollowup) return;
    setIsSendingFollowup(true);

    try {
      const res = await fetch(`/api/applications/${selectedAppForFollowup.id}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customBody: followupText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch follow-up.');

      setSyncMsg(`Follow-up sent to ${selectedAppForFollowup.recipientEmail}! Thread updated.`);
      if (onApplicationsUpdated) {
        const refreshRes = await fetch('/api/applications');
        const refreshData = await refreshRes.json();
        if (refreshData.applications) onApplicationsUpdated(refreshData.applications);
      }

      setSelectedAppForFollowup(null);
      setTimeout(() => setSyncMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error sending follow-up');
    } finally {
      setIsSendingFollowup(false);
    }
  };

  const handleExportCSV = () => {
    if (applications.length === 0) return;
    const headers = ['Company', 'Role', 'Recipient Email', 'Recipient Name', 'Status', 'Sent Date', 'Notes'];
    const rows = applications.map((a) => [
      `"${a.companyName}"`,
      `"${a.role}"`,
      `"${a.recipientEmail}"`,
      `"${a.recipientName || ''}"`,
      `"${a.status}"`,
      `"${a.sentAt ? new Date(a.sentAt).toLocaleDateString() : ''}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `autoreach_applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: Application['status']) => {
    switch (status) {
      case 'SENT':
        return 'bg-stone-100 text-stone-700 border-stone-200';
      case 'FOLLOW_UP_DUE':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'REPLIED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'INTERVIEW':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-24">
      {/* Top Header Card & Metrics */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-6 sm:p-7 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-stone-900">Applications Pipeline</h2>
            <p className="text-sm text-stone-500 mt-1">
              Tracks sent pitches, monitors incoming replies, and schedules follow-up sequences.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Mode Switcher */}
            <div className="flex rounded-lg bg-stone-100 p-0.5 border border-stone-200/60 mr-1">
              <button
                onClick={() => setViewMode('list')}
                title="List View"
                className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                title="Kanban Board View"
                className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleCheckReplies}
              disabled={isSyncing}
              className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200/70 border border-stone-200 text-stone-800 text-sm font-medium flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-stone-600' : 'text-stone-500'}`} />
              {isSyncing ? 'Checking...' : 'Check Replies'}
            </button>

            {applications.length > 0 && (
              <button
                onClick={handleExportCSV}
                title="Export as CSV"
                className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200/70 border border-stone-200 text-stone-700 text-sm transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {syncMsg && (
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-stone-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{syncMsg}</span>
          </div>
        )}

        {/* Minimal Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-3 border-t border-stone-100">
          <div>
            <span className="text-xs font-medium text-stone-500 block">Total Pitches</span>
            <div className="text-2xl font-bold text-stone-900 mt-1">{total}</div>
          </div>
          <div>
            <span className="text-xs font-medium text-stone-500 block">Awaiting</span>
            <div className="text-2xl font-bold text-stone-700 mt-1">{sent}</div>
          </div>
          <div>
            <span className="text-xs font-medium text-amber-700 block">Follow-Up Due</span>
            <div className="text-2xl font-bold text-amber-700 mt-1">{followUpDue}</div>
          </div>
          <div>
            <span className="text-xs font-medium text-stone-500 block">Replies</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{replied}</div>
          </div>
          <div>
            <span className="text-xs font-medium text-stone-500 block">Response Rate</span>
            <div className="text-2xl font-bold text-stone-900 mt-1">{responseRate}%</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company, recruiter, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-sm flex-wrap">
          {['ALL', 'SENT', 'FOLLOW_UP_DUE', 'REPLIED', 'INTERVIEW', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-stone-900 text-stone-50 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
              }`}
            >
              {st === 'FOLLOW_UP_DUE' ? 'FOLLOW-UP' : st}
            </button>
          ))}
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { id: 'SENT', title: 'Sent (Awaiting)', items: filtered.filter((a) => a.status === 'SENT') },
            { id: 'FOLLOW_UP_DUE', title: 'Follow-Up Due', items: filtered.filter((a) => a.status === 'FOLLOW_UP_DUE') },
            { id: 'REPLIED', title: 'Replies / Q&A', items: filtered.filter((a) => a.status === 'REPLIED') },
            { id: 'INTERVIEW', title: 'Interviews 🎉', items: filtered.filter((a) => a.status === 'INTERVIEW') },
          ].map((col) => (
            <div key={col.id} className="bg-[#faf9f6]/70 border border-stone-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-stone-200/60">
                <span className="text-xs font-semibold text-stone-800">{col.title}</span>
                <span className="text-xs px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 font-medium">
                  {col.items.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {col.items.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-4">Empty</p>
                ) : (
                  col.items.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white border border-stone-200/90 rounded-lg p-3 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-stone-900">{app.companyName}</span>
                        {app.sentiment === 'INTERVIEW' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-medium">
                            Invite
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 truncate">{app.role}</p>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-stone-400">
                        <span>{new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenFollowupModal(app)}
                            title="Send follow-up"
                            className="p-1 text-stone-500 hover:text-stone-900"
                          >
                            <Send className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setSelectedAppForView(app)}
                            title="View email"
                            className="p-1 text-stone-500 hover:text-stone-900"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        filtered.length === 0 ? (
          <div className="bg-white border border-stone-200/80 rounded-xl p-12 text-center text-sm text-stone-400 shadow-xs">
            No applications matching this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="bg-white border border-stone-200/80 hover:border-stone-300 rounded-xl p-5 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-semibold text-sm sm:text-base text-stone-900">{app.companyName}</span>
                    <span className="text-sm text-stone-500">• {app.role}</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-md font-medium border ${getStatusBadge(
                        app.status
                      )}`}
                    >
                      {app.status === 'FOLLOW_UP_DUE' ? 'Follow-Up Due' : app.status}
                    </span>

                    {/* AI Sentiment Badge */}
                    {app.sentiment === 'INTERVIEW' && (
                      <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        🎉 Interview Offer
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3.5 text-xs sm:text-sm text-stone-500 flex-wrap">
                    <span className="flex items-center gap-1.5 font-mono text-stone-700">
                      <Mail className="h-3.5 w-3.5 text-stone-400" />
                      {app.recipientEmail}
                    </span>

                    <span className="flex items-center gap-1 text-stone-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(app.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    {app.followUpCount && app.followUpCount > 0 ? (
                      <span className="text-stone-500 text-xs">
                        • {app.followUpCount} follow-up(s) sent
                      </span>
                    ) : null}
                  </div>

                  {/* Notes / reply snippet */}
                  {app.notes && (
                    <p className="text-xs text-stone-700 bg-stone-50 px-3 py-1.5 rounded-md border border-stone-200/70 mt-1.5 max-w-xl truncate font-mono">
                      {app.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* 1-Click Follow-Up Action Button */}
                  <button
                    onClick={() => handleOpenFollowupModal(app)}
                    title="Send threaded follow-up bump"
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Clock className="h-3.5 w-3.5 text-stone-500" />
                    <span>Follow-Up</span>
                  </button>

                  <select
                    value={app.status}
                    onChange={(e) => onStatusChange(app.id, e.target.value as Application['status'])}
                    className="rounded-lg bg-stone-50 border border-stone-200 text-xs sm:text-sm text-stone-700 px-2.5 py-1.5 focus:outline-none focus:border-stone-400 cursor-pointer"
                  >
                    <option value="SENT">Sent (Awaiting)</option>
                    <option value="FOLLOW_UP_DUE">Follow-Up Due</option>
                    <option value="REPLIED">Replied</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="REJECTED">Soft Rejection</option>
                  </select>

                  <button
                    onClick={() => setSelectedAppForView(app)}
                    title="View sent email"
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => onDeleteApplication(app.id)}
                    title="Delete record"
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-700 transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Follow-Up Composer Modal */}
      {selectedAppForFollowup && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-lg animate-in fade-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-semibold text-stone-900 text-base">
                  Send Threaded Follow-Up
                </h3>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  To: {selectedAppForFollowup.recipientEmail} ({selectedAppForFollowup.companyName})
                </p>
              </div>
              <button
                onClick={() => setSelectedAppForFollowup(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-200/80">
              This follow-up nests directly in the same conversation thread in the recruiter's Gmail.
            </div>

            <textarea
              rows={7}
              value={followupText}
              onChange={(e) => setFollowupText(e.target.value)}
              className="w-full rounded-xl bg-[#faf9f6]/40 border border-stone-200 p-3.5 text-sm text-stone-900 focus:outline-none focus:border-stone-400 font-sans leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-stone-400">Resume PDF will be attached</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedAppForFollowup(null)}
                  className="px-4 py-2 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendFollowup}
                  disabled={isSendingFollowup}
                  className="px-5 py-2 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 text-sm font-medium flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSendingFollowup ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Follow-Up Bump
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Email Modal */}
      {selectedAppForView && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-lg">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
              <div>
                <h3 className="font-semibold text-stone-900 text-base">
                  Application to {selectedAppForView.companyName}
                </h3>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  To: {selectedAppForView.recipientEmail}
                </p>
              </div>
              <button
                onClick={() => setSelectedAppForView(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-sm bg-stone-50 p-3 rounded-lg border border-stone-200/80">
              <span className="text-stone-500 font-medium">Subject: </span>
              <span className="text-stone-900 font-medium">{selectedAppForView.emailSubject}</span>
            </div>

            <div className="flex-1 overflow-y-auto bg-stone-50/50 p-4 rounded-lg border border-stone-200/80 text-sm text-stone-800 whitespace-pre-wrap font-sans leading-relaxed">
              {selectedAppForView.emailBody}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAppForView(null)}
                className="px-4 py-2 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 text-sm font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
