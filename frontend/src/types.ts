export interface CandidateProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  college?: string | null;
  degree?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
  resumePath?: string | null;
  hasResume: boolean;
  resumeFileName?: string | null;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  tags: string;
  githubUrl?: string | null;
  liveUrl?: string | null;
  createdAt: string;
}

export interface Application {
  id: number;
  companyName: string;
  recipientName?: string | null;
  recipientEmail: string;
  role: string;
  jobType: string;
  status: 'DRAFT' | 'SENT' | 'FOLLOW_UP_DUE' | 'REPLIED' | 'INTERVIEW' | 'REJECTED';
  emailSubject: string;
  emailBody: string;
  sourceType: 'SCREENSHOT' | 'TEXT';
  matchedProjects?: string | null;
  notes?: string | null;
  messageId?: string | null;
  followUpCount?: number;
  lastFollowUpAt?: string | null;
  sentiment?: 'INTERVIEW' | 'QUESTION' | 'REJECTED' | 'GENERAL' | null;
  replySnippet?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

export interface ExtractedOutreach {
  companyName: string;
  recipientName: string | null;
  recipientEmail: string;
  role: string;
  jobType: string;
  matchedProjects: string[];
  emailSubject: string;
  emailBody: string;
  confidenceNotes: string;
}

export interface SpamAnalysis {
  score: number;
  status: 'OPTIMAL' | 'MODERATE' | 'RISKY';
  wordCount: number;
  issues: string[];
  recommendations: string[];
}

export type PitchStyle = 'proof-of-work' | 'short-casual' | 'value-prop';

export interface BatchItem {
  id: string;
  companyName: string;
  url?: string | null;
  domain?: string | null;
  recipientEmail: string;
  emailPatterns: string[];
  role: string;
  jobType: string;
  matchedProjects: string[];
  emailSubject: string;
  emailBody: string;
  status: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  errorMessage?: string;
}

export interface BatchExtractionResult {
  companies: Array<{
    companyName: string;
    url?: string | null;
    domain?: string | null;
    recipientEmail: string;
    emailPatterns: string[];
    role: string;
    jobType: string;
    matchedProjects: string[];
    emailSubject: string;
    emailBody: string;
  }>;
  totalExtracted: number;
  confidenceNotes: string;
}

export interface EnvConfig {
  hasGeminiKey: boolean;
  hasGmailConfig: boolean;
  gmailUser: string;
}
