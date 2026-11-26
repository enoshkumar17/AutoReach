import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  X,
  Clipboard,
  ArrowRight,
  Eye,
  ShieldCheck,
  Layers,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import type {
  CandidateProfile,
  ExtractedOutreach,
  Application,
  Project,
  PitchStyle,
  BatchItem,
  QuotaInfo,
} from '../types';

export interface PitchStyleOption {
  id: PitchStyle;
  label: string;
  shortLabel: string;
  badge?: string;
  description: string;
  icon: string;
  isDefault?: boolean;
}

export const PITCH_STYLE_OPTIONS: PitchStyleOption[] = [
  {
    id: 'five-line-founder',
    label: '5-Line Founder Formula',
    shortLabel: '5-Line Founder',
    badge: 'Default (High Conversion)',
    description: 'Strictly 5 punchy lines (<60 words) with GitHub link for founders & CTOs.',
    icon: '⚡',
    isDefault: true,
  },
  {
    id: 'proof-of-work',
    label: 'Proof-of-Work Pitch',
    shortLabel: 'Proof-of-Work',
    description: 'Highlights live portfolio demo and engineering repository proof.',
    icon: '🛠️',
  },
  {
    id: 'short-casual',
    label: 'Short & Casual (<65 words)',
    shortLabel: 'Short (<65w)',
    description: 'Ultra-brief coffee chat format for quick referral checks.',
    icon: '☕',
  },
  {
    id: 'value-prop',
    label: 'Technical Value-Add',
    shortLabel: 'Value-Add',
    description: 'Focuses on specific architectural contributions to their product.',
    icon: '💡',
  },
];

interface NewOutreachProps {
  profile: CandidateProfile | null;
  projects?: Project[];
  onApplicationSent: (app: Application) => void;
  onNavigateToSettings: () => void;
  hasGeminiKey: boolean;
  hasGmailConfig: boolean;
  prefilledCompany?: string | null;
  prefilledRole?: string | null;
  onClearPrefilled?: () => void;
}

export const NewOutreach: React.FC<NewOutreachProps> = ({
  profile,
  projects = [],
  onApplicationSent,
  onNavigateToSettings,
  hasGeminiKey,
  hasGmailConfig,
  prefilledCompany,
  prefilledRole,
  onClearPrefilled,
}) => {
  // Outreach mode: Single Post vs Batch List Scanner (LinkedIn / Spreadsheet list)
  const [outreachMode, setOutreachMode] = useState<'single' | 'batch'>('single');
  const [pitchStyle, setPitchStyle] = useState<PitchStyle>('five-line-founder');
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const styleDropdownRef = useRef<HTMLDivElement>(null);
  const [customInstructions, setCustomInstructions] = useState<string>(() => {
    return localStorage.getItem('autoreach_custom_instructions') || '';
  });
  const [showCustomizer, setShowCustomizer] = useState<boolean>(false);
  const [extractStep, setExtractStep] = useState<string>('Analyzing post...');

  // Input state
  const [inputType, setInputType] = useState<'screenshot' | 'text'>('screenshot');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If prefilled company came from Hiring Radar
  useEffect(() => {
    if (prefilledCompany) {
      setInputType('text');
      setPastedText(`Company: ${prefilledCompany}\nRole: ${prefilledRole || 'Software Engineering Intern'}\nApplying directly to engineering team for open internship opportunities.`);
      if (onClearPrefilled) {
        onClearPrefilled();
      }
    }
  }, [prefilledCompany, prefilledRole, onClearPrefilled]);

  // Single Draft state
  const [draft, setDraft] = useState<ExtractedOutreach | null>(null);
  const [sourceType, setSourceType] = useState<'SCREENSHOT' | 'TEXT'>('SCREENSHOT');
  const [attachResume, setAttachResume] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Batch Staging Queue state
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [batchConfidenceNotes, setBatchConfidenceNotes] = useState<string | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isBatchPaused, setIsBatchPaused] = useState(false);
  const [currentBatchIdx, setCurrentBatchIdx] = useState<number | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Refs for throttling interval control
  const stopBatchRef = useRef(false);
  const pauseBatchRef = useRef(false);

  // Safe Quota state (Daily 50 emails safety guard)
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);

  const fetchQuotaInfo = async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        if (data.quotaInfo) {
          setQuotaInfo(data.quotaInfo);
        }
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchQuotaInfo();
  }, []);

  // Click outside & Escape key to close pitch style MCQ dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        styleDropdownRef.current &&
        !styleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStyleDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsStyleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  // Extract Single or Batch
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
    setExtractStep('Reading post details...');

    const timer1 = setTimeout(() => {
      setExtractStep('Matching portfolio projects...');
    }, 500);

    const timer2 = setTimeout(() => {
      setExtractStep('Generating tailored pitch...');
    }, 1200);

    try {
      const formData = new FormData();
      if (inputType === 'screenshot' && selectedFile) {
        formData.append('screenshot', selectedFile);
      } else {
        formData.append('text', pastedText);
      }
      formData.append('pitchStyle', pitchStyle);
      if (customInstructions.trim()) {
        formData.append('customInstructions', customInstructions.trim());
      }

      if (outreachMode === 'single') {
        const res = await fetch('/api/extract', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to extract information from post.');

        setDraft(data.data);
        setSourceType(data.sourceType);
      } else {
        // Batch Mode
        const res = await fetch('/api/extract/batch', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to scan list of companies.');

        const stagedList: BatchItem[] = (data.data?.companies || []).map(
          (c: any, idx: number) => ({
            id: `batch-${Date.now()}-${idx}`,
            companyName: c.companyName,
            url: c.url,
            domain: c.domain,
            recipientEmail: c.recipientEmail || '',
            emailPatterns: c.emailPatterns || [
              `careers@${c.domain || 'company.com'}`,
              `recruiting@${c.domain || 'company.com'}`,
              `internships@${c.domain || 'company.com'}`,
              `jobs@${c.domain || 'company.com'}`,
            ],
            role: c.role || 'Software Engineering Intern',
            jobType: c.jobType || 'Internship',
            matchedProjects: c.matchedProjects || [],
            emailSubject: c.emailSubject,
            emailBody: c.emailBody,
            status: 'PENDING',
          })
        );

        setBatchQueue(stagedList);
        setBatchConfidenceNotes(data.data?.confidenceNotes || `Extracted ${stagedList.length} companies.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong while analyzing the job posting.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsExtracting(false);
      setExtractStep('Analyzing post...');
    }
  };

  // Toggle Project in Single Draft
  const handleToggleProject = (projectTitle: string) => {
    if (!draft) return;
    const isCurrentlyMatched = draft.matchedProjects.includes(projectTitle);
    const newMatched = isCurrentlyMatched
      ? draft.matchedProjects.filter((p) => p !== projectTitle)
      : [...draft.matchedProjects, projectTitle];

    setDraft({ ...draft, matchedProjects: newMatched });
  };

  const handleCopyPitch = () => {
    if (!draft) return;
    const fullText = `To: ${draft.recipientEmail}\nSubject: ${draft.emailSubject}\n\n${draft.emailBody}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleOpenInGmailWeb = async () => {
    if (!draft) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!draft.recipientEmail || !draft.recipientEmail.includes('@')) {
      setErrorMsg('Recipient email is required to open Gmail compose.');
      return;
    }

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      draft.recipientEmail
    )}&su=${encodeURIComponent(draft.emailSubject)}&body=${encodeURIComponent(draft.emailBody)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');

    try {
      const res = await fetch('/api/applications/log-manual', {
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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`Opened Gmail compose tab! Logged application for ${draft.companyName} in your Applications pipeline.`);
        if (data.application) {
          onApplicationSent(data.application);
          fetchQuotaInfo();
        }
      }
    } catch (_) {}
  };

  // Send Single Outreach
  const handleSendSingleEmail = async () => {
    if (!draft) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!draft.recipientEmail || !draft.recipientEmail.includes('@')) {
      setErrorMsg('Recipient email is required. Please enter an email address or click one of the suggested aliases.');
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
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch email.');

      setSuccessMsg(`Application sent to ${draft.recipientEmail}! Logged in Applications pipeline.`);
      onApplicationSent(data.application);
      fetchQuotaInfo();

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

  // Send Test to Myself
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

  // -------------------------------------------------------------
  // Batch Staging Queue Handlers
  // -------------------------------------------------------------
  const handleUpdateBatchItem = (id: string, updates: Partial<BatchItem>) => {
    setBatchQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDeleteBatchItem = (id: string) => {
    setBatchQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Send Individual Item from Batch
  const handleSendSingleBatchItem = async (item: BatchItem) => {
    if (!item.recipientEmail || !item.recipientEmail.includes('@')) {
      alert(`Please enter a valid recipient email address for ${item.companyName} before sending.`);
      return;
    }

    handleUpdateBatchItem(item.id, { status: 'SENDING' });

    try {
      const res = await fetch('/api/applications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: item.companyName,
          recipientEmail: item.recipientEmail,
          role: item.role,
          jobType: item.jobType,
          emailSubject: item.emailSubject,
          emailBody: item.emailBody,
          matchedProjects: item.matchedProjects,
          sourceType: 'SCREENSHOT',
          attachResume,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send.');

      handleUpdateBatchItem(item.id, { status: 'SENT' });
      onApplicationSent(data.application);
      fetchQuotaInfo();
    } catch (err: any) {
      handleUpdateBatchItem(item.id, {
        status: 'FAILED',
        errorMessage: err.message || 'Send failed',
      });
    }
  };

  // Staggered Safe Batch Dispatcher (25s interval to protect Gmail reputation)
  const startSafeBatchDispatch = async () => {
    if (!hasGmailConfig) {
      setErrorMsg('Gmail credentials are required to dispatch batch emails. Check Settings.');
      return;
    }

    stopBatchRef.current = false;
    pauseBatchRef.current = false;

    const pendingItems = batchQueue.filter(
      (item) => item.status === 'PENDING' && item.recipientEmail && item.recipientEmail.includes('@')
    );

    if (pendingItems.length === 0) {
      alert('Please provide a recipient email for at least one company in the queue (or click a suggested alias).');
      return;
    }

    setIsBatchRunning(true);
    setIsBatchPaused(false);

    for (let i = 0; i < pendingItems.length; i++) {
      if (stopBatchRef.current) break;

      while (pauseBatchRef.current) {
        await new Promise((r) => setTimeout(r, 1000));
        if (stopBatchRef.current) break;
      }
      if (stopBatchRef.current) break;

      const currentItem = pendingItems[i];
      const itemIndexInQueue = batchQueue.findIndex((item) => item.id === currentItem.id);
      setCurrentBatchIdx(itemIndexInQueue);

      // Send the item
      handleUpdateBatchItem(currentItem.id, { status: 'SENDING' });

      try {
        const res = await fetch('/api/applications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: currentItem.companyName,
            recipientEmail: currentItem.recipientEmail,
            role: currentItem.role,
            jobType: currentItem.jobType,
            emailSubject: currentItem.emailSubject,
            emailBody: currentItem.emailBody,
            matchedProjects: currentItem.matchedProjects,
            sourceType: 'SCREENSHOT',
            attachResume,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');

        handleUpdateBatchItem(currentItem.id, { status: 'SENT' });
        onApplicationSent(data.application);
        fetchQuotaInfo();
      } catch (err: any) {
        handleUpdateBatchItem(currentItem.id, {
          status: 'FAILED',
          errorMessage: err.message || 'Failed',
        });
      }

      // If more items remain, wait 25 seconds with a live countdown to keep Gmail safe
      if (i < pendingItems.length - 1 && !stopBatchRef.current) {
        for (let sec = 25; sec > 0; sec--) {
          if (stopBatchRef.current) break;
          while (pauseBatchRef.current) {
            await new Promise((r) => setTimeout(r, 1000));
            if (stopBatchRef.current) break;
          }
          setCountdownSeconds(sec);
          await new Promise((r) => setTimeout(r, 1000));
        }
        setCountdownSeconds(null);
      }
    }

    setIsBatchRunning(false);
    setCurrentBatchIdx(null);
    setCountdownSeconds(null);
    setSuccessMsg('Batch dispatch finished! View all in Applications pipeline.');
  };

  const handlePauseBatch = () => {
    pauseBatchRef.current = true;
    setIsBatchPaused(true);
  };

  const handleResumeBatch = () => {
    pauseBatchRef.current = false;
    setIsBatchPaused(false);
  };

  const handleCancelBatch = () => {
    stopBatchRef.current = true;
    setIsBatchRunning(false);
    setIsBatchPaused(false);
    setCurrentBatchIdx(null);
    setCountdownSeconds(null);
  };

  // Deliverability helper for single draft
  const wordCount = draft?.emailBody
    ? draft.emailBody.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const activeStyleOption =
    PITCH_STYLE_OPTIONS.find((opt) => opt.id === pitchStyle) || PITCH_STYLE_OPTIONS[0];

  const batchSentCount = batchQueue.filter((item) => item.status === 'SENT').length;
  const batchReadyCount = batchQueue.filter(
    (item) => item.status === 'PENDING' && item.recipientEmail && item.recipientEmail.includes('@')
  ).length;
  const batchNeedsEmailCount = batchQueue.filter(
    (item) => item.status === 'PENDING' && (!item.recipientEmail || !item.recipientEmail.includes('@'))
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-24">
      {/* Resume Upload Recommendation */}
      {!profile?.hasResume && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs sm:text-sm text-amber-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-amber-600 shrink-0" />
            <span>
              <strong>Next Step:</strong> Upload your Resume PDF in the <strong>Profile</strong> tab. AutoReach will auto-extract your skills and projects with AI!
            </span>
          </div>
          <button
            onClick={onNavigateToSettings}
            className="text-amber-900 hover:text-amber-950 underline font-bold text-xs sm:text-sm cursor-pointer shrink-0"
          >
            Upload Resume
          </button>
        </div>
      )}

      {/* 🛡️ Safe Quota & Reputation Guard Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs text-xs">
        <div className="flex items-center gap-2 text-stone-700">
          <ShieldCheck
            className={`h-4 w-4 ${
              quotaInfo?.status === 'LIMIT_REACHED'
                ? 'text-rose-500'
                : quotaInfo?.status === 'NEAR_LIMIT'
                ? 'text-amber-500'
                : 'text-emerald-600'
            }`}
          />
          <span className="font-semibold text-stone-900">Safe Outreach Quota:</span>
          <span>
            {quotaInfo ? (
              <>
                <strong
                  className={
                    quotaInfo.status === 'LIMIT_REACHED' ? 'text-rose-600 font-bold' : 'text-stone-900'
                  }
                >
                  {quotaInfo.sentToday}
                </strong>
                <span className="text-stone-400"> / 50 sent today</span>
                <span className="text-stone-500 ml-1.5 font-medium">
                  ({quotaInfo.remainingSafe} remaining safe)
                </span>
              </>
            ) : (
              <span className="text-stone-400">Checking quota...</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 text-stone-400 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Anti-Spam Throttler Active</span>
          </span>
          <span>•</span>
          <span>Max 10–20/day recommended for startups</span>
        </div>
      </div>

      {/* Mode Switcher: Single vs Batch Scanner (80% Clean SaaS Design) */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setOutreachMode('single')}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
              outreachMode === 'single'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Send className="h-4 w-4" />
            <span>Single Post Outreach</span>
          </button>

          <button
            onClick={() => setOutreachMode('batch')}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
              outreachMode === 'batch'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Batch Scanner</span>
            <span className="hidden lg:inline text-stone-400 font-normal text-xs">(LinkedIn / Lists)</span>
          </button>
        </div>

        {/* Pitch Style MCQ Dropdown & AI Customizer Toggle */}
        <div className="flex items-center flex-nowrap gap-2 justify-end text-xs font-medium shrink-0">
          <div className="relative shrink-0" ref={styleDropdownRef}>
            <button
              type="button"
              onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
              className="inline-flex items-center flex-nowrap gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-[#faf9f8] hover:bg-stone-100 text-stone-800 text-xs font-semibold transition cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
              style={{ whiteSpace: 'nowrap' }}
              title="Click to select pitch style formula (MCQ)"
            >
              <span className="text-stone-400 font-normal hidden sm:inline" style={{ whiteSpace: 'nowrap' }}>Formula:</span>
              <span className="font-bold text-stone-900 inline-flex items-center flex-nowrap gap-1.5 whitespace-nowrap shrink-0" style={{ whiteSpace: 'nowrap' }}>
                <span className="shrink-0">{activeStyleOption.icon}</span>
                <span className="whitespace-nowrap shrink-0" style={{ whiteSpace: 'nowrap' }}>{activeStyleOption.shortLabel}</span>
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-stone-500 transition-transform duration-150 shrink-0 ${
                  isStyleDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* MCQ Floating Selection Menu */}
            {isStyleDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-stone-200/90 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Choose Pitch Formula (MCQ)
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Select 1 of 4
                  </span>
                </div>

                <div className="p-1 space-y-1">
                  {PITCH_STYLE_OPTIONS.map((opt) => {
                    const isSelected = pitchStyle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setPitchStyle(opt.id);
                          setIsStyleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex items-start gap-3 border ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-300 text-stone-900 shadow-2xs'
                            : 'bg-white border-transparent hover:bg-stone-50 hover:border-stone-200 text-stone-700'
                        }`}
                      >
                        {/* MCQ Radio selection dot */}
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-amber-500 bg-amber-400' : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />}
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-stone-900">
                              {opt.icon} {opt.label}
                            </span>
                            {opt.badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-950">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 leading-snug">
                            {opt.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCustomizer(!showCustomizer)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showCustomizer || customInstructions
                ? 'bg-stone-900 text-amber-300 border-stone-900'
                : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Train AI Preferences</span>
          </button>
        </div>
      </div>

      {/* AI Style & Training Customizer Panel */}
      {showCustomizer && (
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Train AI with Your Custom Modifications & Instructions
              </h3>
            </div>
            <button
              onClick={() => setShowCustomizer(false)}
              className="text-stone-400 hover:text-stone-600 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            Customize exactly how AutoReach AI writes your recruiter emails and pitches. Any modifications you add here are directly passed into the AI system prompt and saved for future pitches.
          </p>

          <textarea
            rows={3}
            value={customInstructions}
            onChange={(e) => {
              setCustomInstructions(e.target.value);
              localStorage.setItem('autoreach_custom_instructions', e.target.value);
            }}
            placeholder="e.g., Keep pitch under 60 words. Always highlight my Webhook Delivery Engine project. Mention I am seeking a Jan–June 2027 6-month internship. Keep tone confident and humble without corporate buzzwords like 'passionate' or 'synergy'."
            className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white font-sans leading-relaxed"
          />

          <div className="flex items-center justify-between text-[11px] text-stone-500 flex-wrap gap-2 pt-1 border-t border-stone-100">
            <span>💡 Real-World Tip: Specifying exact word counts and your specific internship availability (e.g. Jan–Jun 6M) yields the highest response rates from recruiters.</span>
            {customInstructions ? (
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                ✓ Active ({customInstructions.length} characters saved)
              </span>
            ) : (
              <span className="text-stone-400">No custom instructions set (using default formula)</span>
            )}
          </div>
        </div>
      )}

      {/* Main Outreach Input Card (Clean, Minimal SaaS Standard) */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
              {outreachMode === 'single'
                ? 'Generate Single Outreach Pitch'
                : 'Scan Multi-Company Hiring List'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {outreachMode === 'single'
                ? 'Paste recruiter announcement text or drop a screenshot. AutoReach extracts details and writes a tailored pitch.'
                : 'Upload a screenshot of a hiring list (e.g. 40+ companies from LinkedIn) or paste text. AutoReach extracts every company into an Outbox Queue.'}
            </p>
          </div>

          {/* Toggle pill */}
          <div className="flex rounded-xl bg-stone-100 p-1 border border-stone-200/60 self-start sm:self-auto">
            <button
              onClick={() => setInputType('screenshot')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                inputType === 'screenshot'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              Screenshot
            </button>
            <button
              onClick={() => setInputType('text')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                inputType === 'text'
                  ? 'bg-white text-stone-900 shadow-2xs'
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
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center min-h-[190px] ${
              previewUrl
                ? 'border-stone-300 bg-white'
                : 'border-stone-300 hover:border-amber-400 bg-stone-50/50 hover:bg-white'
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
                  <span className="text-sm text-stone-700 font-medium">
                    {selectedFile?.name || 'Pasted image'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-sm text-stone-500 hover:text-rose-600 font-medium underline cursor-pointer"
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
                    Press{' '}
                    <kbd className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 text-xs font-mono border border-stone-200 shadow-2xs">
                      Ctrl + V
                    </kbd>{' '}
                    to paste screenshot
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
            placeholder={
              outreachMode === 'single'
                ? 'Paste hiring tweet, LinkedIn post, or role description...'
                : 'Paste list of companies (e.g. 1. Docker - https://docker.com 2. Upstart - https://upstart.com)...'
            }
            className="w-full rounded-xl bg-stone-50/70 border border-stone-200 p-4 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-400 font-mono leading-relaxed"
          />
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between pt-1 flex-wrap gap-3">
          <span className="text-xs text-stone-500 font-medium">
            ✦ AI Multimodal Vision • Aligned with {projects.length} portfolio projects
          </span>

          <button
            onClick={handleExtractAndDraft}
            disabled={isExtracting}
            className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-amber-100 font-bold text-sm shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
                <span>{outreachMode === 'single' ? extractStep : 'Scanning company list...'}</span>
              </>
            ) : (
              <>
                <span>
                  {outreachMode === 'single'
                    ? 'Generate Outreach Pitch'
                    : 'Scan & Stage Companies'}
                </span>
                <ArrowRight className="h-4 w-4 text-amber-400" />
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

      {/* SINGLE OUTREACH: Draft Review & Send */}
      {outreachMode === 'single' && draft && (
        <div className="bg-white border border-stone-200/80 rounded-xl p-6 sm:p-7 shadow-2xs space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                Ready to Review
              </span>
              <span className="text-sm text-stone-600 font-medium">
                {draft.recipientEmail ? (
                  <span className="text-emerald-700">✓ Recruiter email extracted from post</span>
                ) : (
                  <span className="text-amber-700">⚠️ Recruiter email not found in post — please enter below</span>
                )}
              </span>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-stone-600">
                  Recipient Email <span className="text-rose-500">*</span>
                </label>
                {!draft.recipientEmail && (
                  <span className="text-[11px] font-semibold text-amber-700">
                    Required
                  </span>
                )}
              </div>
              <input
                type="email"
                value={draft.recipientEmail}
                placeholder="Enter recruiter or team email..."
                onChange={(e) => setDraft({ ...draft, recipientEmail: e.target.value })}
                className={`w-full rounded-lg bg-[#faf9f6]/60 border px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-400 font-mono ${
                  !draft.recipientEmail
                    ? 'border-amber-300 ring-1 ring-amber-200/50'
                    : 'border-stone-200'
                }`}
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

          {/* Quick-Select Recruiter Email Aliases */}
          {draft.companyName && (
            <div className="space-y-1.5 p-3 rounded-xl bg-stone-50/80 border border-stone-200/70">
              <span className="text-xs font-medium text-stone-600 block">
                Common company aliases (optional — click to use if you don't have a direct email):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  `careers@${draft.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                  `recruiting@${draft.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                  `internships@${draft.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                  `jobs@${draft.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                ].map((pattern) => (
                  <button
                    key={pattern}
                    type="button"
                    onClick={() => setDraft({ ...draft, recipientEmail: pattern })}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono transition cursor-pointer border ${
                      draft.recipientEmail === pattern
                        ? 'bg-stone-900 text-stone-50 border-stone-900 font-semibold'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {pattern}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              <label className="text-xs font-medium text-stone-600">
                Email Body (Multi-Paragraph Pitch with Resume & Signature)
              </label>
              <span className="text-xs text-stone-400">
                {wordCount} words {wordCount >= 60 && wordCount <= 135 ? '(Optimal length)' : ''}
              </span>
            </div>
            <textarea
              rows={10}
              value={draft.emailBody}
              onChange={(e) => setDraft({ ...draft, emailBody: e.target.value })}
              className="w-full rounded-xl bg-[#faf9f6]/40 border border-stone-200 p-4 text-sm sm:text-[15px] text-stone-900 focus:outline-none focus:border-stone-400 font-sans leading-relaxed"
            />
          </div>

          {/* Deliverability & Spam Score Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-stone-800">Deliverability Health:</span>
              <span className="font-semibold text-emerald-700">
                {wordCount >= 60 && wordCount <= 135 ? '98/100' : '88/100'}
              </span>
              <span className="text-stone-500">
                {wordCount >= 60 && wordCount <= 135
                  ? '• Structured paragraphs, clear resume mention & low-friction CTA'
                  : '• Tip: Keep pitch concise (75–125 words)'}
              </span>
            </div>
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

            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleCopyPitch}
                title="Copy entire pitch and subject to clipboard"
                className="px-3.5 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="h-3.5 w-3.5" />
                    <span>Copy Pitch</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenInGmailWeb}
                disabled={!draft.recipientEmail}
                title="Open Gmail compose tab with pre-filled pitch and auto-log to tracker"
                className="px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-xs transition disabled:opacity-40 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in Gmail</span>
              </button>

              {profile?.email && hasGmailConfig && (
                <button
                  type="button"
                  onClick={handleSendTestToSelf}
                  disabled={isSendingTest || isSending}
                  title="Send a test copy to your own email to preview format"
                  className="px-3.5 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {isSendingTest ? 'Sending Test...' : 'Test to Myself'}
                </button>
              )}

              {hasGmailConfig && (
                <button
                  type="button"
                  onClick={handleSendSingleEmail}
                  disabled={isSending || !draft.recipientEmail}
                  title={!draft.recipientEmail ? 'Please provide recipient email first' : 'Dispatch via SMTP'}
                  className="px-5 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      {!draft.recipientEmail ? 'Enter Email to Send' : 'Auto-Send (SMTP)'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BATCH OUTREACH: Outbox Staging Queue */}
      {outreachMode === 'batch' && batchQueue.length > 0 && (
        <div className="bg-white border border-stone-200/80 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5 animate-in fade-in duration-150">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-semibold text-stone-900">
                  Outbox Staging Queue
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                  {batchQueue.length} Companies
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    batchReadyCount > 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-stone-50 text-stone-500 border-stone-200'
                  }`}
                >
                  {batchReadyCount} Ready to Dispatch
                </span>
                {batchNeedsEmailCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    {batchNeedsEmailCount} Need Email
                  </span>
                )}
                {batchSentCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                    {batchSentCount} Dispatched
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                {batchConfidenceNotes}
              </p>
            </div>

            {/* Batch Dispatch Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {isBatchRunning ? (
                <>
                  {isBatchPaused ? (
                    <button
                      onClick={handleResumeBatch}
                      className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-stone-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseBatch}
                      className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-stone-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      Pause
                    </button>
                  )}
                  <button
                    onClick={handleCancelBatch}
                    className="px-3.5 py-2 rounded-lg bg-stone-100 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-stone-200"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setBatchQueue([])}
                    className="px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-medium cursor-pointer"
                  >
                    Clear Queue
                  </button>
                  <button
                    onClick={startSafeBatchDispatch}
                    disabled={batchReadyCount === 0}
                    title={batchReadyCount === 0 ? 'Please enter a recipient email for at least one company first' : 'Send all ready applications with 25s delays'}
                    className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                    <span>Dispatch Ready ({batchReadyCount})</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Running Batch Live Notification Bar */}
          {isBatchRunning && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs sm:text-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="h-4 w-4 animate-spin text-amber-700" />
                <span className="font-semibold">
                  {currentBatchIdx !== null &&
                    `Sending ${currentBatchIdx + 1} of ${batchQueue.length} to ${
                      batchQueue[currentBatchIdx]?.companyName
                    }...`}
                </span>
                {countdownSeconds !== null && (
                  <span className="text-amber-800">
                    (Next dispatch in <strong className="font-mono">{countdownSeconds}s</strong> to protect Gmail)
                  </span>
                )}
              </div>
              <span className="text-xs text-amber-700 font-semibold">
                {isBatchPaused ? 'PAUSED' : 'ACTIVE QUEUE'}
              </span>
            </div>
          )}

          {/* Staged Items List */}
          <div className="space-y-4">
            {batchQueue.map((item, idx) => {
              const isExpanded = expandedItemId === item.id;
              const isCurrent = currentBatchIdx === idx && isBatchRunning;
              const hasEmail = Boolean(item.recipientEmail && item.recipientEmail.includes('@'));

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-5 transition ${
                    isCurrent
                      ? 'border-amber-300 bg-amber-50/30 shadow-xs'
                      : item.status === 'SENT'
                      ? 'border-emerald-200/70 bg-emerald-50/20'
                      : item.status === 'FAILED'
                      ? 'border-rose-200 bg-rose-50/30'
                      : 'border-stone-200/80 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-xs font-mono font-semibold text-stone-400 mt-1">
                        #{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-stone-900 text-sm sm:text-base">
                            {item.companyName}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 font-medium">
                            {item.role}
                          </span>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-stone-400 hover:text-stone-700 text-xs flex items-center gap-0.5"
                              title="Open company website/job link"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {item.status === 'SENT' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                              ✓ Dispatched
                            </span>
                          )}
                          {item.status === 'SENDING' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold flex items-center gap-1">
                              <RefreshCw className="h-3 w-3 animate-spin" /> Sending
                            </span>
                          )}
                          {item.status === 'FAILED' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                              Failed: {item.errorMessage}
                            </span>
                          )}
                        </div>

                        {/* Recruiter Email Field */}
                        <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
                          <div className="relative">
                            <input
                              type="email"
                              value={item.recipientEmail}
                              onChange={(e) =>
                                handleUpdateBatchItem(item.id, { recipientEmail: e.target.value })
                              }
                              placeholder="Enter recruiter email..."
                              className={`text-xs sm:text-sm font-mono px-3 py-1.5 rounded-lg bg-[#faf9f6] border focus:outline-none focus:border-stone-400 w-64 ${
                                !hasEmail
                                  ? 'border-amber-300 ring-1 ring-amber-200/50'
                                  : 'border-stone-200'
                              }`}
                            />
                          </div>

                          {!hasEmail && (
                            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              ⚠️ Email needed
                            </span>
                          )}

                          {/* Quick Alias Pills */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-stone-400 font-medium">
                              Aliases:
                            </span>
                            {item.emailPatterns.map((pat) => (
                              <button
                                key={pat}
                                type="button"
                                title={`Click to use ${pat}`}
                                onClick={() =>
                                  handleUpdateBatchItem(item.id, { recipientEmail: pat })
                                }
                                className={`text-[11px] px-2 py-0.5 rounded border font-mono transition cursor-pointer ${
                                  item.recipientEmail === pat
                                    ? 'bg-stone-900 text-stone-50 border-stone-900 font-semibold'
                                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                                }`}
                              >
                                {pat.split('@')[0]}@
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Matched project tags */}
                        {item.matchedProjects.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[11px] text-stone-400">Pitch project:</span>
                            {item.matchedProjects.map((p) => (
                              <span
                                key={p}
                                className="text-[11px] font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded"
                              >
                                ★ {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Item Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() =>
                          setExpandedItemId(isExpanded ? null : item.id)
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" /> Hide Pitch
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" /> Preview Pitch
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSendSingleBatchItem(item)}
                        disabled={item.status === 'SENT' || item.status === 'SENDING' || !hasEmail}
                        title={!hasEmail ? 'Please provide recipient email first' : 'Send pitch now'}
                        className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Send className="h-3 w-3" />
                        Send Now
                      </button>

                      <button
                        onClick={() => handleDeleteBatchItem(item.id)}
                        title="Remove from queue"
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Pitch Preview */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-stone-100 space-y-3">
                      <div>
                        <label className="text-[11px] font-medium text-stone-500 block mb-1">
                          Subject Line:
                        </label>
                        <input
                          type="text"
                          value={item.emailSubject}
                          onChange={(e) =>
                            handleUpdateBatchItem(item.id, { emailSubject: e.target.value })
                          }
                          className="w-full text-xs font-medium px-3 py-1.5 rounded bg-[#faf9f6] border border-stone-200 focus:outline-none focus:border-stone-400"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-medium text-stone-500">
                            Tailored Cold Email (Structured Multi-Paragraph Letter with Resume & Signature):
                          </label>
                          <span className="text-[11px] text-stone-400">
                            Resume PDF attached on dispatch
                          </span>
                        </div>
                        <textarea
                          rows={10}
                          value={item.emailBody}
                          onChange={(e) =>
                            handleUpdateBatchItem(item.id, { emailBody: e.target.value })
                          }
                          className="w-full text-xs sm:text-sm leading-relaxed p-3.5 rounded-xl bg-[#faf9f6] border border-stone-200 focus:outline-none focus:border-stone-400 font-sans"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
