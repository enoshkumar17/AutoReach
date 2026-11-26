import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { prisma } from '../prisma.js';
import { verifyEmailCredentials } from '../services/mailer.js';
import { parseResumeWithGemini } from '../services/gemini.js';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Enforce authentication for all profile operations
router.use(authMiddleware);

// Multer storage for Resume PDF
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const userIdPrefix = req.userId ? `${req.userId}_` : '';
    cb(null, `resume_${userIdPrefix}${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for resume upload.'));
    }
  },
});

// Helper: Get or initialize CandidateProfile for authenticated user
async function getUserProfile(userId: string) {
  let profile = await prisma.candidateProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    profile = await prisma.candidateProfile.create({
      data: {
        userId,
        fullName: user?.name || 'Candidate',
        email: user?.email || 'email@example.com',
        degree: 'B.Tech / B.S. in Computer Science',
        targetBatch: 2028,
        targetRoles: 'SWE, SDE, Backend, Fullstack, Systems',
      },
    });
  }

  return profile;
}

// GET /api/profile
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const profile = await getUserProfile(userId);
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const hasResume = !!(profile.resumePath && fs.existsSync(profile.resumePath));
    const resumeFileName = profile.resumePath ? path.basename(profile.resumePath) : null;

    const userHasGmail = !!(profile.gmailUser && profile.gmailAppPassword);
    const platformHasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

    res.json({
      profile: {
        ...profile,
        hasResume,
        resumeFileName,
      },
      projects,
      envConfig: {
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasGmailConfig: userHasGmail || platformHasGmail,
        isPersonalGmailConfigured: userHasGmail,
        gmailUser: profile.gmailUser || process.env.GMAIL_USER || '',
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/profile - update details & upload resume
router.post('/', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const profile = await getUserProfile(userId);

    const {
      fullName,
      email,
      phone,
      college,
      degree,
      linkedin,
      github,
      portfolio,
      targetBatch,
      targetRoles,
      emailAlertsEnabled,
      alertFrequency,
      gmailUser,
      gmailAppPassword,
    } = req.body;

    const dataToUpdate: any = {
      fullName: fullName || profile.fullName || 'Candidate',
      email: email || profile.email || 'email@example.com',
      phone: phone ?? profile.phone ?? '',
      college: college ?? profile.college ?? '',
      degree: degree ?? profile.degree ?? '',
      linkedin: linkedin ?? profile.linkedin ?? '',
      github: github ?? profile.github ?? '',
      portfolio: portfolio ?? profile.portfolio ?? '',
    };

    if (gmailUser !== undefined) dataToUpdate.gmailUser = gmailUser;
    if (gmailAppPassword !== undefined) dataToUpdate.gmailAppPassword = gmailAppPassword;

    if (targetBatch !== undefined) {
      dataToUpdate.targetBatch = parseInt(targetBatch, 10) || 2028;
    }
    if (targetRoles !== undefined) {
      dataToUpdate.targetRoles = targetRoles;
    }
    if (emailAlertsEnabled !== undefined) {
      dataToUpdate.emailAlertsEnabled = emailAlertsEnabled === 'true' || emailAlertsEnabled === true;
    }
    if (alertFrequency !== undefined) {
      dataToUpdate.alertFrequency = alertFrequency;
    }

    if (req.file) {
      // Clean up previous resume file if present
      if (profile.resumePath && fs.existsSync(profile.resumePath)) {
        try {
          fs.unlinkSync(profile.resumePath);
        } catch (_) {}
      }
      dataToUpdate.resumePath = req.file.path;
    }

    const updatedProfile = await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: dataToUpdate,
    });

    res.json({
      success: true,
      profile: {
        ...updatedProfile,
        hasResume: !!(updatedProfile.resumePath && fs.existsSync(updatedProfile.resumePath)),
        resumeFileName: updatedProfile.resumePath ? path.basename(updatedProfile.resumePath) : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/profile/parse-resume - 1-click AI Resume PDF extraction
router.post('/parse-resume', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const profile = await getUserProfile(userId);

    let pdfBuffer: Buffer | null = null;
    let newResumePath: string | null = null;

    if (req.file) {
      pdfBuffer = fs.readFileSync(req.file.path);
      newResumePath = req.file.path;
    } else if (profile.resumePath && fs.existsSync(profile.resumePath)) {
      pdfBuffer = fs.readFileSync(profile.resumePath);
    }

    if (!pdfBuffer) {
      return res.status(400).json({ error: 'No resume PDF found. Please upload a resume PDF first.' });
    }

    const extracted = await parseResumeWithGemini({ pdfBuffer });

    // Update profile with extracted non-empty fields
    const updateData: any = {};
    if (extracted.fullName) updateData.fullName = extracted.fullName;
    if (extracted.email) updateData.email = extracted.email;
    if (extracted.phone) updateData.phone = extracted.phone;
    if (extracted.college) updateData.college = extracted.college;
    if (extracted.degree) updateData.degree = extracted.degree;
    if (extracted.targetBatch) updateData.targetBatch = extracted.targetBatch;
    if (extracted.linkedin) updateData.linkedin = extracted.linkedin;
    if (extracted.github) updateData.github = extracted.github;
    if (extracted.portfolio) updateData.portfolio = extracted.portfolio;
    if (newResumePath) updateData.resumePath = newResumePath;

    const updatedProfile = await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: updateData,
    });

    // Add extracted projects to database for this user if not duplicate
    const existingProjects = await prisma.project.findMany({ where: { userId } });
    const existingTitles = new Set(existingProjects.map((p) => p.title.toLowerCase().trim()));

    const newlyAddedProjects = [];
    for (const proj of extracted.projects) {
      if (!existingTitles.has(proj.title.toLowerCase().trim())) {
        const created = await prisma.project.create({
          data: {
            userId,
            title: proj.title,
            description: proj.description,
            tags: proj.tags || 'Engineering',
            githubUrl: proj.githubUrl || null,
            liveUrl: proj.liveUrl || null,
          },
        });
        newlyAddedProjects.push(created);
        existingTitles.add(proj.title.toLowerCase().trim());
      }
    }

    const allProjects = await prisma.project.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
    });

    res.json({
      success: true,
      message: `Parsed resume successfully: updated profile & extracted ${newlyAddedProjects.length} projects.`,
      extracted,
      profile: {
        ...updatedProfile,
        hasResume: !!(updatedProfile.resumePath && fs.existsSync(updatedProfile.resumePath)),
        resumeFileName: updatedProfile.resumePath ? path.basename(updatedProfile.resumePath) : null,
      },
      projects: allProjects,
      newlyAddedCount: newlyAddedProjects.length,
    });
  } catch (error: any) {
    console.error('[Resume Parser Route Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to parse resume.' });
  }
});

// POST /api/profile/projects - add new project
router.post('/projects', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, description, tags, githubUrl, liveUrl } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const project = await prisma.project.create({
      data: {
        userId,
        title,
        description,
        tags: tags || 'General',
        githubUrl: githubUrl || null,
        liveUrl: liveUrl || null,
      },
    });

    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/profile/projects/:id - delete a project (scoped to user)
router.delete('/projects/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId as string, 10);

    const project = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized.' });
    }

    await prisma.project.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/profile/settings - update personal SMTP credentials & check verification
router.post('/settings', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { geminiApiKey, gmailUser, gmailAppPassword } = req.body;

    const profile = await getUserProfile(userId);
    const updateData: any = {};

    if (gmailUser !== undefined) updateData.gmailUser = gmailUser;
    if (gmailAppPassword !== undefined) updateData.gmailAppPassword = gmailAppPassword;

    await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: updateData,
    });

    // Optional admin override of global server key if provided
    if (geminiApiKey && typeof geminiApiKey === 'string' && geminiApiKey.trim()) {
      process.env.GEMINI_API_KEY = geminiApiKey.trim();
    }

    const testUser = gmailUser || profile.gmailUser || process.env.GMAIL_USER;
    const testPass = gmailAppPassword || profile.gmailAppPassword || process.env.GMAIL_APP_PASSWORD;

    let smtpTest = { success: false, message: 'Gmail credentials not configured.' };
    if (testUser && testPass) {
      smtpTest = await verifyEmailCredentials(testUser, testPass);
    }

    res.json({
      success: true,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasGmailConfig: !!(testUser && testPass),
      isPersonalGmailConfigured: !!(gmailUser || profile.gmailUser),
      smtpVerification: smtpTest,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
