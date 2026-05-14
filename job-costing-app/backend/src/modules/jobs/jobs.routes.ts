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

export default router;