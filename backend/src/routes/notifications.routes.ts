import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { sendTestJobAlert, sendDailyDigestAlert, processAndNotifyListings } from '../services/jobAlertEngine.js';
import { syncLiveListings } from '../services/liveTracker.js';

const router = Router();

// GET /api/notifications - fetch all notifications + unread count
router.get('/', async (_req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { isRead: false },
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
    const id = parseInt(req.params.id as string, 10);
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ notification: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/mark-all-read - mark all as read
router.post('/mark-all-read', async (_req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
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
    const id = parseInt(req.params.id as string, 10);
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
    const { email } = req.body;
    const result = await sendTestJobAlert(email);
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
    const { email } = req.body;
    const result = await sendDailyDigestAlert(email);
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
