import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

const router = Router();

router.use(authMiddleware);

// GET /api/budgets - List budgets
router.get(
  '/',
  requirePermission('budgets:read'),
  asyncHandler(async (req, res) => {
    res.json({ message: 'Budgets list', organizationId: req.user?.organizationId });
  })
);

// GET /api/budgets/:id - Get budget by ID
router.get(
  '/:id',
  requirePermission('budgets:read'),
  asyncHandler(async (req, res) => {
    res.json({ message: 'Budget detail', id: req.params.id });
  })
);

// POST /api/budgets - Create budget
router.post(
  '/',
  requirePermission('budgets:update'),
  asyncHandler(async (req, res) => {
    res.status(201).json({ message: 'Budget created', data: req.body });
  })
);

// PATCH /api/budgets/:id - Update budget
router.patch(
  '/:id',
  requirePermission('budgets:update'),
  asyncHandler(async (req, res) => {
    res.json({ message: 'Budget updated', id: req.params.id });
  })
);

// DELETE /api/budgets/:id - Delete budget
router.delete(
  '/:id',
  requirePermission('budgets:update'),
  asyncHandler(async (req, res) => {
    res.status(204).send();
  })
);

// GET /api/budgets/job/:jobId - Get budgets by job
router.get(
  '/job/:jobId',
  requirePermission('budgets:read'),
  asyncHandler(async (req, res) => {
    res.json({ message: 'Job budgets', jobId: req.params.jobId });
  })
);

// GET /api/budgets/variance/:jobId - Get budget variance for job
router.get(
  '/variance/:jobId',
  requirePermission('budgets:read'),
  asyncHandler(async (req, res) => {
    res.json({ 
      message: 'Budget variance', 
      jobId: req.params.jobId,
      estimated: 0,
      actual: 0,
      variance: 0,
      variancePercentage: 0
    });
  })
);

export default router;