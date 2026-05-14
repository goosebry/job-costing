import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

const router = Router();

router.use(authMiddleware);

router.get(
  '/executive-summary',
  requirePermission('reports:export'),
  asyncHandler(reportsController.getExecutiveSummary.bind(reportsController))
);

router.get(
  '/job-cost/:jobId',
  requirePermission('reports:export'),
  asyncHandler(reportsController.getJobCostReport.bind(reportsController))
);

router.get(
  '/profitability',
  requirePermission('reports:export'),
  asyncHandler(reportsController.getProfitabilityReport.bind(reportsController))
);

router.get(
  '/labor-utilization',
  requirePermission('reports:export'),
  asyncHandler(reportsController.getLaborUtilization.bind(reportsController))
);

router.get(
  '/cash-flow',
  requirePermission('reports:export'),
  asyncHandler(reportsController.getCashFlowReport.bind(reportsController))
);

router.get(
  '/export/:type',
  requirePermission('reports:export'),
  asyncHandler(reportsController.exportReport.bind(reportsController))
);

export default router;