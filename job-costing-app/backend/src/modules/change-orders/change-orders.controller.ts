import { Response } from 'express';
import { changeOrdersService } from './change-orders.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { ApproveChangeOrderInput } from './dto/approve-change-order.schema';

export class ChangeOrdersController {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const changeOrder = await changeOrdersService.create(
      req.body,
      req.user.organizationId,
      req.user.userId
    );
    res.status(201).json(changeOrder);
  }

  async findAllByJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { jobId } = req.params;
    const changeOrders = await changeOrdersService.findAllByJob(jobId, req.user.organizationId);
    res.json(changeOrders);
  }

  async approve(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const changeOrder = await changeOrdersService.approve(
      id,
      req.user.organizationId,
      req.user.userId,
      req.body as ApproveChangeOrderInput
    );
    res.json(changeOrder);
  }
}

export const changeOrdersController = new ChangeOrdersController();