export interface SpamAnalysis {
  score: number;
  status: 'OPTIMAL' | 'MODERATE' | 'RISKY';
  wordCount: number;
  issues: string[];
  recommendations: string[];
}

const SPAM_TRIGGER_WORDS = [
  '100%',
  'guarantee',
  'urgent',
  'act now',
  'risk-free',
  'free',
  'cash',
  'winner',
  'congratulations',
  'click here',
  'exclusive deal',
  'limited time',
  'no risk',
  'miracle',
  'make money',
];

export function analyzeEmailDeliverability(subject: string, body: string): SpamAnalysis {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const words = body.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Length analysis
  if (wordCount < 40) {
    score -= 15;
    issues.push('Pitch is too brief. Provide a bit more context about your projects.');
    recommendations.push('Aim for 70 to 120 words for maximum response rate.');
  } else if (wordCount > 140) {
    score -= 20;
    issues.push(`Length is ${wordCount} words. Recruiters read emails on mobile and quickly scan.`);
    recommendations.push('Trim to under 125 words so the recruiter reads your full pitch.');
  }

  // 2. Subject Line analysis
  if (subject.length > 60) {
    score -= 10;
    issues.push('Subject line is too long and may get truncated on mobile.');
    recommendations.push('Keep subject under 50 characters.');
  }
  if (subject === subject.toUpperCase() && subject.length > 5) {
    score -= 25;
    issues.push('Subject line is in ALL CAPS. This frequently triggers spam filters.');
    recommendations.push('Use standard title case or sentence case.');
  }
  if (subject.includes('!') || subject.includes('$$$')) {
    score -= 15;
    issues.push('Avoid exclamation marks or symbols in the subject.');
  }

  // 3. Spam trigger words check
  const lowerBody = body.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  const foundTriggers: string[] = [];

  for (const trigger of SPAM_TRIGGER_WORDS) {
    if (lowerBody.includes(trigger) || lowerSubject.includes(trigger)) {
      foundTriggers.push(trigger);
    }
  }

  if (foundTriggers.length > 0) {
    score -= foundTriggers.length * 15;
    issues.push(`Contains spam-associated trigger phrase(s): ${foundTriggers.join(', ')}.`);
    recommendations.push('Remove high-pressure marketing terms.');
  }

  // 4. Call to Action Check
  const hasCta =
    lowerBody.includes('chat') ||
    lowerBody.includes('call') ||
    lowerBody.includes('conversation') ||
    lowerBody.includes('time') ||
    lowerBody.includes('speak') ||
    lowerBody.includes('discuss');

  if (!hasCta) {
    score -= 10;
    issues.push('Missing a clear, low-friction Call to Action (e.g., asking for a 5-minute chat).');
    recommendations.push('End with: "Would you be open to a brief 5-minute chat this week?"');
  }

  score = Math.max(0, Math.min(100, score));

  let status: 'OPTIMAL' | 'MODERATE' | 'RISKY' = 'OPTIMAL';
  if (score < 65) status = 'RISKY';
  else if (score < 85) status = 'MODERATE';

  return {
    score,
    status,
    wordCount,
    issues,
    recommendations,
  };
}
