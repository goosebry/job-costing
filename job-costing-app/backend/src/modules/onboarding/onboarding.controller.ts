import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { onboardingService } from './onboarding.service';
import { AppError } from '../../middleware/error.middleware';

export class OnboardingController {
  async setupDemo(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const { businessType, businessName, password } = req.body;
    try {
      const result = await onboardingService.setupDemo(req.user.organizationId, businessType, businessName, password);
      res.json(result);
    } catch (err: any) {
      console.error('[setupDemo error]', err);
      res.status(500).json({ error: 'Setup failed', detail: err?.message || String(err) });
    }
  }

  async goLive(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const { password } = req.body;
    const result = await onboardingService.goLive(req.user.organizationId, req.user.userId, password);
    res.json(result);
  }

  async clearData(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const { password } = req.body;
    const result = await onboardingService.clearData(req.user.organizationId, req.user.userId, password);
    res.json(result);
  }

  async redoSetup(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const { password } = req.body;
    const result = await onboardingService.redoSetup(req.user.organizationId, req.user.userId, password);
    res.json(result);
  }

  async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const result = await onboardingService.getStatus(req.user.organizationId);
    res.json(result);
  }
}

export const onboardingController = new OnboardingController();
