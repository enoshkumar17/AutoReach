import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { sendApplicationEmail } from '../services/mailer.js';
import { checkInboxForReplies } from '../services/replyDetector.js';
import { analyzeEmailDeliverability } from '../services/spamChecker.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Protect all application routes with auth
router.use(authMiddleware);

// POST /api/applications/check-replies - automatically scans Gmail inbox for recruiter replies
router.post('/check-replies', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const profile = await prisma.candidateProfile.findUnique({ where: { userId } });

    const user = profile?.gmailUser || process.env.GMAIL_USER;
    const pass = profile?.gmailAppPassword || process.env.GMAIL_APP_PASSWORD;

    const result = await checkInboxForReplies({ user, pass, userId });
    const applications = await prisma.application.findMany({
      where: { userId },
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

// GET /api/applications - list & statistics scoped to authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const applications = await prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sentTodayCount = applications.filter((a) => a.sentAt && new Date(a.sentAt) >= oneDayAgo).length;
    const quotaInfo = {
      sentToday: sentTodayCount,
      dailySafeLimit: 50,
      remainingSafe: Math.max(0, 50 - sentTodayCount),
      status: sentTodayCount >= 50 ? 'LIMIT_REACHED' : sentTodayCount >= 40 ? 'NEAR_LIMIT' : 'SAFE',
    };

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
      quotaInfo,
      applications,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/applications/send - approve & dispatch email with candidate resume
router.post('/send', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
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
      overrideQuota = false,
    } = req.body;

    if (!recipientEmail || !emailSubject || !emailBody) {
      return res.status(400).json({ error: 'Recipient email, subject, and email body are required.' });
    }

    // Security: sanitize against header injection and validate email syntax
    const sanitizedEmail = recipientEmail.replace(/[\r\n\t]/g, '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid recipient email format.' });
    }

    // Security & Deliverability Guard: Daily Quota Protection (50/day max per user)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sentToday = await prisma.application.count({
      where: {
        userId,
        sentAt: { gte: oneDayAgo },
      },
    });

    if (sentToday >= 50 && !overrideQuota) {
      return res.status(429).json({
        error: 'Daily safe sending quota reached (50 emails/24h). To protect your Gmail domain reputation from Google spam detection, wait until tomorrow or pass overrideQuota: true.',
        quotaReached: true,
      });
    }

    const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
    const resumePath = attachResume ? profile?.resumePath : null;

    // Use user's own Gmail credentials if saved, else fallback to platform
    const gmailUser = profile?.gmailUser || process.env.GMAIL_USER;
    const gmailAppPassword = profile?.gmailAppPassword || process.env.GMAIL_APP_PASSWORD;

    // Dispatch via nodemailer
    const sendResult = await sendApplicationEmail({
      to: sanitizedEmail,
      subject: emailSubject,
      body: emailBody,
      resumePath: resumePath,
      gmailUser,
      gmailAppPassword,
    });

    // Record in database isolated to this user
    const application = await prisma.application.create({
      data: {
        userId,
        companyName: companyName || 'Company',
        recipientName: recipientName || null,
        recipientEmail: sanitizedEmail,
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
    const userId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId as string, 10);
    const { customBody, attachResume = true } = req.body;

    const app = await prisma.application.findFirst({
      where: { id, userId },
    });
    if (!app) return res.status(404).json({ error: 'Application not found or unauthorized.' });

    const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
    const recipientSalutation = app.recipientName ? `Hi ${app.recipientName}` : `Hi ${app.companyName} Team`;

    const defaultFollowupBody = customBody || `${recipientSalutation},

I wanted to quickly follow up on my note below regarding the ${app.role} role. I remain very enthusiastic about ${app.companyName} and would love to contribute to your engineering goals.

Please let me know if you might have 5-10 minutes for a brief chat this week.

Best regards,
${profile?.fullName || 'Candidate'}
${profile?.email || ''} | ${profile?.phone || ''}
${profile?.linkedin ? `LinkedIn: ${profile.linkedin}` : ''}`;

    const subject = app.emailSubject.startsWith('Re:') ? app.emailSubject : `Re: ${app.emailSubject}`;

    const gmailUser = profile?.gmailUser || process.env.GMAIL_USER;
    const gmailAppPassword = profile?.gmailAppPassword || process.env.GMAIL_APP_PASSWORD;

    await sendApplicationEmail({
      to: app.recipientEmail,
      subject,
      body: defaultFollowupBody,
      resumePath: attachResume ? profile?.resumePath : null,
      gmailUser,
      gmailAppPassword,
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
    const userId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId as string, 10);
    const { status, notes } = req.body;

    const existing = await prisma.application.findFirst({
      where: { id, userId },
    });
    if (!existing) return res.status(404).json({ error: 'Application not found or unauthorized.' });

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
    const userId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId as string, 10);

    const existing = await prisma.application.findFirst({
      where: { id, userId },
    });
    if (!existing) return res.status(404).json({ error: 'Application not found or unauthorized.' });

    await prisma.application.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
