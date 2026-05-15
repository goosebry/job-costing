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
    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', completedAt: new Date(), completionNotes: req.body.notes },
    });
    res.json(job);
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