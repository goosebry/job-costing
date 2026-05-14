import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './modules/auth/auth.routes';
import jobsRoutes from './modules/jobs/jobs.routes';
import costsRoutes from './modules/costs/costs.routes';
import laborRoutes from './modules/labor/labor.routes';
import budgetsRoutes from './modules/budgets/budgets.routes';
import changeOrdersRoutes from './modules/change-orders/change-orders.routes';
import invoicesRoutes from './modules/invoices/invoices.routes';
import reportsRoutes from './modules/reports/reports.routes';
import stripeRoutes from './modules/stripe/stripe.routes';
import { errorHandler } from './middleware/error.middleware';
import { setupNotifications } from './modules/notifications/notifications.socket';

const app: Express = express();
const httpServer = createServer(app);
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/labor', laborRoutes);
app.use('/api/budget', budgetsRoutes);
app.use('/api/change-orders', changeOrdersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/stripe', stripeRoutes);

// Demo routes for when database is not available
app.get('/api/demos/jobs', (_req: Request, res: Response) => {
  res.json([
    { id: '1', name: 'Office Renovation', status: 'IN_PROGRESS', clientName: 'Acme Corp' },
    { id: '2', name: 'Warehouse Expansion', status: 'PLANNING', clientName: 'BuildCo' },
  ]);
});

app.get('/api/demos/notifications', (_req: Request, res: Response) => {
  res.json([
    { id: '1', type: 'INFO', title: 'Welcome', message: 'Welcome to Job Costing App', read: false, createdAt: new Date().toISOString() },
  ]);
});

app.use(errorHandler);

setupNotifications(io);

const gracefulShutdown = (signal: string) => {
  console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
  io.close(() => {
    console.log('[Server] Socket.IO closed');
    httpServer.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  });
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { httpServer };
export default app;