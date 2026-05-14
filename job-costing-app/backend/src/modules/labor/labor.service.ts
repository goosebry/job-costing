import prisma from '../../../config/database';
import { AppError } from '../../../middleware/error.middleware';
import { CreateLaborInput, createLaborSchema } from './dto/create-labor.schema';
import { UpdateLaborInput, updateLaborSchema } from './dto/update-labor.schema';
import { Decimal } from '@prisma/client/runtime';

export class LaborService {
  async create(data: CreateLaborInput, organizationId: string, userId: string) {
    const validatedData = createLaborSchema.parse(data);

    await this.validateJobOwnership(validatedData.jobId, organizationId);

    const hoursWorked = new Decimal(validatedData.hoursWorked);
    const hourlyRate = new Decimal(validatedData.hourlyRate);
    const hoursTravel = new Decimal(validatedData.hoursTravel ?? 0);
    const travelRate = new Decimal(0.5);
    const totalCost = hoursWorked.mul(hourlyRate).add(hoursTravel.mul(hourlyRate).mul(travelRate));

    const labor = await prisma.jobLabor.create({
      data: {
        jobId: validatedData.jobId,
        workerName: validatedData.workerName,
        role: validatedData.role,
        hoursWorked: validatedData.hoursWorked,
        hourlyRate: validatedData.hourlyRate,
        hoursTravel: validatedData.hoursTravel ?? 0,
        totalCost: totalCost.toNumber(),
        date: new Date(validatedData.date),
        createdById: userId,
      },
      include: {
        job: { select: { id: true, name: true, jobNumber: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return labor;
  }

  async findAllByJob(jobId: string, organizationId: string) {
    await this.validateJobOwnership(jobId, organizationId);

    const labor = await prisma.jobLabor.findMany({
      where: { jobId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    });

    return labor;
  }

  async update(id: string, organizationId: string, data: UpdateLaborInput) {
    const labor = await this.findLaborWithJob(id);

    if (labor.job.organizationId !== organizationId) {
      throw new AppError('Labor entry not found', 404);
    }

    const validatedData = updateLaborSchema.parse(data);

    const hoursWorked = new Decimal(validatedData.hoursWorked ?? labor.hoursWorked);
    const hourlyRate = new Decimal(validatedData.hourlyRate ?? Number(labor.hourlyRate));
    const hoursTravel = new Decimal(validatedData.hoursTravel ?? labor.hoursTravel);
    const travelRate = new Decimal(0.5);
    const totalCost = hoursWorked.mul(hourlyRate).add(hoursTravel.mul(hourlyRate).mul(travelRate));

    const updatedLabor = await prisma.jobLabor.update({
      where: { id },
      data: {
        workerName: validatedData.workerName,
        role: validatedData.role,
        hoursWorked,
        hourlyRate,
        hoursTravel,
        totalCost: totalCost.toNumber(),
        date: validatedData.date ? new Date(validatedData.date) : labor.date,
      },
      include: {
        job: { select: { id: true, name: true, jobNumber: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return updatedLabor;
  }

  async delete(id: string, organizationId: string) {
    const labor = await this.findLaborWithJob(id);

    if (labor.job.organizationId !== organizationId) {
      throw new AppError('Labor entry not found', 404);
    }

    await prisma.jobLabor.delete({ where: { id } });
  }

  private async findLaborWithJob(id: string) {
    const labor = await prisma.jobLabor.findUnique({
      where: { id },
      include: {
        job: { select: { organizationId: true } },
      },
    });

    if (!labor) {
      throw new AppError('Labor entry not found', 404);
    }

    return labor;
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

export const laborService = new LaborService();