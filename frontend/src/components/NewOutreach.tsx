import React, { useState, useEffect } from 'react';
import { Upload, FileText, Send, CheckCircle2, AlertCircle, FileCheck, RefreshCw, X, Clipboard, ArrowRight, Eye } from 'lucide-react';
import type { CandidateProfile, ExtractedOutreach, Application, Project } from '../types';

interface NewOutreachProps {
  profile: CandidateProfile | null;
  projects?: Project[];
  onApplicationSent: (app: Application) => void;
  onNavigateToSettings: () => void;
  hasGeminiKey: boolean;
  hasGmailConfig: boolean;
}

export const NewOutreach: React.FC<NewOutreachProps> = ({
  profile,
  projects = [],
  onApplicationSent,
  onNavigateToSettings,
  hasGeminiKey,
  hasGmailConfig,
}) => {
  const [inputType, setInputType] = useState<'screenshot' | 'text'>('screenshot');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Draft state
  const [draft, setDraft] = useState<ExtractedOutreach | null>(null);
  const [sourceType, setSourceType] = useState<'SCREENSHOT' | 'TEXT'>('SCREENSHOT');
  const [attachResume, setAttachResume] = useState(true);

  // Global clipboard listener for Ctrl+V image pasting
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          setInputType('screenshot');
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
          setErrorMsg(null);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setErrorMsg(null);
      } else {
        setErrorMsg('Please drop an image file (PNG, JPG, WebP).');
      }
    }
  };

  const handleExtractAndDraft = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!hasGeminiKey) {
      setErrorMsg('Gemini API key is missing. Please configure it in Settings first.');
      return;
    }

    if (inputType === 'screenshot' && !selectedFile) {
      setErrorMsg('Please upload, drop, or press Ctrl+V to paste a screenshot.');
      return;
    }

    if (inputType === 'text' && !pastedText.trim()) {
      setErrorMsg('Please paste the job announcement text first.');
      return;
    }

    setIsExtracting(true);

    try {
      const formData = new FormData();
      if (inputType === 'screenshot' && selectedFile) {
        formData.append('screenshot', selectedFile);
      } else {
        formData.append('text', pastedText);
      }

      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract information from post.');
      }

      setDraft(data.data);
      setSourceType(data.sourceType);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong while analyzing the job posting.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleToggleProject = (projectTitle: string) => {
    if (!draft) return;
    const isCurrentlyMatched = draft.matchedProjects.includes(projectTitle);
    const newMatched = isCurrentlyMatched
      ? draft.matchedProjects.filter((p) => p !== projectTitle)
      : [...draft.matchedProjects, projectTitle];

    setDraft({ ...draft, matchedProjects: newMatched });
  };

  const handleSendEmail = async () => {
    if (!draft) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!draft.recipientEmail || !draft.recipientEmail.includes('@')) {
      setErrorMsg('Please provide a valid recipient email address.');
      return;
    }

    if (!hasGmailConfig) {
      setErrorMsg('Gmail credentials are not configured. Please set them in Settings.');
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch('/api/applications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: draft.companyName,
          recipientName: draft.recipientName,
          recipientEmail: draft.recipientEmail,
          role: draft.role,
          jobType: draft.jobType,
          emailSubject: draft.emailSubject,
          emailBody: draft.emailBody,
          matchedProjects: draft.matchedProjects,
          sourceType,
          attachResume,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch email.');
      }

      setSuccessMsg(`Application sent to ${draft.recipientEmail}. Successfully recorded in Applications tracker.`);
      onApplicationSent(data.application);

      setTimeout(() => {
        setDraft(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setPastedText('');
      }, 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while sending email.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTestToSelf = async () => {
    if (!draft || !profile?.email) {
      setErrorMsg('Candidate profile email is required to send a test copy.');
      return;
    }

    setIsSendingTest(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/applications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: `[PREVIEW TEST] ${draft.companyName}`,
          recipientName: profile.fullName,
          recipientEmail: profile.email,
          role: draft.role,
          jobType: draft.jobType,
          emailSubject: `[TEST PREVIEW] ${draft.emailSubject}`,
          emailBody: `--- THIS IS A TEST COPY OF YOUR OUTREACH PITCH ---\n\n${draft.emailBody}`,
          matchedProjects: draft.matchedProjects,
          sourceType,
          attachResume,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send test preview.');

      setSuccessMsg(`Test preview sent to your email (${profile.email}). Check your inbox!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending test email.');
    } finally {
      setIsSendingTest(false);
    }
  };

  const wordCount = draft?.emailBody ? draft.emailBody.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-24">
      {/* Subtle Setup Notice */}
      {(!hasGeminiKey || !hasGmailConfig || !profile?.hasResume) && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-sm text-amber-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-amber-600 shrink-0" />
            <span>
              Setup items pending: {!hasGeminiKey && 'Gemini Key • '}
              {!hasGmailConfig && 'Gmail Password • '}
              {!profile?.hasResume && 'Resume PDF'}
            </span>
          </div>
          <button
            onClick={onNavigateToSettings}
            className="text-amber-900 hover:text-amber-950 underline font-semibold text-sm"
          >
            Configure
          </button>
        </div>
      )}

      {/* Main Outreach Composer Card */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-7 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-stone-900">
              Generate Outreach Pitch
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Paste recruiter text or drop a screenshot. AutoReach extracts details and writes a tailored pitch.
            </p>
          </div>

          {/* Toggle pill */}
          <div className="flex rounded-lg bg-stone-100 p-1 border border-stone-200/60 self-start sm:self-auto">
            <button
              onClick={() => setInputType('screenshot')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
                inputType === 'screenshot'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              Screenshot
            </button>
            <button
              onClick={() => setInputType('text')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
                inputType === 'text'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Pasted Text
            </button>
          </div>
        </div>

        {/* Input Area */}
        {inputType === 'screenshot' ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center min-h-[190px] ${
              previewUrl
                ? 'border-stone-300 bg-stone-50/50'
                : 'border-stone-200 hover:border-stone-300 bg-[#faf9f6]/60'
            }`}
          >
            {previewUrl ? (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Post preview"
                  className="max-h-56 max-w-full rounded-lg border border-stone-200 object-contain mx-auto shadow-xs"
                />
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm text-stone-700 font-medium">{selectedFile?.name || 'Pasted image'}</span>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-sm text-stone-500 hover:text-rose-600 font-medium underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2.5 text-sm sm:text-base text-stone-700 font-medium">
                  <Clipboard className="h-4 w-4 text-stone-500" />
                  <span>
                    Press <kbd className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 text-xs font-mono border border-stone-200 shadow-2xs">Ctrl + V</kbd> to paste screenshot
                  </span>
                </div>
                <div className="text-sm text-stone-400">
                  or{' '}
                  <label className="cursor-pointer text-stone-800 hover:underline font-semibold">
                    browse image file
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        ) : (
          <textarea
            rows={6}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste hiring tweet, LinkedIn post, or role description..."
            className="w-full rounded-xl bg-[#faf9f6]/60 border border-stone-200 p-4 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 font-mono leading-relaxed"
          />
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-stone-400">
            Powered by Gemini Multimodal Vision
          </span>

          <button
            onClick={handleExtractAndDraft}
            disabled={isExtracting}
            className="px-5 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-sm font-medium transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing post...
              </>
            ) : (
              <>
                <span>Generate Outreach Pitch</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Draft Review & Send (Clean Paper Composer) */}
      {draft && (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-7 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                Ready to Review
              </span>
              <span className="text-sm text-stone-500">{draft.confidenceNotes}</span>
            </div>

            <button
              onClick={() => setDraft(null)}
              className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              title="Close"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Extracted Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Company</label>
              <input
                type="text"
                value={draft.companyName}
                onChange={(e) => setDraft({ ...draft, companyName: e.target.value })}
                className="w-full rounded-lg bg-[#faf9f6]/60 border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Recipient Name</label>
              <input
                type="text"
                value={draft.recipientName || ''}
                placeholder="Optional"
                onChange={(e) => setDraft({ ...draft, recipientName: e.target.value || null })}
                className="w-full rounded-lg bg-[#faf9f6]/60 border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Recipient Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={draft.recipientEmail}
                placeholder="recruiter@company.com"
                onChange={(e) => setDraft({ ...draft, recipientEmail: e.target.value })}
                className="w-full rounded-lg bg-[#faf9f6]/60 border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Target Role</label>
              <input
                type="text"
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                className="w-full rounded-lg bg-[#faf9f6]/60 border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400"
              />
            </div>
          </div>

          {/* Dynamic Project Toggle Chips */}
          {projects.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-medium text-stone-600 block">
                Candidate Projects (Click to toggle inclusion):
              </span>
              <div className="flex flex-wrap gap-2">
                {projects.map((proj) => {
                  const isSelected = draft.matchedProjects.includes(proj.title);
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => handleToggleProject(proj.title)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                        isSelected
                          ? 'bg-stone-900 text-stone-50 border-stone-900'
                          : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {proj.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">Subject</label>
            <input
              type="text"
              value={draft.emailSubject}
              onChange={(e) => setDraft({ ...draft, emailSubject: e.target.value })}
              className="w-full rounded-lg bg-[#faf9f6]/60 border border-stone-200 px-3.5 py-2 text-sm text-stone-900 font-medium focus:outline-none focus:border-stone-400"
            />
          </div>

          {/* Email Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-stone-600">Email Body</label>
              <span className="text-xs text-stone-400">
                {wordCount} words {wordCount >= 60 && wordCount <= 125 ? '(Optimal length)' : ''}
              </span>
            </div>
            <textarea
              rows={9}
              value={draft.emailBody}
              onChange={(e) => setDraft({ ...draft, emailBody: e.target.value })}
              className="w-full rounded-xl bg-[#faf9f6]/40 border border-stone-200 p-4 text-sm sm:text-[15px] text-stone-900 focus:outline-none focus:border-stone-400 font-sans leading-relaxed"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-stone-100">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-700 font-medium">
                <input
                  type="checkbox"
                  checked={attachResume}
                  onChange={(e) => setAttachResume(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-0 h-4 w-4"
                />
                <span>Attach Resume PDF</span>
              </label>

              {profile?.hasResume ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                  {profile.resumeFileName}
                </span>
              ) : (
                <span className="text-xs text-amber-600 font-medium">
                  (No resume uploaded)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              {profile?.email && (
                <button
                  type="button"
                  onClick={handleSendTestToSelf}
                  disabled={isSendingTest || isSending}
                  title="Send a test copy to your own email to preview format"
                  className="px-4 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  {isSendingTest ? 'Sending Test...' : 'Test to Myself'}
                </button>
              )}

              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSending || !draft.recipientEmail}
                className="px-5 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-sm transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Dispatch Application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
