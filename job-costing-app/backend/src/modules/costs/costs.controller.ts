import { Response } from 'express';
import { costsService } from './costs.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { UpdateCostInput } from './dto/update-cost.schema';

export class CostsController {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const cost = await costsService.create(req.body, req.user.organizationId, req.user.userId);
    res.status(201).json(cost);
  }

  async findAllByJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { jobId } = req.params;
    const { categoryId, startDate, endDate } = req.query;
    const costs = await costsService.findAllByJob(jobId, req.user.organizationId, {
      categoryId: categoryId as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.json(costs);
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const cost = await costsService.update(id, req.user.organizationId, req.body as UpdateCostInput);
    res.json(cost);
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    await costsService.delete(id, req.user.organizationId);
    res.json({ message: 'Cost entry deleted successfully' });
  }

  async getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const categories = await costsService.getCategories(req.user.organizationId);
    res.json(categories);
  }

  async createCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const category = await costsService.createCategory(req.user.organizationId, req.body);
    res.status(201).json(category);
  }
}

export const costsController = new CostsController();