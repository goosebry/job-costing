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
  '/',
  requirePermission('costs:read'),
  asyncHandler(async (req, res) => {
    const prisma = (await import('../../config/database')).default;
    const costs = await prisma.jobCost.findMany({
      where: { job: { organizationId: req.user!.organizationId } },
      include: {
        job: { select: { id: true, name: true, jobNumber: true } },
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
    res.json(costs);
  })
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