import { Router } from 'express';
import { jobsController } from './jobs.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  requirePermission('jobs:create'),
  asyncHandler(jobsController.create.bind(jobsController))
);

router.get(
  '/',
  requirePermission('jobs:read'),
  asyncHandler(jobsController.findAll.bind(jobsController))
);

router.get(
  '/templates',
  requirePermission('jobs:read'),
  asyncHandler(jobsController.getTemplates.bind(jobsController))
);

router.get(
  '/:id',
  requirePermission('jobs:read'),
  asyncHandler(jobsController.findOne.bind(jobsController))
);

router.patch(
  '/:id',
  requirePermission('jobs:update'),
  asyncHandler(jobsController.update.bind(jobsController))
);

router.delete(
  '/:id',
  requirePermission('jobs:delete'),
  asyncHandler(jobsController.delete.bind(jobsController))
);

router.post(
  '/:id/apply-template',
  requirePermission('jobs:update'),
  asyncHandler(jobsController.applyTemplate.bind(jobsController))
);

router.post(
  '/:id/complete',
  requirePermission('jobs:update'),
  asyncHandler(async (req, res) => {
    const prisma = (await import('../../config/database')).default;
    const jobId = req.params.id;
    const { notes, sendEmail } = req.body;
    const actions: { type: string; label: string; amount?: number }[] = [];

    // 1. Load job with related data
    const job = await prisma.job.findFirst({
      where: { id: jobId },
      include: {
        costs: { where: { isBillable: true } },
        labor: true,
        changeOrders: { where: { status: 'APPROVED' } },
        invoices: true,
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // 2. Calculate uninvoiced amount
    const totalCosts = job.costs.reduce((s, c) => s + Number(c.totalCost), 0);
    const totalLabor = job.labor.reduce((s, l) => s + Number(l.totalCost), 0);
    const totalChangeOrders = job.changeOrders.reduce((s, co) => s + Number(co.amount), 0);
    const totalBillable = totalCosts + totalLabor + totalChangeOrders;
    const totalInvoiced = job.invoices.reduce((s, i) => s + Number(i.total), 0);
    const uninvoiced = totalBillable - totalInvoiced;

    // 3. Generate final invoice if there's uninvoiced amount
    if (uninvoiced > 0) {
      const invoiceCount = job.invoices.length;
      const taxRate = 0.15; // GST
      const tax = uninvoiced * taxRate;
      const total = uninvoiced + tax;

      await prisma.invoice.create({
        data: {
          jobId,
          invoiceNumber: `INV-${job.jobNumber}-${String(invoiceCount + 1).padStart(3, '0')}`,
          status: 'SENT',
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 86400000),
          subtotal: uninvoiced,
          taxRate,
          taxLabel: 'GST',
          tax,
          total,
        },
      });
      actions.push({ type: 'invoice_created', label: `Final invoice generated — $${total.toFixed(2)} incl. GST`, amount: total });
    } else {
      actions.push({ type: 'invoice_skipped', label: 'No uninvoiced costs — no new invoice generated' });
    }

    // 4. Close pending change orders
    const pendingCOs = await prisma.changeOrder.updateMany({
      where: { jobId, status: 'PENDING' },
      data: { status: 'REJECTED' },
    });
    if (pendingCOs.count > 0) {
      actions.push({ type: 'change_order_closed', label: `${pendingCOs.count} pending change order(s) auto-rejected` });
    }

    // 5. Update job status
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', completedAt: new Date(), completionNotes: notes },
    });
    actions.push({ type: 'status_updated', label: 'Job status set to COMPLETED' });
    actions.push({ type: 'timestamp_set', label: `Completion date: ${new Date().toLocaleDateString('en-NZ')}` });

    // 6. Email action
    if (sendEmail) {
      actions.push({ type: 'email_skipped', label: 'Email sending not configured — invoice available for download' });
    }

    res.json({ success: true, actions });
  })
);

// Template CRUD
router.post(
  '/templates',
  requirePermission('jobs:create'),
  asyncHandler(async (req, res) => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const template = await prisma.jobTemplate.create({
      data: { organizationId: req.user!.organizationId, name: req.body.name, description: req.body.description, template: req.body.template || {} },
    });
    res.status(201).json(template);
  })
);

router.put(
  '/templates/:id',
  requirePermission('jobs:update'),
  asyncHandler(async (req, res) => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const template = await prisma.jobTemplate.update({
      where: { id: req.params.id },
      data: { name: req.body.name, description: req.body.description, template: req.body.template },
    });
    res.json(template);
  })
);

router.delete(
  '/templates/:id',
  requirePermission('jobs:delete'),
  asyncHandler(async (req, res) => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.jobTemplate.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;