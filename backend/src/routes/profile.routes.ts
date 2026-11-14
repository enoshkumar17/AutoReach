import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { prisma } from '../prisma.js';
import { verifyEmailCredentials } from '../services/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Multer storage for Resume PDF
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume_${Date.now()}${ext}`);
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

// GET /api/profile
router.get('/', async (_req: Request, res: Response) => {
  try {
    let profile = await prisma.candidateProfile.findFirst();
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (!profile) {
      // Default empty profile
      profile = await prisma.candidateProfile.create({
        data: {
          fullName: 'Your Name',
          email: 'your.email@gmail.com',
          phone: '',
          college: '',
          degree: 'B.Tech / B.S. in Computer Science',
          linkedin: '',
          github: '',
          portfolio: '',
        },
      });
    }

    const hasResume = !!(profile.resumePath && fs.existsSync(profile.resumePath));
    const resumeFileName = profile.resumePath ? path.basename(profile.resumePath) : null;

    res.json({
      profile: {
        ...profile,
        hasResume,
        resumeFileName,
      },
      projects,
      envConfig: {
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasGmailConfig: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
        gmailUser: process.env.GMAIL_USER || '',
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/profile - update details & upload resume
router.post('/', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, college, degree, linkedin, github, portfolio } = req.body;

    let profile = await prisma.candidateProfile.findFirst();

    const dataToUpdate: any = {
      fullName: fullName || profile?.fullName || 'Candidate',
      email: email || profile?.email || 'email@example.com',
      phone: phone ?? profile?.phone ?? '',
      college: college ?? profile?.college ?? '',
      degree: degree ?? profile?.degree ?? '',
      linkedin: linkedin ?? profile?.linkedin ?? '',
      github: github ?? profile?.github ?? '',
      portfolio: portfolio ?? profile?.portfolio ?? '',
    };

    if (req.file) {
      // If previous resume existed, delete it cleanly
      if (profile?.resumePath && fs.existsSync(profile.resumePath)) {
        try {
          fs.unlinkSync(profile.resumePath);
        } catch (_) {}
      }
      dataToUpdate.resumePath = req.file.path;
    }

    if (!profile) {
      profile = await prisma.candidateProfile.create({ data: dataToUpdate });
    } else {
      profile = await prisma.candidateProfile.update({
        where: { id: profile.id },
        data: dataToUpdate,
      });
    }

    res.json({
      success: true,
      profile: {
        ...profile,
        hasResume: !!(profile.resumePath && fs.existsSync(profile.resumePath)),
        resumeFileName: profile.resumePath ? path.basename(profile.resumePath) : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/profile/projects - add new project
router.post('/projects', async (req: Request, res: Response) => {
  try {
    const { title, description, tags, githubUrl, liveUrl } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const project = await prisma.project.create({
      data: {
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

// DELETE /api/profile/projects/:id - delete a project
router.delete('/projects/:id', async (req: Request, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId as string, 10);
    await prisma.project.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/profile/settings - update API credentials
router.post('/settings', async (req: Request, res: Response) => {
  try {
    const { geminiApiKey, gmailUser, gmailAppPassword } = req.body;

    if (geminiApiKey) process.env.GEMINI_API_KEY = geminiApiKey;
    if (gmailUser) process.env.GMAIL_USER = gmailUser;
    if (gmailAppPassword) process.env.GMAIL_APP_PASSWORD = gmailAppPassword;

    // Persist to .env file if feasible
    const envPath = path.join(__dirname, '../../.env');
    const envContent = `PORT=${process.env.PORT || 5000}
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY=${process.env.GEMINI_API_KEY || ''}
GMAIL_USER=${process.env.GMAIL_USER || ''}
GMAIL_APP_PASSWORD=${process.env.GMAIL_APP_PASSWORD || ''}
`;
    fs.writeFileSync(envPath, envContent, 'utf-8');

    let smtpTest = { success: false, message: 'Gmail credentials not provided.' };
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      smtpTest = await verifyEmailCredentials(process.env.GMAIL_USER, process.env.GMAIL_APP_PASSWORD);
    }

    res.json({
      success: true,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasGmailConfig: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      smtpVerification: smtpTest,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
