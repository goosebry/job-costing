"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.laborService = exports.LaborService = void 0;
const database_1 = __importDefault(require("../../../config/database"));
const error_middleware_1 = require("../../../middleware/error.middleware");
const create_labor_schema_1 = require("./dto/create-labor.schema");
const update_labor_schema_1 = require("./dto/update-labor.schema");
const runtime_1 = require("@prisma/client/runtime");
class LaborService {
    async create(data, organizationId, userId) {
        const validatedData = create_labor_schema_1.createLaborSchema.parse(data);
        await this.validateJobOwnership(validatedData.jobId, organizationId);
        const hoursWorked = new runtime_1.Decimal(validatedData.hoursWorked);
        const hourlyRate = new runtime_1.Decimal(validatedData.hourlyRate);
        const hoursTravel = new runtime_1.Decimal(validatedData.hoursTravel ?? 0);
        const travelRate = new runtime_1.Decimal(0.5);
        const totalCost = hoursWorked.mul(hourlyRate).add(hoursTravel.mul(hourlyRate).mul(travelRate));
        const labor = await database_1.default.jobLabor.create({
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
    async findAllByJob(jobId, organizationId) {
        await this.validateJobOwnership(jobId, organizationId);
        const labor = await database_1.default.jobLabor.findMany({
            where: { jobId },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { date: 'desc' },
        });
        return labor;
    }
    async update(id, organizationId, data) {
        const labor = await this.findLaborWithJob(id);
        if (labor.job.organizationId !== organizationId) {
            throw new error_middleware_1.AppError('Labor entry not found', 404);
        }
        const validatedData = update_labor_schema_1.updateLaborSchema.parse(data);
        const hoursWorked = new runtime_1.Decimal(validatedData.hoursWorked ?? labor.hoursWorked);
        const hourlyRate = new runtime_1.Decimal(validatedData.hourlyRate ?? Number(labor.hourlyRate));
        const hoursTravel = new runtime_1.Decimal(validatedData.hoursTravel ?? labor.hoursTravel);
        const travelRate = new runtime_1.Decimal(0.5);
        const totalCost = hoursWorked.mul(hourlyRate).add(hoursTravel.mul(hourlyRate).mul(travelRate));
        const updatedLabor = await database_1.default.jobLabor.update({
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
    async delete(id, organizationId) {
        const labor = await this.findLaborWithJob(id);
        if (labor.job.organizationId !== organizationId) {
            throw new error_middleware_1.AppError('Labor entry not found', 404);
        }
        await database_1.default.jobLabor.delete({ where: { id } });
    }
    async findLaborWithJob(id) {
        const labor = await database_1.default.jobLabor.findUnique({
            where: { id },
            include: {
                job: { select: { organizationId: true } },
            },
        });
        if (!labor) {
            throw new error_middleware_1.AppError('Labor entry not found', 404);
        }
        return labor;
    }
    async validateJobOwnership(jobId, organizationId) {
        const job = await database_1.default.job.findFirst({
            where: { id: jobId, organizationId },
            select: { id: true },
        });
        if (!job) {
            throw new error_middleware_1.AppError('Job not found', 404);
        }
    }
}
exports.LaborService = LaborService;
exports.laborService = new LaborService();
//# sourceMappingURL=labor.service.js.map