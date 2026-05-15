import { Response } from 'express';
import { invoicesService } from './invoices.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { UpdateInvoiceInput } from './dto/create-invoice.schema';
import { InvoiceStatus } from '@prisma/client';

export class InvoicesController {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const invoice = await invoicesService.create(req.body, req.user.organizationId);
    res.status(201).json(invoice);
  }

  async findAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { status, jobId, page, limit } = req.query;
    const result = await invoicesService.findAll(req.user.organizationId, {
      status: status as InvoiceStatus,
      jobId: jobId as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    // Flatten job fields for the frontend listing
    const invoices = result.invoices.map((inv: any) => ({
      ...inv,
      clientName: inv.job?.clientName ?? null,
      jobName: inv.job?.name ?? null,
      jobNumber: inv.job?.jobNumber ?? null,
    }));

    res.json({ invoices, pagination: result.pagination });
  }

  async findOne(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const invoice = await invoicesService.findOne(id, req.user.organizationId);
    res.json(invoice);
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const invoice = await invoicesService.update(id, req.user.organizationId, req.body as UpdateInvoiceInput);
    res.json(invoice);
  }
}

export const invoicesController = new InvoicesController();