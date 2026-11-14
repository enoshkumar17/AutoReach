import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { sendApplicationEmail } from '../services/mailer.js';
import { checkInboxForReplies } from '../services/replyDetector.js';
import { analyzeEmailDeliverability } from '../services/spamChecker.js';

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

// POST /api/applications/analyze-spam - deliverability & spam analyzer
router.post('/analyze-spam', (req: Request, res: Response) => {
  try {
    const { subject = '', body = '' } = req.body;
    const analysis = analyzeEmailDeliverability(subject, body);
    res.json(analysis);
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
      followUpDue: applications.filter((a) => a.status === 'FOLLOW_UP_DUE').length,
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
        messageId: sendResult.messageId || null,
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

// POST /api/applications/:id/follow-up - 1-click threaded follow-up bump
router.post('/:id/follow-up', async (req: Request, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId as string, 10);
    const { customBody, attachResume = true } = req.body;

    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    const profile = await prisma.candidateProfile.findFirst();
    const recipientSalutation = app.recipientName ? `Hi ${app.recipientName}` : `Hi ${app.companyName} Team`;

    const defaultFollowupBody = customBody || `${recipientSalutation},

I wanted to quickly follow up on my note below regarding the ${app.role} role. I remain very enthusiastic about ${app.companyName} and would love to contribute to your engineering goals.

Please let me know if you might have 5-10 minutes for a brief chat this week.

Best regards,
${profile?.fullName || 'Candidate'}
${profile?.email || ''} | ${profile?.phone || ''}
${profile?.linkedin ? `LinkedIn: ${profile.linkedin}` : ''}`;

    const subject = app.emailSubject.startsWith('Re:') ? app.emailSubject : `Re: ${app.emailSubject}`;

    const sendResult = await sendApplicationEmail({
      to: app.recipientEmail,
      subject,
      body: defaultFollowupBody,
      resumePath: attachResume ? profile?.resumePath : null,
      inReplyTo: app.messageId || undefined,
      references: app.messageId || undefined,
    });

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: 'SENT',
        followUpCount: app.followUpCount + 1,
        lastFollowUpAt: new Date(),
        notes: `Follow-up #${app.followUpCount + 1} sent on ${new Date().toLocaleDateString()}`,
      },
    });

    res.json({
      success: true,
      message: `Follow-up #${updated.followUpCount} sent to ${app.recipientEmail}`,
      application: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send follow-up.' });
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
