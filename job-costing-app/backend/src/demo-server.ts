// Demo backend server for job costing app
// This runs without a database for demonstration purposes
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), mode: 'demo' });
});

// Demo data
const demoJobs = [
  { id: '1', name: 'Office Renovation', status: 'ACTIVE', clientName: 'Acme Corp', estimatedBudget: 150000 },
  { id: '2', name: 'Warehouse Expansion', status: 'PLANNING', clientName: 'BuildCo', estimatedBudget: 280000 },
  { id: '3', name: 'Retail Store Buildout', status: 'IN_PROGRESS', clientName: 'ShopRite', estimatedBudget: 75000 },
];

const demoCosts = [
  { id: '1', jobId: '1', category: 'Materials', description: 'Steel beams', amount: 4500, date: '2024-01-15', status: 'APPROVED' },
  { id: '2', jobId: '1', category: 'Labor', description: 'Installation', amount: 2200, date: '2024-01-20', status: 'PENDING' },
  { id: '3', jobId: '2', category: 'Equipment', description: 'Forklift rental', amount: 1800, date: '2024-01-18', status: 'APPROVED' },
];

const demoLabor = [
  { id: '1', jobId: '1', workerName: 'John Smith', hoursWorked: 8, hoursTravel: 0.5, hourlyRate: 45, date: '2024-01-15' },
  { id: '2', jobId: '1', workerName: 'Jane Doe', hoursWorked: 6, hoursTravel: 1, hourlyRate: 50, date: '2024-01-16' },
];

const demoBudgets = [
  { id: '1', jobId: '1', category: 'Materials', estimated: 50000, actual: 45000, variance: 5000 },
  { id: '2', jobId: '1', category: 'Labor', estimated: 30000, actual: 28500, variance: 1500 },
  { id: '3', jobId: '2', category: 'General', estimated: 100000, actual: 45000, variance: 55000 },
];

const demoInvoices = [
  { id: '1', invoiceNumber: 'INV-001', jobId: '1', clientName: 'Acme Corp', total: 12500, status: 'SENT', dueDate: '2024-02-15' },
  { id: '2', invoiceNumber: 'INV-002', jobId: '2', clientName: 'BuildCo', total: 22000, status: 'PAID', dueDate: '2024-02-01' },
];

const demoChangeOrders = [
  { id: '1', jobId: '1', title: 'Additional electrical work', description: 'Extra outlets needed', amount: 2500, status: 'PENDING' },
  { id: '2', jobId: '1', title: 'Upgrade flooring', description: 'Upgrade to premium tiles', amount: 4500, status: 'APPROVED' },
];

const demoNotifications = [
  { id: '1', type: 'INFO', title: 'Budget Alert', message: 'Warehouse Expansion is nearing budget limit', read: false, createdAt: new Date().toISOString() },
  { id: '2', type: 'WARNING', title: 'Pending Approval', message: '3 change orders awaiting your approval', read: false, createdAt: new Date().toISOString() },
  { id: '3', type: 'SUCCESS', title: 'Invoice Paid', message: 'Payment received for INV-002', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
];

// Auth routes
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email && password) {
    res.json({
      user: {
        id: 'demo-user-1',
        email,
        firstName: 'Demo',
        lastName: 'User',
        organization: { id: 'org-1', name: 'Demo Construction Co' },
        role: 'ADMIN',
      },
      accessToken: 'demo-access-token-' + Date.now(),
      refreshToken: 'demo-refresh-token-' + Date.now(),
    });
  } else {
    res.status(400).json({ error: 'Email and password required' });
  }
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  res.status(201).json({
    user: {
      id: 'new-user-1',
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      organization: { id: 'org-1', name: req.body.organizationName },
      role: 'ADMIN',
    },
    accessToken: 'demo-access-token-' + Date.now(),
    refreshToken: 'demo-refresh-token-' + Date.now(),
  });
});

// Jobs routes
app.get('/api/jobs', (_req: Request, res: Response) => {
  res.json(demoJobs);
});

app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const job = demoJobs.find(j => j.id === req.params.id);
  if (job) {
    res.json(job);
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

// Costs routes
app.get('/api/costs', (req: Request, res: Response) => {
  const jobId = req.query.jobId as string;
  if (jobId) {
    res.json(demoCosts.filter(c => c.jobId === jobId));
  } else {
    res.json(demoCosts);
  }
});

// Labor routes
app.get('/api/labor', (req: Request, res: Response) => {
  const jobId = req.query.jobId as string;
  if (jobId) {
    res.json(demoLabor.filter(l => l.jobId === jobId));
  } else {
    res.json(demoLabor);
  }
});

// Budget routes
app.get('/api/budget', (req: Request, res: Response) => {
  const jobId = req.query.jobId as string;
  if (jobId) {
    res.json(demoBudgets.filter(b => b.jobId === jobId));
  } else {
    res.json(demoBudgets);
  }
});

app.get('/api/budget/:jobId/summary', (req: Request, res: Response) => {
  const jobBudgets = demoBudgets.filter(b => b.jobId === req.params.jobId);
  res.json({
    jobId: req.params.jobId,
    totalEstimated: jobBudgets.reduce((sum, b) => sum + b.estimated, 0),
    totalActual: jobBudgets.reduce((sum, b) => sum + b.actual, 0),
    totalVariance: jobBudgets.reduce((sum, b) => sum + b.variance, 0),
    categories: jobBudgets,
  });
});

// Change orders routes
app.get('/api/change-orders', (_req: Request, res: Response) => {
  res.json(demoChangeOrders);
});

app.get('/api/change-orders/pending', (_req: Request, res: Response) => {
  res.json(demoChangeOrders.filter(co => co.status === 'PENDING'));
});

app.patch('/api/change-orders/:id/approve', (req: Request, res: Response) => {
  const order = demoChangeOrders.find(co => co.id === req.params.id);
  if (order) {
    order.status = req.body.status || 'APPROVED';
    res.json(order);
  } else {
    res.status(404).json({ error: 'Change order not found' });
  }
});

// Invoices routes
app.get('/api/invoices', (req: Request, res: Response) => {
  const jobId = req.query.jobId as string;
  if (jobId) {
    res.json(demoInvoices.filter(i => i.jobId === jobId));
  } else {
    res.json(demoInvoices);
  }
});

// Notifications routes
app.get('/api/notifications', (_req: Request, res: Response) => {
  res.json(demoNotifications);
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notification = demoNotifications.find(n => n.id === req.params.id);
  if (notification) {
    notification.read = true;
    res.json(notification);
  } else {
    res.status(404).json({ error: 'Notification not found' });
  }
});

// Reports routes
app.get('/api/reports/profit-loss', (_req: Request, res: Response) => {
  res.json({
    summary: {
      totalRevenue: 125000,
      totalCosts: 78000,
      totalLabor: 42000,
      profit: 5000,
      margin: 4.0,
    },
    byJob: demoJobs.map(job => ({
      jobId: job.id,
      jobName: job.name,
      revenue: 45000,
      costs: 28000,
      labor: 15000,
      profit: 2000,
    })),
  });
});

app.get('/api/reports/labor-analysis', (_req: Request, res: Response) => {
  res.json({
    summary: {
      totalHours: 156,
      totalCost: 7800,
      avgHourlyRate: 50,
      billableHours: 140,
      nonBillableHours: 16,
    },
    byWorker: demoLabor.map(l => ({
      workerName: l.workerName,
      totalHours: l.hoursWorked + l.hoursTravel,
      laborCost: (l.hoursWorked + l.hoursTravel) * l.hourlyRate,
    })),
  });
});

// Catch-all for API routes not handled
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 3001;

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`[Server] Demo server running on port ${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
});

export default app;