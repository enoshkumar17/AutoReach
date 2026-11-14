import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { sendApplicationEmail } from '../services/mailer.js';
import { checkInboxForReplies } from '../services/replyDetector.js';

const router = Router();

// POST /api/applications/check-replies - automatically scans Gmail inbox for recruiter replies
router.post('/check-replies', async (_req: Request, res: Response) => {
  try {
    const result = await checkInboxForReplies();
    const applications = await prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      ...result,
      applications,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/applications - list & statistics
router.get('/', async (_req: Request, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: applications.length,
      sent: applications.filter((a) => a.status === 'SENT').length,
      replied: applications.filter((a) => a.status === 'REPLIED').length,
      interview: applications.filter((a) => a.status === 'INTERVIEW').length,
      rejected: applications.filter((a) => a.status === 'REJECTED').length,
      draft: applications.filter((a) => a.status === 'DRAFT').length,
    };

    res.json({
      stats,
      applications,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/applications/send - approve & dispatch email with resume
router.post('/send', async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      recipientName,
      recipientEmail,
      role,
      jobType,
      emailSubject,
      emailBody,
      matchedProjects,
      sourceType,
      attachResume = true,
    } = req.body;

    if (!recipientEmail || !emailSubject || !emailBody) {
      return res.status(400).json({ error: 'Recipient email, subject, and email body are required.' });
    }

    const profile = await prisma.candidateProfile.findFirst();
    const resumePath = attachResume ? profile?.resumePath : null;

    // Dispatch via nodemailer
    const sendResult = await sendApplicationEmail({
      to: recipientEmail,
      subject: emailSubject,
      body: emailBody,
      resumePath: resumePath,
    });

    // Record in SQLite database
    const application = await prisma.application.create({
      data: {
        companyName: companyName || 'Company',
        recipientName: recipientName || null,
        recipientEmail: recipientEmail.trim(),
        role: role || 'Internship',
        jobType: jobType || 'Internship',
        status: 'SENT',
        emailSubject,
        emailBody,
        matchedProjects: Array.isArray(matchedProjects) ? matchedProjects.join(', ') : matchedProjects,
        sourceType: sourceType || 'TEXT',
        sentAt: new Date(),
        notes: `Sent with messageId: ${sendResult.messageId}`,
      },
    });

    res.status(201).json({
      success: true,
      message: `Application email successfully sent to ${recipientEmail}`,
      application,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to dispatch email.' });
  }
});

// PATCH /api/applications/:id/status - update tracking status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId as string, 10);
    const { status, notes } = req.body;

    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json({ success: true, application: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/applications/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId as string, 10);
    await prisma.application.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
