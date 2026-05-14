import { Response } from 'express';
import { laborService } from './labor.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { UpdateLaborInput } from './dto/create-labor.schema';

export class LaborController {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const labor = await laborService.create(req.body, req.user.organizationId, req.user.userId);
    res.status(201).json(labor);
  }

  async findAllByJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { jobId } = req.params;
    const labor = await laborService.findAllByJob(jobId, req.user.organizationId);
    res.json(labor);
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const labor = await laborService.update(id, req.user.organizationId, req.body as UpdateLaborInput);
    res.json(labor);
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    await laborService.delete(id, req.user.organizationId);
    res.json({ message: 'Labor entry deleted successfully' });
  }
}

export const laborController = new LaborController();