// Demo server for job costing app - no TypeScript compilation needed
const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Demo data
const demoJobs = [
  { id: '1', name: 'Office Renovation', status: 'IN_PROGRESS', clientName: 'Acme Corp', estimatedBudget: 150000 },
  { id: '2', name: 'Warehouse Expansion', status: 'PLANNING', clientName: 'BuildCo', estimatedBudget: 280000 },
  { id: '3', name: 'Retail Store Buildout', status: 'COMPLETED', clientName: 'ShopRite', estimatedBudget: 75000 },
];

const demoCosts = [
  { id: '1', jobId: '1', description: 'Building materials', amount: 25000, category: 'Materials', date: '2024-01-15' },
  { id: '2', jobId: '1', description: 'Electrical work', amount: 8500, category: 'Labor', date: '2024-01-20' },
  { id: '3', jobId: '2', description: 'Heavy equipment rental', amount: 15000, category: 'Equipment', date: '2024-02-01' },
];

const demoLabor = [
  { id: '1', jobId: '1', workerName: 'John Smith', hoursWorked: 8, hoursTravel: 0.5, hourlyRate: 45, date: '2024-01-15' },
  { id: '2', jobId: '1', workerName: 'Jane Doe', hoursWorked: 6, hoursTravel: 1, hourlyRate: 50, date: '2024-01-16' },
];

const demoBudgets = [
  { id: '1', jobId: '1', category: 'Materials', allocated: 50000, spent: 25000, remaining: 25000 },
  { id: '2', jobId: '1', category: 'Labor', allocated: 40000, spent: 18500, remaining: 21500 },
  { id: '3', jobId: '2', category: 'Equipment', allocated: 60000, spent: 15000, remaining: 45000 },
];

const demoInvoices = [
  { id: '1', jobId: '1', number: 'INV-001', amount: 12500, status: 'SENT', dueDate: '2024-02-15' },
  { id: '2', jobId: '2', number: 'INV-002', amount: 28000, status: 'PAID', dueDate: '2024-02-01', paidAt: '2024-01-28' },
];

const demoChangeOrders = [
  { id: '1', jobId: '1', orderNumber: 'CO-001', description: 'Additional electrical work', amount: 2500, status: 'PENDING' },
  { id: '2', jobId: '1', orderNumber: 'CO-002', description: 'Flooring upgrade', amount: 4500, status: 'APPROVED' },
];

const demoNotifications = [
  { id: '1', type: 'WARNING', title: 'Budget Alert', message: 'Materials budget at 50% for Office Renovation', read: false, createdAt: new Date().toISOString() },
  { id: '2', type: 'INFO', title: 'Pending Approval', message: '3 change orders awaiting approval', read: false, createdAt: new Date().toISOString() },
  { id: '3', type: 'SUCCESS', title: 'Invoice Paid', message: 'Invoice INV-002 has been paid', read: true, createdAt: new Date().toISOString() },
];

// Auth endpoints (demo)
app.post('/api/auth/login', (req, res) => {
  res.json({
    user: { id: '1', email: req.body.email, firstName: 'Demo', lastName: 'User', role: 'ADMIN' },
    accessToken: 'demo-access-token-' + Date.now(),
    refreshToken: 'demo-refresh-token-' + Date.now(),
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    user: { id: '1', email: req.body.email, firstName: req.body.firstName, lastName: req.body.lastName, role: 'ADMIN' },
    accessToken: 'demo-access-token-' + Date.now(),
    refreshToken: 'demo-refresh-token-' + Date.now(),
  });
});

app.post('/api/auth/refresh', (req, res) => {
  res.json({ accessToken: 'demo-access-token-' + Date.now() });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Jobs
app.get('/api/jobs', (req, res) => res.json(demoJobs));
app.get('/api/jobs/:id', (req, res) => {
  const job = demoJobs.find(j => j.id === req.params.id);
  if (job) {
    res.json({
      ...job,
      costs: demoCosts.filter(c => c.jobId === job.id),
      labor: demoLabor.filter(l => l.jobId === job.id),
    });
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});
app.post('/api/jobs', (req, res) => res.json({ ...req.body, id: String(demoJobs.length + 1) }));
app.patch('/api/jobs/:id', (req, res) => {
  const job = demoJobs.find(j => j.id === req.params.id);
  if (job) Object.assign(job, req.body);
  res.json(job);
});

// Costs
app.get('/api/costs', (req, res) => res.json(demoCosts));
app.get('/api/costs/:id', (req, res) => {
  const cost = demoCosts.find(c => c.id === req.params.id);
  if (cost) res.json(cost);
  else res.status(404).json({ error: 'Cost not found' });
});
app.post('/api/costs', (req, res) => res.json({ ...req.body, id: String(demoCosts.length + 1) }));
app.patch('/api/costs/:id', (req, res) => {
  const cost = demoCosts.find(c => c.id === req.params.id);
  if (cost) Object.assign(cost, req.body);
  res.json(cost);
});

// Labor
app.get('/api/labor', (req, res) => res.json(demoLabor));
app.get('/api/labor/:id', (req, res) => {
  const labor = demoLabor.find(l => l.id === req.params.id);
  if (labor) res.json(labor);
  else res.status(404).json({ error: 'Labor not found' });
});
app.post('/api/labor', (req, res) => res.json({ ...req.body, id: String(demoLabor.length + 1) }));
app.patch('/api/labor/:id', (req, res) => {
  const labor = demoLabor.find(l => l.id === req.params.id);
  if (labor) Object.assign(labor, req.body);
  res.json(labor);
});

// Budget
app.get('/api/budget', (req, res) => res.json(demoBudgets));
app.get('/api/budget/:jobId/summary', (req, res) => {
  const jobBudgets = demoBudgets.filter(b => b.jobId === req.params.jobId);
  const jobCosts = demoCosts.filter(c => c.jobId === req.params.jobId);
  const jobLabor = demoLabor.filter(l => l.jobId === req.params.jobId);
  const totalAllocated = jobBudgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = jobBudgets.reduce((sum, b) => sum + b.spent, 0);
  res.json({
    jobId: req.params.jobId,
    totalAllocated,
    totalSpent,
    remaining: totalAllocated - totalSpent,
    utilization: totalAllocated > 0 ? (totalSpent / totalAllocated * 100).toFixed(1) : 0,
    budgets: jobBudgets,
    recentCosts: jobCosts.slice(0, 5),
    recentLabor: jobLabor.slice(0, 5),
  });
});

// Change orders
app.get('/api/change-orders', (req, res) => res.json(demoChangeOrders));
app.get('/api/change-orders/pending', (req, res) => res.json(demoChangeOrders.filter(co => co.status === 'PENDING')));
app.get('/api/change-orders/:id', (req, res) => {
  const co = demoChangeOrders.find(c => c.id === req.params.id);
  if (co) res.json(co);
  else res.status(404).json({ error: 'Change order not found' });
});
app.post('/api/change-orders', (req, res) => res.json({ ...req.body, id: String(demoChangeOrders.length + 1) }));
app.patch('/api/change-orders/:id/approve', (req, res) => {
  const co = demoChangeOrders.find(c => c.id === req.params.id);
  if (co) co.status = req.body.status || 'APPROVED';
  res.json(co);
});

// Invoices
app.get('/api/invoices', (req, res) => res.json(demoInvoices));
app.get('/api/invoices/:id', (req, res) => {
  const inv = demoInvoices.find(i => i.id === req.params.id);
  if (inv) res.json(inv);
  else res.status(404).json({ error: 'Invoice not found' });
});
app.post('/api/invoices', (req, res) => res.json({ ...req.body, id: String(demoInvoices.length + 1) }));
app.patch('/api/invoices/:id', (req, res) => {
  const inv = demoInvoices.find(i => i.id === req.params.id);
  if (inv) Object.assign(inv, req.body);
  res.json(inv);
});

// Notifications
app.get('/api/notifications', (req, res) => res.json(demoNotifications));
app.get('/api/notifications/unread', (req, res) => res.json(demoNotifications.filter(n => !n.read)));
app.get('/api/notifications/unread/count', (req, res) => res.json({ count: demoNotifications.filter(n => !n.read).length }));
app.patch('/api/notifications/:id/read', (req, res) => {
  const n = demoNotifications.find(n => n.id === req.params.id);
  if (n) n.read = true;
  res.json(n);
});
app.patch('/api/notifications/read-all', (req, res) => {
  demoNotifications.forEach(n => n.read = true);
  res.json({ success: true });
});

// Reports
app.get('/api/reports/profit-loss', (req, res) => res.json({
  period: req.query.startDate + ' to ' + req.query.endDate,
  totalRevenue: 125000,
  totalCosts: 48500,
  laborCosts: 18500,
  materialCosts: 25000,
  equipmentCosts: 5000,
  profit: 76500,
  margin: 61.2,
}));
app.get('/api/reports/labor-analysis', (req, res) => res.json({
  totalHours: 14.5,
  billableHours: 14,
  nonBillableHours: 0.5,
  avgHourlyRate: 47.1,
  totalLaborCost: 12425,
}));

// Catch-all for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Demo Server] Running on port ${PORT}`);
  console.log(`[Demo Server] Health: http://localhost:${PORT}/api/health`);
});

module.exports = { app, server };