import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { CreateChangeOrderInput, createChangeOrderSchema } from './dto/create-change-order.schema';
import { ApproveChangeOrderInput, approveChangeOrderSchema } from './dto/approve-change-order.schema';
import { ChangeOrderStatus } from '@prisma/client';

export class ChangeOrdersService {
  async create(data: CreateChangeOrderInput, organizationId: string, userId: string) {
    const validatedData = createChangeOrderSchema.parse(data);

    await this.validateJobOwnership(validatedData.jobId, organizationId);

    const orderCount = await prisma.changeOrder.count({
      where: { jobId: validatedData.jobId },
    });

    const changeOrder = await prisma.changeOrder.create({
      data: {
        jobId: validatedData.jobId,
        orderNumber: `CO-${String(orderCount + 1).padStart(3, '0')}`,
        description: validatedData.description,
        amount: validatedData.amount,
        isCommitted: validatedData.isCommitted ?? true,
      },
      include: {
        job: { select: { id: true, name: true, jobNumber: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return changeOrder;
  }

  async findAllByJob(jobId: string, organizationId: string) {
    await this.validateJobOwnership(jobId, organizationId);

    const changeOrders = await prisma.changeOrder.findMany({
      where: { jobId },
      include: {
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return changeOrders;
  }

  async approve(id: string, organizationId: string, userId: string, data: ApproveChangeOrderInput) {
    const validatedData = approveChangeOrderSchema.parse(data);

    const changeOrder = await prisma.changeOrder.findUnique({
      where: { id },
      include: {
        job: { select: { organizationId: true } },
      },
    });

    if (!changeOrder) {
      throw new AppError('Change order not found', 404);
    }

    if (changeOrder.job.organizationId !== organizationId) {
      throw new AppError('Change order not found', 404);
    }

    if (changeOrder.status !== ChangeOrderStatus.PENDING) {
      throw new AppError('Change order has already been processed', 400);
    }

    const updated = await prisma.changeOrder.update({
      where: { id },
      data: {
        status: validatedData.status as ChangeOrderStatus,
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: {
        job: { select: { id: true, name: true, jobNumber: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return updated;
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

export const changeOrdersService = new ChangeOrdersService();