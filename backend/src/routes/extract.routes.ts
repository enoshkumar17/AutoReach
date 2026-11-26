import { Router, Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../prisma.js';
import { processOutreachInput, processBatchOutreachInput, CandidateContext, PitchStyle } from '../services/gemini.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Protect extraction routes with auth
router.use(authMiddleware);

// Helper to assemble candidate context for the authenticated user
async function getAuthenticatedCandidateContext(userId: string): Promise<CandidateContext> {
  let profile = await prisma.candidateProfile.findUnique({ where: { userId } });
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

  const projects = await prisma.project.findMany({ where: { userId } });

  return {
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    college: profile.college,
    degree: profile.degree,
    linkedin: profile.linkedin,
    github: profile.github,
    portfolio: profile.portfolio,
    projects: projects.map((p) => ({
      title: p.title,
      description: p.description,
      tags: p.tags,
      githubUrl: p.githubUrl,
      liveUrl: p.liveUrl,
    })),
  };
}

// Single outreach extraction
router.post('/', memoryUpload.single('screenshot'), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const rawText = req.body.text as string | undefined;
    const pitchStyle = (req.body.pitchStyle as PitchStyle) || 'proof-of-work';
    const customInstructions = req.body.customInstructions as string | undefined;
    const file = req.file;

    if (!rawText && !file) {
      return res.status(400).json({ error: 'Please provide either pasted text or an uploaded screenshot.' });
    }

    const candidateContext = await getAuthenticatedCandidateContext(userId);

    const extraction = await processOutreachInput({
      rawText: rawText?.trim(),
      imageBuffer: file?.buffer,
      mimeType: file?.mimetype,
      candidate: candidateContext,
      pitchStyle,
      customInstructions: customInstructions?.trim(),
    });

    res.json({
      success: true,
      data: extraction,
      sourceType: file ? 'SCREENSHOT' : 'TEXT',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to extract and generate email draft.' });
  }
});

// Batch outreach list scanner (for multi-company lists, spreadsheets, LinkedIn screenshots)
router.post('/batch', memoryUpload.single('screenshot'), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const rawText = req.body.text as string | undefined;
    const pitchStyle = (req.body.pitchStyle as PitchStyle) || 'proof-of-work';
    const customInstructions = req.body.customInstructions as string | undefined;
    const file = req.file;

    if (!rawText && !file) {
      return res.status(400).json({ error: 'Please provide either pasted list text or an uploaded screenshot.' });
    }

    const candidateContext = await getAuthenticatedCandidateContext(userId);

    const batchResult = await processBatchOutreachInput({
      rawText: rawText?.trim(),
      imageBuffer: file?.buffer,
      mimeType: file?.mimetype,
      candidate: candidateContext,
      pitchStyle,
      customInstructions: customInstructions?.trim(),
    });

    res.json({
      success: true,
      data: batchResult,
      sourceType: file ? 'SCREENSHOT' : 'TEXT',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to scan batch hiring list.' });
  }
});

export default router;
