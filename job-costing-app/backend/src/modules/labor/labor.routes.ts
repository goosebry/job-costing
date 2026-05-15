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
  '/',
  requirePermission('labor:read'),
  asyncHandler(async (req, res) => {
    const prisma = (await import('../../config/database')).default;
    const labor = await prisma.jobLabor.findMany({
      where: { job: { organizationId: req.user!.organizationId } },
      include: {
        job: { select: { id: true, name: true, jobNumber: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
    res.json(labor);
  })
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