import { Router } from 'express';
import { budgetController } from './budget.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

const router = Router();

router.use(authMiddleware);

router.get(
  '/:jobId/summary',
  requirePermission('costs:read'),
  asyncHandler(budgetController.getBudgetSummary.bind(budgetController))
);

router.get(
  '/:jobId/cost-summary',
  requirePermission('costs:read'),
  asyncHandler(budgetController.getCostSummary.bind(budgetController))
);

export default router;