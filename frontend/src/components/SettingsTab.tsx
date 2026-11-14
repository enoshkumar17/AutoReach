import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
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
        gmailUser: gmailUser || envConfig?.gmailUser || '',
      });

      if (data.smtpVerification?.success) {
        setResultMsg({
          type: 'success',
          text: 'Credentials saved and Gmail SMTP connection verified.',
        });
      } else if (data.hasGmailConfig && !data.smtpVerification?.success) {
        setResultMsg({
          type: 'error',
          text: `Settings saved, but Gmail test failed: ${data.smtpVerification?.message}. Double-check your 16-character App Password.`,
        });
      } else {
        setResultMsg({
          type: 'success',
          text: 'Settings successfully saved.',
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
      <div className="bg-white border border-stone-200/80 rounded-2xl p-7 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-stone-900">API & Email Credentials</h2>
          <p className="text-sm text-stone-500 mt-1">
            Your credentials stay local on your computer and connect directly to Google's endpoints.
          </p>
        </div>

        <form onSubmit={handleSaveAndVerify} className="space-y-5">
          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-medium text-stone-700">
                Google Gemini API Key
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
              placeholder={envConfig?.hasGeminiKey ? '•••••••••••••••••••••••••••••••• (Configured)' : 'Paste API Key'}
              className="w-full bg-[#faf9f6]/60 border border-stone-200 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 font-mono"
            />
          </div>

          {/* Gmail Dispatcher */}
          <div className="space-y-3.5 pt-3 border-t border-stone-100">
            <label className="text-xs sm:text-sm font-medium text-stone-700 block">
              Gmail Dispatcher Configuration
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Your Gmail Address</label>
                <input
                  type="email"
                  value={gmailUser}
                  onChange={(e) => setGmailUser(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-[#faf9f6]/60 border border-stone-200 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-stone-600">Gmail App Password</label>
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
                  className="w-full bg-[#faf9f6]/60 border border-stone-200 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 font-mono"
                />
              </div>
            </div>

            <p className="text-xs text-stone-500 leading-normal bg-stone-50 p-3 rounded-lg border border-stone-200/60">
              Generate an App Password: Google Account → Security → 2-Step Verification → App Passwords → App name: "AutoReach".
            </p>
          </div>

          {resultMsg && (
            <div
              className={`p-3 rounded-lg text-sm flex items-center gap-2.5 ${
                resultMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {resultMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <span>{resultMsg.text}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isVerifying}
              className="px-5 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-sm font-medium transition disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Save & Verify
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
