import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

import profileRoutes from './routes/profile.routes.js';
import extractRoutes from './routes/extract.routes.js';
import applicationsRoutes from './routes/applications.routes.js';
import { checkInboxForReplies } from './services/replyDetector.js';

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

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'AutoReach Core API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`[AutoReach API] Running smoothly at http://localhost:${PORT}`);

  // Automated background reply checker every 60 seconds
  setInterval(async () => {
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        await checkInboxForReplies();
      } catch (_) {}
    }
  }, 60 * 1000);
});
