import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';
import { onboardingController } from './onboarding.controller';

const router = Router();

// All onboarding routes require authentication
router.use(authMiddleware);

router.post('/setup-demo',    asyncHandler((req, res) => onboardingController.setupDemo(req as AuthenticatedRequest, res)));
router.post('/go-live',       asyncHandler((req, res) => onboardingController.goLive(req as AuthenticatedRequest, res)));
router.post('/clear-data',    asyncHandler((req, res) => onboardingController.clearData(req as AuthenticatedRequest, res)));
router.post('/redo-setup',    asyncHandler((req, res) => onboardingController.redoSetup(req as AuthenticatedRequest, res)));
router.get('/status',         asyncHandler((req, res) => onboardingController.getStatus(req as AuthenticatedRequest, res)));

export default router;
