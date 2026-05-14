import prisma from '../../../config/database';
import { AppError } from '../../../middleware/error.middleware';
import { CreateJobInput, createJobSchema } from './dto/create-job.schema';
import { UpdateJobInput, updateJobSchema } from './dto/update-job.schema';
import { JobStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

export class JobsService {
  async create(data: CreateJobInput, organizationId: string, userId: string) {
    const validatedData = createJobSchema.parse(data);
    const jobNumber = await this.generateJobNumber(organizationId);

    const job = await prisma.job.create({
      data: {
        organizationId,
        jobNumber,
        name: validatedData.name,
        description: validatedData.description,
        clientName: validatedData.clientName,
        address: validatedData.address || {},
        templateId: validatedData.templateId,
        estimatedBudget: validatedData.estimatedBudget || 0,
        startedAt: validatedData.startedAt ? new Date(validatedData.startedAt) : undefined,
        status: (validatedData.status as JobStatus) || JobStatus.DRAFT,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { costs: true, labor: true, changeOrders: true, invoices: true },
        },
      },
    });

    return job;
  }

  async findAll(organizationId: string, filters?: {
    status?: JobStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;

    const where: Prisma.JobWhereInput = {
      organizationId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { jobNumber: { contains: search, mode: 'insensitive' } },
          { clientName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { costs: true, labor: true, changeOrders: true, invoices: true },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string) {
    const job = await prisma.job.findFirst({
      where: { id, organizationId },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        costs: {
          include: {
            category: true,
            createdBy: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { dateIncurred: 'desc' },
        },
        labor: {
          include: {
            createdBy: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { date: 'desc' },
        },
        changeOrders: {
          include: {
            approvedBy: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { costs: true, labor: true, changeOrders: true, invoices: true },
        },
      },
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    return job;
  }

  async update(id: string, organizationId: string, data: UpdateJobInput) {
    await this.findOne(id, organizationId);

    const validatedData = updateJobSchema.parse(data);

    const job = await prisma.job.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        clientName: validatedData.clientName,
        address: validatedData.address,
        estimatedBudget: validatedData.estimatedBudget,
        startedAt: validatedData.startedAt ? new Date(validatedData.startedAt) : undefined,
        completedAt: validatedData.completedAt ? new Date(validatedData.completedAt) : undefined,
        status: validatedData.status,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return job;
  }

  async delete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    await prisma.job.delete({
      where: { id },
    });
  }

  async getTemplates(organizationId: string) {
    const templates = await prisma.jobTemplate.findMany({
      where: {
        organizationId,
        isSystem: true,
      },
      orderBy: { name: 'asc' },
    });

    return templates;
  }

  async applyTemplate(jobId: string, templateId: string, organizationId: string) {
    const [job, template] = await Promise.all([
      this.findOne(jobId, organizationId),
      prisma.jobTemplate.findFirst({
        where: { id: templateId, organizationId },
      }),
    ]);

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    const templateData = template.template as {
      costCategories?: Array<{ name: string; description?: string; unitType: string }>;
    };

    if (templateData.costCategories) {
      for (const cat of templateData.costCategories) {
        await prisma.costCategory.upsert({
          where: {
            organizationId_name: { organizationId, name: cat.name },
          },
          create: {
            organizationId,
            name: cat.name,
            description: cat.description,
            unitType: cat.unitType,
          },
          update: {},
        });
      }
    }

    return job;
  }

  private async generateJobNumber(organizationId: string): Promise<string> {
    const count = await prisma.job.count({
      where: { organizationId },
    });
    const year = new Date().getFullYear();
    return `JOB-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}

export const jobsService = new JobsService();