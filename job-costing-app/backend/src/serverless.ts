/**
 * Serverless-safe Express app entry point.
 * Only imports modules that compile cleanly for Vercel deployment.
 * No Socket.IO, no process signal handlers — safe for Vercel functions.
 */
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './modules/auth/auth.routes';
import onboardingRoutes from './modules/onboarding/onboarding.routes';
import { errorHandler } from './middleware/error.middleware';

const app: Express = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, /\.vercel\.app$/, 'http://localhost:5173']
  : '*';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigins as any, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

app.get('/api/health/db', async (_req: Request, res: Response) => {
  try {
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    // Mask the password in the URL for debugging
    const masked = dbUrl.replace(/:([^@]+)@/, ':****@');
    const { prisma } = await import('./config/database');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', url_preview: masked });
  } catch (error: any) {
    res.status(500).json({ status: 'error', database: 'failed', error: error.message, url_preview: (process.env.DATABASE_URL || 'NOT SET').replace(/:([^@]+)@/, ':****@') });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Stub routes for modules not yet serverless-ready
const stubRouter = express.Router();
stubRouter.all('*', (_req: Request, res: Response) => {
  res.status(503).json({ error: 'Not available', message: 'This module is not yet available in the serverless deployment' });
});

app.use('/api/jobs', stubRouter);
app.use('/api/costs', stubRouter);
app.use('/api/labor', stubRouter);
app.use('/api/budget', stubRouter);
app.use('/api/change-orders', stubRouter);
app.use('/api/invoices', stubRouter);
app.use('/api/reports', stubRouter);

app.use(errorHandler);

export default app;
