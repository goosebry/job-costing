import { Response } from 'express';
import { budgetService } from './budget.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class BudgetController {
  async getBudgetSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { jobId } = req.params;
    const summary = await budgetService.getBudgetSummary(jobId, req.user.organizationId);
    res.json(summary);
  }

  async getCostSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { jobId } = req.params;
    const summary = await budgetService.getJobCostSummary(jobId, req.user.organizationId);
    res.json(summary);
  }
}

export const budgetController = new BudgetController();