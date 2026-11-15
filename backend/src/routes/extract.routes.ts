import { Router, Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../prisma.js';
import { processOutreachInput, processBatchOutreachInput, CandidateContext, PitchStyle } from '../services/gemini.js';

const router = Router();
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Single outreach extraction
router.post('/', memoryUpload.single('screenshot'), async (req: Request, res: Response) => {
  try {
    const rawText = req.body.text as string | undefined;
    const pitchStyle = (req.body.pitchStyle as PitchStyle) || 'proof-of-work';
    const customInstructions = req.body.customInstructions as string | undefined;
    const file = req.file;

    if (!rawText && !file) {
      return res.status(400).json({ error: 'Please provide either pasted text or an uploaded screenshot.' });
    }

    const profile = await prisma.candidateProfile.findFirst();
    const projects = await prisma.project.findMany();

    if (!profile) {
      return res.status(400).json({ error: 'Candidate profile not found. Please set up your profile first.' });
    }

    const candidateContext: CandidateContext = {
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
    const rawText = req.body.text as string | undefined;
    const pitchStyle = (req.body.pitchStyle as PitchStyle) || 'proof-of-work';
    const customInstructions = req.body.customInstructions as string | undefined;
    const file = req.file;

    if (!rawText && !file) {
      return res.status(400).json({ error: 'Please provide either pasted list text or an uploaded screenshot.' });
    }

    const profile = await prisma.candidateProfile.findFirst();
    const projects = await prisma.project.findMany();

    if (!profile) {
      return res.status(400).json({ error: 'Candidate profile not found. Please set up your profile first.' });
    }

    const candidateContext: CandidateContext = {
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
