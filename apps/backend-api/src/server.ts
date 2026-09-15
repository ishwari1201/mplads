import express from 'express';
import cors from 'cors';
import path from 'path';
import { ENV } from './config/env';
import { connectRedis } from './config/redis';
import { SLAWorker } from './services/slaWorker';

import authRoutes from './routes/authRoutes';
import mpRoutes from './routes/mpRoutes';
import daRoutes from './routes/daRoutes';
import iaRoutes from './routes/iaRoutes';
import adminRoutes from './routes/adminRoutes';
import publicRoutes from './routes/publicRoutes';
import stateRoutes from './routes/stateRoutes';
import centralRoutes from './routes/centralRoutes';
import citizenRoutes from './routes/citizenRoutes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for site photos & docs
app.use('/storage/uploads', express.static(path.resolve(__dirname, ENV.UPLOAD_DIR)));
app.use('/storage/docs', express.static(path.resolve(__dirname, ENV.DOCS_DIR)));

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/mp', mpRoutes);
app.use('/api/v1/da', daRoutes);
app.use('/api/v1/ia', iaRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/state', stateRoutes);
app.use('/api/v1/central', centralRoutes);
app.use('/api/v1/citizen', citizenRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mplads-backend-api',
    timestamp: new Date().toISOString()
  });
});

// Periodic SLA Check Interval (Runs every 6 hours)
setInterval(async () => {
  console.log('[SLA Worker] Checking statutory 75-day sanction SLA deadlines...');
  const res = await SLAWorker.checkBreachedSLAs();
  if (res.breachedCount > 0) {
    console.warn(`[SLA Worker] Flagged ${res.breachedCount} breached recommendation sanctions.`);
  }
}, 6 * 60 * 60 * 1000);

app.listen(ENV.PORT, async () => {
  await connectRedis();
  console.log(`🚀 MPLADS Backend API server running on port ${ENV.PORT}`);
});

export default app;
