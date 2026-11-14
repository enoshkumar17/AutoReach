export interface CandidateContext {
  fullName: string;
  email: string;
  phone?: string | null;
  college?: string | null;
  degree?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
  projects: Array<{
    title: string;
    description: string;
    tags: string;
    githubUrl?: string | null;
    liveUrl?: string | null;
  }>;
}

export type PitchStyle = 'proof-of-work' | 'short-casual' | 'value-prop';

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
  suggestedEmailPatterns?: string[];
}

export interface BatchCompanyItem {
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
}

export interface BatchExtractionResult {
  companies: BatchCompanyItem[];
  totalExtracted: number;
  confidenceNotes: string;
}

export async function processOutreachInput(options: {
  apiKey?: string;
  rawText?: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  candidate: CandidateContext;
  pitchStyle?: PitchStyle;
}): Promise<ExtractedOutreach> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please provide it in backend/.env or your settings.');
  }

  const pitchStyle = options.pitchStyle || 'proof-of-work';
  let styleGuidance = '';
  if (pitchStyle === 'short-casual') {
    styleGuidance = 'Write an ultra-concise email (under 65 words). Friendly, conversational, asking for a brief 5-min coffee chat.';
  } else if (pitchStyle === 'value-prop') {
    styleGuidance = 'Emphasize the exact technical value candidate can deliver to their stack/product, referencing projects as proof.';
  } else {
    // proof-of-work (default for devs)
    styleGuidance = 'Highlight concrete proof-of-work: reference 1-2 live projects, GitHub links, and tech stack match. Keep it crisp (under 100 words).';
  }

  const candidateProfileSummary = `
Candidate Profile:
- Name: ${options.candidate.fullName}
- Email: ${options.candidate.email}
- Phone: ${options.candidate.phone || 'N/A'}
- Education: ${options.candidate.degree || 'Student'} at ${options.candidate.college || 'University'}
- Links: LinkedIn: ${options.candidate.linkedin || 'N/A'} | GitHub: ${options.candidate.github || 'N/A'} | Portfolio: ${options.candidate.portfolio || 'N/A'}
- Projects Available to Highlight:
${options.candidate.projects.map((p, idx) => `  ${idx + 1}. "${p.title}" (Tags: ${p.tags}) - ${p.description}`).join('\n')}
`;

  const instructions = `
You are AutoReach, an expert technical recruiter and executive outreach assistant.
Your task is to analyze the provided input (which is either a screenshot or pasted text of a job posting, recruiter tweet, LinkedIn post, or hiring announcement) and output structured JSON.

Follow these strict rules:
1. EXTRACT:
   - companyName: The name of the company or startup hiring.
   - recipientName: The first name or full name of the recruiter/founder/engineer who made the post, if visible. If not clearly mentioned, return null.
   - recipientEmail: The email address mentioned in the post/screenshot for sending resumes/applications. If not found, guess or construct a standard recruiter email (e.g. careers@company.com or recruiting@company.com).
   - role: The specific job or internship role mentioned (e.g., "Frontend Engineering Intern", "Full Stack Intern", "Software Engineering Intern").
   - jobType: "Internship" or "Full-time". Default to "Internship" if ambiguous.

2. MATCH PROJECTS:
   - From the Candidate Profile's available projects, select the 1 or 2 most relevant projects that demonstrate the exact skills required by the role.

3. PITCH STYLE & COLD EMAIL (${pitchStyle}):
   - ${styleGuidance}
   - emailSubject: Crisp, professional, high open-rate subject (e.g., "Software Engineering Intern - ${options.candidate.fullName} - Built [Project Name]").
   - emailBody: High-converting, authentic, concise cold email:
     - Salutation: "Hi [Recipient First Name]," if known, else "Hi [Company Name] Team,".
     - Opening: Mention you saw their announcement/post regarding the [Role].
     - Body: Highlight why you are a strong fit by naturally referencing 1 or 2 of the matched projects.
     - Call to Action: Politely mention your resume is attached and ask for a quick 5-10 minute conversation.
     - Sign-off: Candidate name, email, phone, and links.
   - confidenceNotes: 1 brief sentence explaining what was extracted.

Return ONLY valid JSON matching this schema:
{
  "companyName": "string",
  "recipientName": "string or null",
  "recipientEmail": "string",
  "role": "string",
  "jobType": "string",
  "matchedProjects": ["project title 1", "project title 2"],
  "emailSubject": "string",
  "emailBody": "string",
  "confidenceNotes": "string"
}
`;

  const parts: any[] = [];

  if (options.imageBuffer && options.mimeType) {
    parts.push({
      inlineData: {
        mimeType: options.mimeType,
        data: options.imageBuffer.toString('base64'),
      },
    });
  }

  const promptText = `
${candidateProfileSummary}

${options.rawText ? `Input Text from Job Post/Announcement:\n"""\n${options.rawText}\n"""` : 'Please analyze the attached image screenshot for job details.'}

${instructions}
`;

  parts.push({ text: promptText });

  const requestPayload = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  };

  const modelsToTry = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
  ];

  let responseData: any = null;
  let lastError: string = '';

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      const json = await response.json();
      if (json.candidates && json.candidates[0]?.content?.parts?.[0]?.text) {
        responseData = json.candidates[0].content.parts[0].text;
        break;
      } else if (json.error) {
        lastError = `Model ${model} error: ${json.error.message || json.error.code}`;
        console.warn(`[AutoReach] ${lastError}, falling back to next model...`);
      }
    } catch (err: any) {
      lastError = err.message;
      console.warn(`[AutoReach] Network error with ${model}: ${err.message}`);
    }
  }

  if (!responseData) {
    throw new Error(lastError || 'Failed to generate response from Gemini API.');
  }

  let parsed: any = {};
  try {
    const cleanedText = responseData.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanedText);
  } catch (_) {
    parsed = {};
  }

  const companyName = parsed.companyName || 'Target Company';
  const cleanDomain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  const fallbackEmailPatterns = [
    `careers@${cleanDomain}`,
    `recruiting@${cleanDomain}`,
    `internships@${cleanDomain}`,
    `jobs@${cleanDomain}`,
  ];

  return {
    companyName: companyName,
    recipientName: parsed.recipientName || null,
    recipientEmail: parsed.recipientEmail || `careers@${cleanDomain}`,
    role: parsed.role || 'Software Engineering Intern',
    jobType: parsed.jobType || 'Internship',
    matchedProjects: Array.isArray(parsed.matchedProjects) ? parsed.matchedProjects : [],
    emailSubject: parsed.emailSubject || `Internship Inquiry - ${options.candidate.fullName}`,
    emailBody: parsed.emailBody || '',
    confidenceNotes: parsed.confidenceNotes || 'Extraction complete.',
    suggestedEmailPatterns: fallbackEmailPatterns,
  };
}

export async function processBatchOutreachInput(options: {
  apiKey?: string;
  rawText?: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  candidate: CandidateContext;
  pitchStyle?: PitchStyle;
}): Promise<BatchExtractionResult> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please provide it in backend/.env or your settings.');
  }

  const pitchStyle = options.pitchStyle || 'proof-of-work';

  const candidateProfileSummary = `
Candidate Profile:
- Name: ${options.candidate.fullName}
- Email: ${options.candidate.email}
- Education: ${options.candidate.degree || 'Student'} at ${options.candidate.college || 'University'}
- Projects:
${options.candidate.projects.map((p, idx) => `  ${idx + 1}. "${p.title}" (${p.tags}) - ${p.description}`).join('\n')}
`;

  const instructions = `
You are AutoReach, an AI agent specializing in processing multi-company hiring lists, recruiter spreadsheets, and LinkedIn company list screenshots.
Your task is to parse ALL companies listed in the image or text input (up to 30 companies).

For EACH company found:
1. companyName: The clean company name (e.g., "Docker", "Symetra", "Upstart", "Cloudflare").
2. url: The link provided in the list if any (e.g. "http://www.symetra.com" or "https://lnkd.in/gfX5-pQG").
3. domain: The primary domain of the company (e.g., "docker.com", "symetra.com", "upstart.com", "cloudflare.com").
4. recipientEmail: The suggested primary cold outreach email. If no specific email is found in the text, use "careers@[domain]".
5. emailPatterns: An array of 4 standard recruiter aliases for this company:
   ["careers@[domain]", "recruiting@[domain]", "internships@[domain]", "jobs@[domain]"]
6. role: The target role (default to "Software Engineering Intern" unless another role is stated).
7. jobType: "Internship" or "Full-time". Default to "Internship".
8. matchedProjects: 1 or 2 project titles from the candidate's portfolio that best fit this company's domain.
9. emailSubject: High open-rate crisp subject: e.g. "Software Engineering Intern - ${options.candidate.fullName} - Built [Project Name]".
10. emailBody: A personalized, concise pitch (under 90 words):
    - "Hi [Company Name] Team,"
    - Mention you're a student developer who saw they're hiring for [Role].
    - Reference candidate's matched project with tech stack as proof of hands-on ability.
    - Low-friction CTA asking for 5-10 minutes to chat next week. Resume is attached.
    - Candidate sign-off.

Return ONLY valid JSON matching this schema:
{
  "companies": [
    {
      "companyName": "string",
      "url": "string or null",
      "domain": "string",
      "recipientEmail": "string",
      "emailPatterns": ["string", "string", "string", "string"],
      "role": "string",
      "jobType": "string",
      "matchedProjects": ["project title 1"],
      "emailSubject": "string",
      "emailBody": "string"
    }
  ],
  "confidenceNotes": "string"
}
`;

  const parts: any[] = [];

  if (options.imageBuffer && options.mimeType) {
    parts.push({
      inlineData: {
        mimeType: options.mimeType,
        data: options.imageBuffer.toString('base64'),
      },
    });
  }

  const promptText = `
${candidateProfileSummary}

${options.rawText ? `Input Text Listing Companies:\n"""\n${options.rawText}\n"""` : 'Please scan this image of hiring companies and parse every company entry.'}

${instructions}
`;

  parts.push({ text: promptText });

  const requestPayload = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  };

  const modelsToTry = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
  ];

  let responseData: any = null;
  let lastError: string = '';

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      const json = await response.json();
      if (json.candidates && json.candidates[0]?.content?.parts?.[0]?.text) {
        responseData = json.candidates[0].content.parts[0].text;
        break;
      } else if (json.error) {
        lastError = `Model ${model} error: ${json.error.message || json.error.code}`;
        console.warn(`[AutoReach Batch] ${lastError}, trying fallback...`);
      }
    } catch (err: any) {
      lastError = err.message;
      console.warn(`[AutoReach Batch] Network error with ${model}: ${err.message}`);
    }
  }

  if (!responseData) {
    throw new Error(lastError || 'Failed to generate batch response from Gemini API.');
  }

  let parsed: any = {};
  try {
    const cleanedText = responseData.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanedText);
  } catch (_) {
    parsed = {};
  }

  const rawList = Array.isArray(parsed.companies) ? parsed.companies : [];
  const companies: BatchCompanyItem[] = rawList.map((item: any) => {
    const name = item.companyName || 'Company';
    const domain = item.domain || name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    const patterns = Array.isArray(item.emailPatterns) && item.emailPatterns.length > 0
      ? item.emailPatterns
      : [`careers@${domain}`, `recruiting@${domain}`, `internships@${domain}`, `jobs@${domain}`];

    return {
      companyName: name,
      url: item.url || null,
      domain: domain,
      recipientEmail: item.recipientEmail || patterns[0],
      emailPatterns: patterns,
      role: item.role || 'Software Engineering Intern',
      jobType: item.jobType || 'Internship',
      matchedProjects: Array.isArray(item.matchedProjects) ? item.matchedProjects : [],
      emailSubject: item.emailSubject || `Software Engineering Intern - ${options.candidate.fullName}`,
      emailBody: item.emailBody || '',
    };
  });

  return {
    companies,
    totalExtracted: companies.length,
    confidenceNotes: parsed.confidenceNotes || `Extracted ${companies.length} companies from list.`,
  };
}
