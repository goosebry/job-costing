import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { CreateInvoiceInput, createInvoiceSchema } from './dto/create-invoice.schema';
import { UpdateInvoiceInput, updateInvoiceSchema } from './dto/create-invoice.schema';
import { InvoiceStatus } from '@prisma/client';

const TAX_RATE_DEFAULT = 0;

export class InvoicesService {
  async create(data: CreateInvoiceInput, organizationId: string) {
    const validatedData = createInvoiceSchema.parse(data);

    await this.validateJobOwnership(validatedData.jobId, organizationId);

    const [job, invoiceCount] = await Promise.all([
      prisma.job.findFirst({
        where: { id: validatedData.jobId, organizationId },
        include: {
          costs: { where: { isBillable: true } },
          labor: true,
          changeOrders: { where: { status: 'APPROVED' } },
        },
      }),
      prisma.invoice.count({
        where: { jobId: validatedData.jobId },
      }),
    ]);

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    const subtotal = [
      ...job.costs.map(c => Number(c.totalCost)),
      ...job.labor.map(l => Number(l.totalCost)),
      ...job.changeOrders.map(co => Number(co.amount)),
    ].reduce((sum, amount) => sum + amount, 0);

    const taxRate = validatedData.taxRate ?? TAX_RATE_DEFAULT;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const invoice = await prisma.invoice.create({
      data: {
        jobId: validatedData.jobId,
        invoiceNumber: `INV-${job.jobNumber}-${String(invoiceCount + 1).padStart(3, '0')}`,
        status: InvoiceStatus.DRAFT,
        issueDate: new Date(),
        dueDate: new Date(validatedData.dueDate),
        subtotal,
        tax,
        total,
      },
      include: {
        job: {
          select: { id: true, name: true, jobNumber: true, clientName: true },
        },
      },
    });

    return invoice;
  }

  async findAll(organizationId: string, filters?: {
    status?: InvoiceStatus;
    jobId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, jobId, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;

    const jobs = await prisma.job.findMany({
      where: { organizationId },
      select: { id: true },
    });
    const jobIds = jobs.map(j => j.id);

    const where: any = {
      jobId: { in: jobIds },
      ...(status && { status }),
      ...(jobId && { jobId }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: { id: true, name: true, jobNumber: true, clientName: true },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            costs: { where: { isBillable: true } },
            labor: true,
            changeOrders: { where: { status: 'APPROVED' } },
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    const job = await prisma.job.findFirst({
      where: { id: invoice.jobId, organizationId },
      select: { id: true },
    });

    if (!job) {
      throw new AppError('Invoice not found', 404);
    }

    return invoice;
  }

  async update(id: string, organizationId: string, data: UpdateInvoiceInput) {
    await this.findOne(id, organizationId);

    const validatedData = updateInvoiceSchema.parse(data);
    const updateData: any = {};

    if (validatedData.status) {
      updateData.status = validatedData.status;
      if (validatedData.status === InvoiceStatus.PAID) {
        updateData.paidAt = new Date();
      }
    }

    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    return invoice;
  }

  private async validateJobOwnership(jobId: string, organizationId: string) {
    const job = await prisma.job.findFirst({
      where: { id: jobId, organizationId },
      select: { id: true },
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }
  }
}

export const invoicesService = new InvoicesService();