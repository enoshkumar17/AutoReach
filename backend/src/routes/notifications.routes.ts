import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { sendTestJobAlert, sendDailyDigestAlert, processAndNotifyListings } from '../services/jobAlertEngine.js';
import { syncLiveListings } from '../services/liveTracker.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Protect notifications with auth
router.use(authMiddleware);

// GET /api/notifications - fetch all notifications + unread count scoped to user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { userId: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        isRead: false,
        OR: [
          { userId },
          { userId: null },
        ],
      },
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/notifications/:id/read - mark single notification as read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const id = parseInt(req.params.id as string, 10);

    const existing = await prisma.notification.findFirst({
      where: {
        id,
        OR: [{ userId }, { userId: null }],
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ notification: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/mark-all-read - mark all as read for current user
router.post('/mark-all-read', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    await prisma.notification.updateMany({
      where: {
        isRead: false,
        OR: [{ userId }, { userId: null }],
      },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notifications/:id - remove notification
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const id = parseInt(req.params.id as string, 10);

    const existing = await prisma.notification.findFirst({
      where: {
        id,
        OR: [{ userId }, { userId: null }],
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    await prisma.notification.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/test-email - send real test job alert email to candidate
router.post('/test-email', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { email } = req.body;
    const result = await sendTestJobAlert(email, userId);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/daily-digest - send morning digest email to candidate
router.post('/daily-digest', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { email } = req.body;
    const result = await sendDailyDigestAlert(email, userId);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/check-now - trigger immediate live ATS sync and alert evaluation
router.post('/check-now', async (_req: Request, res: Response) => {
  try {
    const listings = await syncLiveListings(true);
    const result = await processAndNotifyListings(listings);
    res.json({
      success: true,
      scannedCount: listings.length,
      matchedCount: result.matchedCount,
      emailsSent: result.emailsSent,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
