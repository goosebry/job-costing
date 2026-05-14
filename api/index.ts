import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Vercel Serverless Entry Point ───────────────────────────────────────────
// Wraps the full Express app as a single serverless function.
// Socket.IO is disabled in serverless — notifications use client-side polling.

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Route modules
import authRoutes from '../job-costing-app/backend/src/modules/auth/auth.routes';
import jobsRoutes from '../job-costing-app/backend/src/modules/jobs/jobs.routes';
import costsRoutes from '../job-costing-app/backend/src/modules/costs/costs.routes';
import laborRoutes from '../job-costing-app/backend/src/modules/labor/labor.routes';
import budgetsRoutes from '../job-costing-app/backend/src/modules/budgets/budgets.routes';
import changeOrdersRoutes from '../job-costing-app/backend/src/modules/change-orders/change-orders.routes';
import invoicesRoutes from '../job-costing-app/backend/src/modules/invoices/invoices.routes';
import reportsRoutes from '../job-costing-app/backend/src/modules/reports/reports.routes';
import notificationsRoutes from '../job-costing-app/backend/src/modules/notifications/notifications.routes';
import { errorHandler } from '../job-costing-app/backend/src/middleware/error.middleware';
import onboardingRoutes from '../job-costing-app/backend/src/modules/onboarding/onboarding.routes';

const app: Express = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, /\.vercel\.app$/, 'http://localhost:5173']
  : true;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// All API routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/labor', laborRoutes);
app.use('/api/budget', budgetsRoutes);
app.use('/api/change-orders', changeOrdersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/onboarding', onboardingRoutes);

app.use(errorHandler);

// Vercel serverless handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }
  return app(req as any, res as any);
}
