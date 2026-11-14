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

export default router;
