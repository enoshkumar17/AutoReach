import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

import profileRoutes from './routes/profile.routes.js';
import extractRoutes from './routes/extract.routes.js';
import applicationsRoutes from './routes/applications.routes.js';
import liveListingsRoutes from './routes/liveListings.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import { checkInboxForReplies } from './services/replyDetector.js';
import { syncLiveListings } from './services/liveTracker.js';
import { processAndNotifyListings } from './services/jobAlertEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically if needed
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API routes
app.use('/api/profile', profileRoutes);
app.use('/api/extract', extractRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/live-listings', liveListingsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'AutoReach Core API',
    version: '4.5.0',
    timestamp: new Date().toISOString(),
  });
});

// Production: Serve static frontend build if present
const possibleFrontendPaths = [
  path.join(__dirname, '../../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
];
const frontendDist = possibleFrontendPaths.find((p) => fs.existsSync(p));

if (frontendDist) {
  console.log(`[AutoReach] Serving static frontend from: ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[AutoReach API] Running smoothly at http://localhost:${PORT}`);

  // Initial background ATS scan and alert dispatch 5s after startup
  setTimeout(async () => {
    try {
      console.log('[JobAlertEngine] Performing startup live ATS scan & profile matching...');
      const listings = await syncLiveListings(false);
      const result = await processAndNotifyListings(listings);
      console.log(`[JobAlertEngine] Startup check complete: ${result.matchedCount} matched, ${result.emailsSent} email alerts sent.`);
    } catch (err: any) {
      console.warn(`[JobAlertEngine] Startup scan notice: ${err.message}`);
    }
  }, 5000);

  // Automated background live ATS scanner & email alert engine every 15 minutes
  setInterval(async () => {
    try {
      console.log('[JobAlertEngine] Running periodic live ATS scan for new batch opportunities...');
      const listings = await syncLiveListings(true);
      const result = await processAndNotifyListings(listings);
      if (result.matchedCount > 0) {
        console.log(`[JobAlertEngine] Dispatched ${result.emailsSent} new job alerts (${result.matchedCount} matches).`);
      }
    } catch (err: any) {
      console.warn(`[JobAlertEngine] Periodic scan notice: ${err.message}`);
    }
  }, 15 * 60 * 1000);

  // Automated background reply checker every 60 seconds
  setInterval(async () => {
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        await checkInboxForReplies();
      } catch (_) {}
    }
  }, 60 * 1000);
});
