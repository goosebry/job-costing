import { Router } from 'express';
import { laborController } from './labor.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  requirePermission('labor:create'),
  asyncHandler(laborController.create.bind(laborController))
);

router.get(
  '/job/:jobId',
  requirePermission('labor:read'),
  asyncHandler(laborController.findAllByJob.bind(laborController))
);

router.patch(
  '/:id',
  requirePermission('labor:update'),
  asyncHandler(laborController.update.bind(laborController))
);

router.delete(
  '/:id',
  requirePermission('labor:delete'),
  asyncHandler(laborController.delete.bind(laborController))
);

export default router;