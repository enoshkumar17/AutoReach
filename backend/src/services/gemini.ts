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

export async function processOutreachInput(options: {
  apiKey?: string;
  rawText?: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  candidate: CandidateContext;
}): Promise<ExtractedOutreach> {
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
   - recipientEmail: The email address mentioned in the post/screenshot for sending resumes/applications. If not found, return an empty string "".
   - role: The specific job or internship role mentioned (e.g., "Frontend Engineering Intern", "Full Stack Intern", "Software Engineering Intern").
   - jobType: "Internship" or "Full-time". Default to "Internship" if ambiguous.

2. MATCH PROJECTS:
   - From the Candidate Profile's available projects, select the 1 or 2 most relevant projects that demonstrate the exact skills required by the role.

3. WRITE PERSONALIZED COLD EMAIL:
   - emailSubject: Crisp, professional, high open-rate subject (e.g., "Internship Application: [Role] - [Candidate Name]").
   - emailBody: High-converting, authentic, concise cold email (under 120 words):
     - Salutation: "Hi [Recipient First Name]," if known, else "Hi [Company Name] Team,".
     - Opening: Mention you saw their announcement/post regarding the [Role].
     - Body: Highlight why you are a strong fit by naturally referencing 1 or 2 of the matched projects and the key technologies used.
     - Call to Action: Politely mention your resume is attached and ask for a quick 5-10 minute conversation.
     - Sign-off: Candidate name, email, phone, and links.
   - confidenceNotes: 1 brief sentence explaining what was extracted and any missing items (e.g. if email was not found).

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

  // Models to try in order of speed & availability
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
        break; // Success!
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

  // Parse JSON from model text
  let parsed: any = {};
  try {
    const cleanedText = responseData.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanedText);
  } catch (_) {
    parsed = {};
  }

  return {
    companyName: parsed.companyName || 'Target Company',
    recipientName: parsed.recipientName || null,
    recipientEmail: parsed.recipientEmail || '',
    role: parsed.role || 'Software Engineering Intern',
    jobType: parsed.jobType || 'Internship',
    matchedProjects: Array.isArray(parsed.matchedProjects) ? parsed.matchedProjects : [],
    emailSubject: parsed.emailSubject || `Internship Inquiry - ${options.candidate.fullName}`,
    emailBody: parsed.emailBody || '',
    confidenceNotes: parsed.confidenceNotes || 'Extraction complete.',
  };
}
