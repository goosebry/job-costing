import { Router } from 'express';
import { changeOrdersController } from './change-orders.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  requirePermission('invoices:create'),
  asyncHandler(changeOrdersController.create.bind(changeOrdersController))
);

router.get(
  '/job/:jobId',
  requirePermission('invoices:read'),
  asyncHandler(changeOrdersController.findAllByJob.bind(changeOrdersController))
);

router.patch(
  '/:id/approve',
  requirePermission('change-orders:approve'),
  asyncHandler(changeOrdersController.approve.bind(changeOrdersController))
);

export default router;