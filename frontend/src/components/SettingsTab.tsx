import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, UserCheck } from 'lucide-react';
import type { EnvConfig } from '../types';

interface SettingsTabProps {
  envConfig: EnvConfig | null;
  onConfigUpdated: (newConfig: EnvConfig) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ envConfig, onConfigUpdated }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [gmailUser, setGmailUser] = useState(envConfig?.gmailUser || '');
  const [gmailPassword, setGmailPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveAndVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setResultMsg(null);

    try {
      const res = await fetch('/api/profile/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiApiKey: geminiKey || undefined,
          gmailUser: gmailUser || undefined,
          gmailAppPassword: gmailPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update credentials.');

      onConfigUpdated({
        hasGeminiKey: data.hasGeminiKey,
        hasGmailConfig: data.hasGmailConfig,
        isPersonalGmailConfigured: data.isPersonalGmailConfigured,
        gmailUser: gmailUser || envConfig?.gmailUser || '',
      });

      if (data.smtpVerification?.success) {
        setResultMsg({
          type: 'success',
          text: 'Personal Gmail SMTP credentials saved and verified successfully!',
        });
      } else if (data.hasGmailConfig && !data.smtpVerification?.success) {
        setResultMsg({
          type: 'error',
          text: `Settings saved, but Gmail connection test failed: ${data.smtpVerification?.message}. Double-check your 16-character App Password.`,
        });
      } else {
        setResultMsg({
          type: 'success',
          text: 'Settings successfully updated.',
        });
      }
    } catch (err: any) {
      setResultMsg({ type: 'error', text: err.message || 'Error saving settings.' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-7 pb-24">
      {/* Platform Status Ribbon */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded-2xl p-5 text-white shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Platform AI Engine Active
          </span>
        </div>
        <p className="text-xs text-stone-300 leading-relaxed">
          AutoReach includes shared server-side Google Gemini AI. You and all secondary members (sisters, friends, classmates) can generate hyper-personalized pitches and parse resumes with zero technical API key setup!
        </p>
      </div>

      <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900">Personal Dispatcher & Credentials</h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Configure your personal Gmail credentials so cold outreach emails are sent directly from your own email address to recruiters.
          </p>
        </div>

        <form onSubmit={handleSaveAndVerify} className="space-y-5">
          {/* Gmail Dispatcher Configuration */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-semibold text-stone-800 block">
                Your Personal Gmail Account
              </label>
              {envConfig?.isPersonalGmailConfigured && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <UserCheck className="h-3 w-3" /> Connected
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Gmail Address</label>
                <input
                  type="email"
                  value={gmailUser}
                  onChange={(e) => setGmailUser(e.target.value)}
                  placeholder="your.name@gmail.com"
                  className="w-full bg-[#faf9f6]/80 border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-stone-600">Google App Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={gmailPassword}
                  onChange={(e) => setGmailPassword(e.target.value)}
                  placeholder={envConfig?.hasGmailConfig ? '•••••••••••••••• (Configured)' : '16-character code'}
                  className="w-full bg-[#faf9f6]/80 border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-mono"
                />
              </div>
            </div>

            <div className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 space-y-1.5">
              <p className="font-semibold text-stone-900">How to get your 16-character Google App Password:</p>
              <ol className="list-decimal list-inside space-y-1 text-stone-600">
                <li>Go to your Google Account (<a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="underline font-medium text-stone-900">Security Settings</a>).</li>
                <li>Ensure <strong>2-Step Verification</strong> is enabled.</li>
                <li>Search or click <strong>App passwords</strong>.</li>
                <li>Enter app name <span className="font-mono bg-stone-200/60 px-1 py-0.5 rounded text-[11px]">AutoReach</span> and copy the 16 characters.</li>
              </ol>
            </div>
          </div>

          {/* Gemini API Key (Optional Override) */}
          <div className="space-y-1.5 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-medium text-stone-700">
                Custom Gemini API Key <span className="text-stone-400 font-normal">(Optional Override)</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 underline font-medium"
              >
                Get free key <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder={envConfig?.hasGeminiKey ? 'Using Platform AI Key (Configured)' : 'Leave blank to use Platform AI'}
              className="w-full bg-[#faf9f6]/80 border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-mono"
            />
          </div>

          {resultMsg && (
            <div
              className={`p-3.5 rounded-xl text-sm flex items-start gap-2.5 ${
                resultMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {resultMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span>{resultMsg.text}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isVerifying}
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Save & Verify Credentials
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
