import { Response } from 'express';
import { jobsService } from './jobs.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { UpdateJobInput } from './dto/update-job.schema';
import { JobStatus } from '@prisma/client';

export class JobsController {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const job = await jobsService.create(req.body, req.user.organizationId, req.user.userId);
    res.status(201).json(job);
  }

  async findAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { status, search, page, limit } = req.query;
    const result = await jobsService.findAll(req.user.organizationId, {
      status: status as JobStatus,
      search: search as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.json(result);
  }

  async findOne(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const job = await jobsService.findOne(id, req.user.organizationId);
    res.json(job);
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const job = await jobsService.update(id, req.user.organizationId, req.body as UpdateJobInput);
    res.json(job);
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    await jobsService.delete(id, req.user.organizationId);
    res.json({ message: 'Job deleted successfully' });
  }

  async getTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const templates = await jobsService.getTemplates(req.user.organizationId);
    res.json(templates);
  }

  async applyTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const { templateId } = req.body;
    const job = await jobsService.applyTemplate(id, templateId, req.user.organizationId);
    res.json(job);
  }
}

export const jobsController = new JobsController();