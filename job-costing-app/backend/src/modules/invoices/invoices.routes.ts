import { Router } from 'express';
import { invoicesController } from './invoices.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  requirePermission('invoices:create'),
  asyncHandler(invoicesController.create.bind(invoicesController))
);

router.get(
  '/',
  requirePermission('invoices:read'),
  asyncHandler(invoicesController.findAll.bind(invoicesController))
);

router.get(
  '/:id',
  requirePermission('invoices:read'),
  asyncHandler(invoicesController.findOne.bind(invoicesController))
);

router.patch(
  '/:id',
  requirePermission('invoices:update'),
  asyncHandler(invoicesController.update.bind(invoicesController))
);

export default router;