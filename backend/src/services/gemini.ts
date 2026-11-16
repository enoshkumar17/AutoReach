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

export type PitchStyle = 'five-line-founder' | 'proof-of-work' | 'short-casual' | 'value-prop';

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

/**
 * Ensures the email pitch strictly follows the clean multi-paragraph format
 * with explicit resume mention and complete candidate signature block.
 */
function formatProfessionalEmail(options: {
  rawBody: string;
  candidate: CandidateContext;
  companyName: string;
  role: string;
  recipientName?: string | null;
  matchedProjects: string[];
}): string {
  let body = options.rawBody.trim();

  // If the body doesn't mention the resume, ensure the resume sentence is included
  if (
    !body.toLowerCase().includes('resume is attached') &&
    !body.toLowerCase().includes('attached my resume') &&
    !body.toLowerCase().includes('resume attached')
  ) {
    const ctaPattern = /(Do you have 5-10 minutes|Would you be open|I would appreciate|Please let me know|Let me know if)/i;
    if (ctaPattern.test(body)) {
      body = body.replace(ctaPattern, 'My resume is attached for your review. $1');
    } else {
      body = `${body}\n\nMy resume is attached for your review. I would appreciate the chance for a quick 5-10 minute chat to discuss how I can add value to your team.`;
    }
  }

  // Construct complete candidate professional signature block
  const signatureLines = [
    'Best regards,',
    options.candidate.fullName,
    `${options.candidate.email}${options.candidate.phone ? ` | ${options.candidate.phone}` : ''}`,
  ];

  const links: string[] = [];
  if (options.candidate.linkedin) links.push(`LinkedIn: ${options.candidate.linkedin}`);
  if (options.candidate.github) links.push(`GitHub: ${options.candidate.github}`);
  if (options.candidate.portfolio) links.push(`Portfolio: ${options.candidate.portfolio}`);
  if (links.length > 0) {
    signatureLines.push(links.join(' | '));
  }
  const signatureBlock = signatureLines.join('\n');

  // Replace any existing informal sign-off (e.g. "Best, [Name]" or "Thanks, [Name]") with the full signature block
  const signoffRegex = /(Best regards|Best|Sincerely|Thanks|Warm regards|Cheers),?\s+.*$/is;
  if (signoffRegex.test(body)) {
    body = body.replace(signoffRegex, signatureBlock);
  } else {
    body = `${body}\n\n${signatureBlock}`;
  }

  // Normalize consecutive newlines so paragraphs are separated by exactly two newlines
  body = body.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  return body;
}

export interface ProcessOutreachOptions {
  apiKey?: string;
  rawText?: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  candidate: CandidateContext;
  pitchStyle?: PitchStyle;
  customInstructions?: string;
}

const singleExtractCache = new Map<string, ExtractedOutreach>();

export async function processOutreachInput(options: ProcessOutreachOptions): Promise<ExtractedOutreach> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please provide it in backend/.env or your settings.');
  }

  // Fast-path in-memory cache for text inputs
  const cacheKey = options.rawText && !options.imageBuffer
    ? `${options.rawText.trim()}_${options.pitchStyle || 'default'}_${options.customInstructions || ''}`
    : null;

  if (cacheKey && singleExtractCache.has(cacheKey)) {
    return singleExtractCache.get(cacheKey)!;
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

CRITICAL RULES:
1. EMAIL EXTRACTION RULE:
   - recipientEmail: ONLY extract an email address IF an email address is EXPLICITLY written in the provided text or clearly visible in the screenshot image (e.g., "send resumes to alex@company.com").
   - If NO email address is explicitly present or mentioned, you MUST set "recipientEmail": "".
   - DO NOT fabricate, guess, or search the internet for an email address. If none is written in the post, leave it as an empty string "".

2. ENTITY EXTRACTION:
   - companyName: The name of the company or startup hiring.
   - recipientName: The first name or full name of the recruiter/engineer who posted, if clearly visible. Otherwise null.
   - role: The specific job or internship role mentioned (e.g., "Software Engineering Intern"). Default to "Software Engineering Intern" if ambiguous.
   - jobType: "Internship" or "Full-time". Default to "Internship".

3. MATCH PROJECTS:
   - From the Candidate Profile, pick 1 or 2 projects that best fit the company's technology domain.

4. COLD EMAIL FORMATTING (MUST FOLLOW THIS EXACT 4-PARAGRAPH FORMAT WITH DOUBLE NEWLINES \\n\\n):
   - Paragraph 1 (Hook): Salutation ("Hi [Recipient Name]," or "Hi [Company Name] Team,") followed by 1 sentence expressing enthusiastic interest in the [Role].
   - Paragraph 2 (Technical Credibility & Hands-on Proof): "As a [Degree] student at [College], I have hands-on experience building [relevant domain]. Notably, I developed [Project 1 Title] utilizing [Tech Stack], [key technical accomplishment], as well as [Project 2 Title if relevant]."
   - Paragraph 3 (Call to Action & Resume): "My resume is attached for your review. I would appreciate the chance for a quick 5-10 minute chat to discuss how I can add value to your team."
   - Paragraph 4 (Sign-off & Complete Signature):
     Best regards,
     ${options.candidate.fullName}
     ${options.candidate.email}${options.candidate.phone ? ` | ${options.candidate.phone}` : ''}
     ${options.candidate.linkedin ? `LinkedIn: ${options.candidate.linkedin}` : ''}${options.candidate.github ? ` | GitHub: ${options.candidate.github}` : ''}

5. confidenceNotes:
   - If an email was found in the post: "Extracted recruiter email: [email]".
   - If NO email was in the post: "No email address found in the post. Please enter the recruiter's email."

${options.customInstructions ? `
6. CANDIDATE'S CUSTOM INSTRUCTIONS & SPECIAL MODIFICATIONS:
"""
${options.customInstructions}
"""
CRITICAL: You MUST strictly adapt the tone, focus, length, and content of emailBody to follow the above user modifications!
` : ''}

${options.pitchStyle === 'five-line-founder' ? `
7. PITCH STYLE: 5-LINE FOUNDER PROOF-OF-WORK (<60 WORDS, NO CORPORATE FLUFF)
- Tailored specifically for busy startup founders, CTOs, and tech leads (YC / Seed / Series A startups).
- Enforce EXACTLY 5 short, punchy lines with single blank lines between them:
  Line 1: Salutation + "Noticed [Company]'s recent expansion/work in [domain]."
  Line 2: "I'm a CS student at [College] specializing in [specialty], and built [Project 1 Title] ([Tech Stack])."
  Line 3: "Architecture & code: [GitHub/Live link if available, or brief technical highlight]"
  Line 4: "My resume is attached — would love to contribute to your engineering goals if you have an intern opening."
  Line 5: Best regards, \n${options.candidate.fullName} | ${options.candidate.email}
- HARD CONSTRAINT: Strict maximum 60 words total. Do NOT write long paragraphs, do NOT say "I hope this email finds you well", keep it razor sharp.
` : options.pitchStyle === 'short-casual' ? `
7. PITCH STYLE: SHORT & CASUAL (<65 words)
- Keep body ultra-concise under 65 words.
- Skip fluff, sound human and friendly.
` : options.pitchStyle === 'value-prop' ? `
7. PITCH STYLE: VALUE PROPOSITION
- Highlight direct business/engineering value and problem-solving capability.
` : `
7. PITCH STYLE: PROOF OF WORK
- Highlight concrete technical architecture and project implementations.
`}

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

  // ONLY accept email if explicitly present in parsed output
  const rawEmail = parsed.recipientEmail ? parsed.recipientEmail.trim() : '';
  const hasRealEmail = rawEmail.includes('@') && !fallbackEmailPatterns.includes(rawEmail);
  const finalEmail = hasRealEmail ? rawEmail : '';

  const matchedProjects = Array.isArray(parsed.matchedProjects) ? parsed.matchedProjects : [];
  const role = parsed.role || 'Software Engineering Intern';

  const formattedBody = formatProfessionalEmail({
    rawBody: parsed.emailBody || '',
    candidate: options.candidate,
    companyName,
    role,
    recipientName: parsed.recipientName,
    matchedProjects,
  });

  const result: ExtractedOutreach = {
    companyName: companyName,
    recipientName: parsed.recipientName || null,
    recipientEmail: finalEmail,
    role: role,
    jobType: parsed.jobType || 'Internship',
    matchedProjects: matchedProjects,
    emailSubject: parsed.emailSubject || `Internship Application: ${role} - ${options.candidate.fullName}`,
    emailBody: formattedBody,
    confidenceNotes: finalEmail
      ? `Extracted recruiter email: ${finalEmail}`
      : 'No email address found in post. Please enter the recipient email.',
    suggestedEmailPatterns: fallbackEmailPatterns,
  };

  if (cacheKey) {
    singleExtractCache.set(cacheKey, result);
  }

  return result;
}

export async function processBatchOutreachInput(options: {
  apiKey?: string;
  rawText?: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  candidate: CandidateContext;
  pitchStyle?: PitchStyle;
  customInstructions?: string;
}): Promise<BatchExtractionResult> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please provide it in backend/.env or your settings.');
  }

  const candidateProfileSummary = `
Candidate Profile:
- Name: ${options.candidate.fullName}
- Email: ${options.candidate.email}
- Phone: ${options.candidate.phone || 'N/A'}
- Education: ${options.candidate.degree || 'Student'} at ${options.candidate.college || 'University'}
- Links: LinkedIn: ${options.candidate.linkedin || 'N/A'} | GitHub: ${options.candidate.github || 'N/A'} | Portfolio: ${options.candidate.portfolio || 'N/A'}
- Projects Available:
${options.candidate.projects.map((p, idx) => `  ${idx + 1}. "${p.title}" (${p.tags}) - ${p.description}`).join('\n')}
`;

  const instructions = `
You are AutoReach, an AI agent specializing in processing multi-company hiring lists, recruiter spreadsheets, and LinkedIn company list screenshots.
Your task is to parse ALL companies listed in the image or text input (up to 30 companies).

CRITICAL RULES:
1. EMAIL EXTRACTION RULE:
   - recipientEmail: ONLY extract an email if an email address is EXPLICITLY written next to that company in the list (e.g. "Docker - jobs@docker.com").
   - If NO email address is explicitly provided for that company in the post/screenshot, you MUST set "recipientEmail": "".
   - DO NOT invent, guess, or default to careers@[domain]. Leave recipientEmail as "" unless explicitly written in the list.

2. DOMAIN & SUGGESTED PATTERNS:
   - domain: Root domain of the company (e.g., "docker.com", "symetra.com", "upstart.com").
   - emailPatterns: An array of 4 standard recruiter aliases:
     ["careers@[domain]", "recruiting@[domain]", "internships@[domain]", "jobs@[domain]"]

3. ROLE & PROJECTS:
   - role: "Software Engineering Intern" (or specific role if noted).
   - matchedProjects: 1 or 2 project titles from the candidate's portfolio that best fit this company's technical domain.

${options.pitchStyle === 'five-line-founder' ? `
4. COLD EMAIL FORMATTING - 5-LINE FOUNDER FORMULA (STRICTLY UNDER 60 WORDS TOTAL, 5 LINES):
   Line 1: Hi [Company Name] Team,
   Line 2: Came across [Company Name] and saw your rapid growth in this space.
   Line 3: Built [Project Title] ([Tech Stack]) which [one high-impact feature/metric].
   Line 4: Demo / GitHub: [liveUrl or githubUrl] - resume attached. Would love 5 mins to see if I can contribute.
   Line 5: Best, ${options.candidate.fullName} | ${options.candidate.email}
   (NO fluffy introductions, NO "I hope this email finds you well", NO corporate filler)
` : `
4. COLD EMAIL FORMATTING (MUST FOLLOW THIS EXACT 4-PARAGRAPH FORMAT WITH DOUBLE NEWLINES \\n\\n):
   - Paragraph 1: Salutation ("Hi [Company Name] Team,") followed by 1 sentence expressing interest in the [Role].
   - Paragraph 2: "As a [Degree] student at [College], I have hands-on experience building scalable applications. Notably, I developed [Project Title] utilizing [Tech Stack], [key technical accomplishment]."
   - Paragraph 3: "My resume is attached for your review. I would appreciate the chance for a quick 5-10 minute chat to discuss how I can add value to your team."
   - Paragraph 4:
     Best regards,
     ${options.candidate.fullName}
     ${options.candidate.email}${options.candidate.phone ? ` | ${options.candidate.phone}` : ''}
     ${options.candidate.linkedin ? `LinkedIn: ${options.candidate.linkedin}` : ''}${options.candidate.github ? ` | GitHub: ${options.candidate.github}` : ''}
`}

${options.customInstructions ? `USER CUSTOM TRAINING INSTRUCTIONS:\nApply these custom preferences to the generated pitch: "${options.customInstructions}"\n` : ''}

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

    // Check if real email was present in the list
    const rawEmail = item.recipientEmail ? item.recipientEmail.trim() : '';
    const hasRealEmail = rawEmail.includes('@') && !patterns.includes(rawEmail);
    const finalEmail = hasRealEmail ? rawEmail : '';

    const matchedProjects = Array.isArray(item.matchedProjects) ? item.matchedProjects : [];
    const role = item.role || 'Software Engineering Intern';

    const formattedBody = formatProfessionalEmail({
      rawBody: item.emailBody || '',
      candidate: options.candidate,
      companyName: name,
      role,
      recipientName: null,
      matchedProjects,
    });

    return {
      companyName: name,
      url: item.url || null,
      domain: domain,
      recipientEmail: finalEmail,
      emailPatterns: patterns,
      role: role,
      jobType: item.jobType || 'Internship',
      matchedProjects: matchedProjects,
      emailSubject: item.emailSubject || `Internship Application: ${role} - ${options.candidate.fullName}`,
      emailBody: formattedBody,
    };
  });

  return {
    companies,
    totalExtracted: companies.length,
    confidenceNotes: parsed.confidenceNotes || `Parsed ${companies.length} companies from list. Recruiter emails must be provided before sending.`,
  };
}

export interface ExtractedResumeData {
  fullName?: string;
  email?: string;
  phone?: string;
  college?: string;
  degree?: string;
  targetBatch?: number;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  skills?: string[];
  projects: Array<{
    title: string;
    description: string;
    tags: string;
    githubUrl?: string | null;
    liveUrl?: string | null;
  }>;
}

/**
 * Parses an uploaded Resume PDF using Gemini Multimodal document understanding
 */
export async function parseResumeWithGemini(options: {
  pdfBuffer: Buffer;
  apiKey?: string;
}): Promise<ExtractedResumeData> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please configure it in Settings first.');
  }

  const promptText = `
You are an expert technical resume parser and student career advisor.
Analyze this resume PDF and extract the candidate's complete profile information and portfolio projects.

EXTRACTION INSTRUCTIONS:
1. Contact & Education:
   - fullName: Full legal/professional name of candidate.
   - email: Email address.
   - phone: Phone number with country code if present.
   - college: University / College / Institute name.
   - degree: Degree title (e.g. "B.Tech Computer Science and Engineering", "B.E. Information Technology").
   - targetBatch: Expected graduation year as 4-digit number (e.g. 2026, 2027, 2028). Infer from dates if needed.
   - linkedin: LinkedIn profile link or username.
   - github: GitHub profile link or username.
   - portfolio: Personal portfolio URL if listed.
   - skills: Array of core languages, tools, frameworks (e.g. ["TypeScript", "Python", "React", "PostgreSQL"]).

2. Projects (Extract ALL technical / software engineering projects):
   For each project:
   - title: Name of project.
   - description: 1-2 punchy sentences describing what it does, architecture, and quantified impact (e.g. "Real-time collaborative code editor built with WebSockets and CRDTs, handling 100+ concurrent clients").
   - tags: Tech stack tags comma-separated (e.g. "React, Node.js, WebSockets, Redis").
   - githubUrl: GitHub link if provided on the resume, or null.
   - liveUrl: Live demo link if provided on the resume, or null.

Return ONLY a valid JSON object matching this schema:
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "college": "string",
  "degree": "string",
  "targetBatch": 2028,
  "linkedin": "string",
  "github": "string",
  "portfolio": "string",
  "skills": ["string"],
  "projects": [
    {
      "title": "string",
      "description": "string",
      "tags": "string",
      "githubUrl": "string or null",
      "liveUrl": "string or null"
    }
  ]
}
`;

  const parts = [
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: options.pdfBuffer.toString('base64'),
      },
    },
    { text: promptText },
  ];

  const requestPayload = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  };

  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
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

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `Model ${model} returned ${response.status}: ${errorText}`;
        continue;
      }

      const json = await response.json();
      const textCandidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textCandidate) {
        responseData = textCandidate;
        break;
      }
    } catch (err: any) {
      lastError = `Error calling model ${model}: ${err.message}`;
    }
  }

  if (!responseData) {
    throw new Error(`Failed to parse resume with Gemini models. ${lastError}`);
  }

  let parsed: any = {};
  try {
    const cleanedText = responseData.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanedText);
  } catch (err: any) {
    throw new Error(`Invalid JSON returned from Gemini resume parser: ${err.message}`);
  }

  return {
    fullName: parsed.fullName || '',
    email: parsed.email || '',
    phone: parsed.phone || '',
    college: parsed.college || '',
    degree: parsed.degree || '',
    targetBatch: typeof parsed.targetBatch === 'number' ? parsed.targetBatch : undefined,
    linkedin: parsed.linkedin || '',
    github: parsed.github || '',
    portfolio: parsed.portfolio || '',
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    projects: Array.isArray(parsed.projects)
      ? parsed.projects.map((p: any) => ({
          title: p.title || 'Untitled Project',
          description: p.description || '',
          tags: p.tags || 'Engineering',
          githubUrl: p.githubUrl || null,
          liveUrl: p.liveUrl || null,
        }))
      : [],
  };
}
