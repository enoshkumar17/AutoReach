export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface CandidateProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  college?: string | null;
  degree?: string | null;
  targetBatch?: number | null;
  targetRoles?: string | null;
  emailAlertsEnabled?: boolean;
  alertFrequency?: string;
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

export type PitchStyle = 'five-line-founder' | 'proof-of-work' | 'short-casual' | 'value-prop';

export interface QuotaInfo {
  sentToday: number;
  dailySafeLimit: number;
  remainingSafe: number;
  status: 'SAFE' | 'NEAR_LIMIT' | 'LIMIT_REACHED';
}

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
  isPersonalGmailConfigured?: boolean;
  gmailUser: string;
}

export interface LiveListingItem {
  id: string;
  company: string;
  companySlug: string;
  title: string;
  category: 'swe' | 'data_ml' | 'quant' | 'hardware' | 'product' | 'general';
  categoryLabel: string;
  roleType: 'Summer Intern' | '6-Month Intern' | 'PPO / Full-Time' | 'Internship';
  locations: string[];
  datePosted: string;
  postedAgoLabel: string;
  hoursOld: number;
  daysOld: number;
  isUrgentFresh: boolean;
  deadline: string;
  eligibleBatches: number[];
  eligibleBatchesLabel: string;
  degreeRequired: string;
  durationMonths: number | null;
  stipend: string;
  url: string;
  source: 'direct_ats' | 'official_feed';
  status: 'open' | 'closed';
  closedAt?: string | null;
  closedAgoLabel?: string | null;
}

export interface AppliedListingRecord {
  id: string;
  company: string;
  title: string;
  url: string;
  appliedAt: string;
}

export interface ArchivedListingRecord {
  id: string;
  company: string;
  title: string;
  archivedAt: string;
}

export interface NotificationItem {
  id: number;
  type: 'JOB_ALERT' | 'CLOSING_SOON' | 'HACKATHON' | 'SYSTEM';
  title: string;
  message: string;
  company?: string | null;
  role?: string | null;
  url?: string | null;
  batch?: number | null;
  matchScore: number;
  isRead: boolean;
  emailSent: boolean;
  createdAt: string;
}
