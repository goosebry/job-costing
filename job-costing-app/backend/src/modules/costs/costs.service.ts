import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { CreateCostInput, createCostSchema } from './dto/create-cost.schema';
import { UpdateCostInput, updateCostSchema } from './dto/update-cost.schema';
import { Prisma } from '@prisma/client';
const Decimal = Prisma.Decimal;

export class CostsService {
  async create(data: CreateCostInput, organizationId: string, userId: string) {
    const validatedData = createCostSchema.parse(data);

    await this.validateJobOwnership(validatedData.jobId, organizationId);

    const totalCost = new Decimal(validatedData.quantity)
      .mul(new Decimal(validatedData.unitCost));

    const cost = await prisma.jobCost.create({
      data: {
        jobId: validatedData.jobId,
        categoryId: validatedData.categoryId,
        description: validatedData.description,
        quantity: validatedData.quantity,
        unitCost: validatedData.unitCost,
        totalCost: totalCost.toNumber(),
        vendor: validatedData.vendor,
        invoiceNumber: validatedData.invoiceNumber,
        isBillable: validatedData.isBillable ?? true,
        date: new Date(validatedData.date),
        createdById: userId,
      },
      include: {
        job: { select: { id: true, name: true, jobNumber: true } },
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return cost;
  }

  async findAllByJob(jobId: string, organizationId: string, filters?: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    await this.validateJobOwnership(jobId, organizationId);

    const where: Prisma.JobCostWhereInput = {
      jobId,
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
      ...(filters?.startDate && {
        date: { gte: new Date(filters.startDate) },
      }),
      ...(filters?.endDate && {
        date: { lte: new Date(filters.endDate) },
      }),
    };

    const costs = await prisma.jobCost.findMany({
      where,
      include: {
        category: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    });

    return costs;
  }

  async update(id: string, organizationId: string, data: UpdateCostInput) {
    const cost = await this.findCostWithJob(id);

    if (cost.job.organizationId !== organizationId) {
      throw new AppError('Cost not found', 404);
    }

    const validatedData = updateCostSchema.parse(data);

    const quantity = validatedData.quantity ?? cost.quantity;
    const unitCost = validatedData.unitCost ?? Number(cost.unitCost);
    const totalCost = new Decimal(quantity).mul(new Decimal(unitCost)).toNumber();

    const updatedCost = await prisma.jobCost.update({
      where: { id },
      data: {
        categoryId: validatedData.categoryId,
        description: validatedData.description,
        quantity,
        unitCost,
        totalCost,
        vendor: validatedData.vendor,
        invoiceNumber: validatedData.invoiceNumber,
        isBillable: validatedData.isBillable,
        date: validatedData.date
          ? new Date(validatedData.date)
          : cost.date,
      },
      include: {
        job: { select: { id: true, name: true, jobNumber: true } },
        category: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return updatedCost;
  }

  async delete(id: string, organizationId: string) {
    const cost = await this.findCostWithJob(id);

    if (cost.job.organizationId !== organizationId) {
      throw new AppError('Cost not found', 404);
    }

    await prisma.jobCost.delete({ where: { id } });
  }

  async getCategories(organizationId: string) {
    const categories = await prisma.costCategory.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: 'asc' },
    });

    return categories;
  }

  async createCategory(organizationId: string, data: {
    name: string;
    unitType: string;
  }) {
    const category = await prisma.costCategory.create({
      data: {
        organizationId,
        name: data.name,
        unitType: data.unitType,
      },
    });

    return category;
  }

  private async findCostWithJob(id: string) {
    const cost = await prisma.jobCost.findUnique({
      where: { id },
      include: {
        job: { select: { organizationId: true } },
      },
    });

    if (!cost) {
      throw new AppError('Cost not found', 404);
    }

    return cost;
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

export const costsService = new CostsService();