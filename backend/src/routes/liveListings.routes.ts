import { Router, Request, Response } from 'express';
import { getLiveListings, syncLiveListings } from '../services/liveTracker.js';

const router = Router();

/**
 * GET /api/live-listings
 * Supports query params:
 *   q: search term (company or title or location)
 *   batch: target graduation year (e.g. 2026, 2027)
 *   category: 'swe', 'data_ml', 'quant', 'product', 'hardware'
 *   freshOnly: 'true' | 'false' (posted within 48h)
 *   status: 'open' | 'closed'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, batch, category, freshOnly, status } = req.query;

    const data = await getLiveListings({
      q: typeof q === 'string' ? q : undefined,
      batch: typeof batch === 'string' ? batch : undefined,
      category: typeof category === 'string' ? category : undefined,
      freshOnly: freshOnly === 'true' || freshOnly === '1',
      status: typeof status === 'string' ? status : undefined,
    });

    res.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error('[LiveListings API Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve live listings.',
      message: error.message,
    });
  }
});

/**
 * POST /api/live-listings/refresh
 * Force triggers on-demand re-fetch from upstream ATS endpoints & feeds
 */
router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    await syncLiveListings(true);
    const data = await getLiveListings();

    res.json({
      success: true,
      message: 'Live job listings refreshed successfully.',
      ...data,
    });
  } catch (error: any) {
    console.error('[LiveListings Refresh Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh live listings.',
      message: error.message,
    });
  }
});

/**
 * POST /api/live-listings/verify-link
 * Fast HEAD/GET status verification to confirm the official ATS job link is still live
 */
router.post('/verify-link', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Valid URL is required.' });
    }

    let isAlive = false;
    let statusCode = 0;

    try {
      const pingRes = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(4000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AutoReach-Verifier/4.0',
        },
      });
      statusCode = pingRes.status;
      isAlive = pingRes.ok || pingRes.status === 403 || pingRes.status === 401; // 403/401 indicates origin exists but enforces auth/session
    } catch {
      try {
        const getRes = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(4000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AutoReach-Verifier/4.0',
            'Range': 'bytes=0-100',
          },
        });
        statusCode = getRes.status;
        isAlive = getRes.ok || getRes.status === 206 || getRes.status === 403;
      } catch {
        isAlive = false;
      }
    }

    res.json({
      url,
      isAlive,
      statusCode,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
