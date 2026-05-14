import { Router } from 'express';
import { costsController } from './costs.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  requirePermission('costs:create'),
  asyncHandler(costsController.create.bind(costsController))
);

router.get(
  '/job/:jobId',
  requirePermission('costs:read'),
  asyncHandler(costsController.findAllByJob.bind(costsController))
);

router.patch(
  '/:id',
  requirePermission('costs:update'),
  asyncHandler(costsController.update.bind(costsController))
);

router.delete(
  '/:id',
  requirePermission('costs:delete'),
  asyncHandler(costsController.delete.bind(costsController))
);

router.get(
  '/categories',
  requirePermission('costs:read'),
  asyncHandler(costsController.getCategories.bind(costsController))
);

router.post(
  '/categories',
  requirePermission('settings:manage'),
  asyncHandler(costsController.createCategory.bind(costsController))
);

export default router;