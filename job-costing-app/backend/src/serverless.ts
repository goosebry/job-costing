/**
 * Serverless-safe Express app entry point.
 * No Socket.IO, no process signal handlers — safe for Vercel functions.
 */
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './modules/auth/auth.routes';
import onboardingRoutes from './modules/onboarding/onboarding.routes';
import jobsRoutes from './modules/jobs/jobs.routes';
import costsRoutes from './modules/costs/costs.routes';
import laborRoutes from './modules/labor/labor.routes';
import budgetsRoutes from './modules/budgets/budgets.routes';
import changeOrdersRoutes from './modules/change-orders/change-orders.routes';
import invoicesRoutes from './modules/invoices/invoices.routes';
import reportsRoutes from './modules/reports/reports.routes';
import { errorHandler } from './middleware/error.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import prisma from './config/database';

const app: Express = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, /\.vercel\.app$/, 'http://localhost:5173']
  : '*';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigins as any, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

app.get('/api/health/db', async (_req: Request, res: Response) => {
  try {
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    const masked = dbUrl.replace(/:([^@]+)@/, ':****@');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', url_preview: masked, gemini_key_set: !!process.env.GEMINI_API_KEY });
  } catch (error: any) {
    res.status(500).json({ status: 'error', database: 'failed', error: error.message });
  }
});

// ─── Core Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/labor', laborRoutes);
app.use('/api/budget', budgetsRoutes);
app.use('/api/change-orders', changeOrdersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/reports', reportsRoutes);

// ─── Dashboard (inline — aggregates from existing tables) ────────────────────
app.get('/api/dashboard/summary', authMiddleware, async (req: any, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const [jobCount, activeJobs, costSum, laborSum] = await Promise.all([
      prisma.job.count({ where: { organizationId: orgId } }),
      prisma.job.count({ where: { organizationId: orgId, status: { in: ['ACTIVE', 'IN_PROGRESS'] } } }),
      prisma.jobCost.aggregate({ where: { job: { organizationId: orgId } }, _sum: { totalCost: true } }),
      prisma.jobLabor.aggregate({ where: { job: { organizationId: orgId } }, _sum: { totalCost: true } }),
    ]);
    res.json({
      totalJobs: jobCount,
      activeJobs,
      totalCosts: Number(costSum._sum.totalCost ?? 0),
      totalLabor: Number(laborSum._sum.totalCost ?? 0),
      revenue: 0,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Organization settings (inline) ──────────────────────────────────────────
app.get('/api/organization/settings', authMiddleware, async (req: any, res: Response) => {
  try {
    const org = await prisma.organization.findUnique({ where: { id: req.user?.organizationId } });
    res.json(org ?? {});
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/organization/settings', authMiddleware, async (req: any, res: Response) => {
  try {
    const org = await prisma.organization.update({
      where: { id: req.user?.organizationId },
      data: req.body,
    });
    res.json(org);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Clients (inline CRUD) ────────────────────────────────────────────────────
app.get('/api/clients', authMiddleware, async (req: any, res: Response) => {
  try {
    const clients = await prisma.client.findMany({ where: { organizationId: req.user?.organizationId }, orderBy: { name: 'asc' } });
    res.json(clients);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/clients/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Notifications (silent stubs — no-op until module added) ─────────────────
app.get('/api/notifications', authMiddleware, (_req: Request, res: Response) => res.json([]));
app.get('/api/notifications/unread', authMiddleware, (_req: Request, res: Response) => res.json([]));
app.get('/api/notifications/unread/count', authMiddleware, (_req: Request, res: Response) => res.json({ count: 0 }));
app.patch('/api/notifications/read-all', authMiddleware, (_req: Request, res: Response) => res.json({ success: true }));
app.patch('/api/notifications/:id/read', authMiddleware, (_req: Request, res: Response) => res.json({ success: true }));
app.delete('/api/notifications/:id', authMiddleware, (_req: Request, res: Response) => res.json({ success: true }));

// ─── Settings stubs ───────────────────────────────────────────────────────────
app.get('/api/settings/job-statuses', authMiddleware, (_req: Request, res: Response) => {
  res.json(['PLANNING', 'ACTIVE', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].map(s => ({ id: s, name: s })));
});
app.delete('/api/settings/job-statuses/:id', authMiddleware, (_req: Request, res: Response) => res.json({ success: true }));

app.use(errorHandler);

export default app;
