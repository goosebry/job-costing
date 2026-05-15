"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.costsService = exports.CostsService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../middleware/error.middleware");
const create_cost_schema_1 = require("./dto/create-cost.schema");
const update_cost_schema_1 = require("./dto/update-cost.schema");
const runtime_1 = require("@prisma/client/runtime");
class CostsService {
    async create(data, organizationId, userId) {
        const validatedData = create_cost_schema_1.createCostSchema.parse(data);
        await this.validateJobOwnership(validatedData.jobId, organizationId);
        const totalCost = new runtime_1.Decimal(validatedData.quantity)
            .mul(new runtime_1.Decimal(validatedData.unitCost));
        const cost = await database_1.default.jobCost.create({
            data: {
                jobId: validatedData.jobId,
                categoryId: validatedData.categoryId,
                description: validatedData.description,
                quantity: validatedData.quantity,
                unitCost: validatedData.unitCost,
                totalCost: totalCost.toNumber(),
                vendor: validatedData.vendor,
                invoiceRef: validatedData.invoiceRef,
                isBillable: validatedData.isBillable ?? true,
                isCommitted: validatedData.isCommitted ?? false,
                dateIncurred: new Date(validatedData.dateIncurred),
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
    async findAllByJob(jobId, organizationId, filters) {
        await this.validateJobOwnership(jobId, organizationId);
        const where = {
            jobId,
            ...(filters?.categoryId && { categoryId: filters.categoryId }),
            ...(filters?.startDate && {
                dateIncurred: { gte: new Date(filters.startDate) },
            }),
            ...(filters?.endDate && {
                dateIncurred: { lte: new Date(filters.endDate) },
            }),
        };
        const costs = await database_1.default.jobCost.findMany({
            where,
            include: {
                category: true,
                createdBy: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { dateIncurred: 'desc' },
        });
        return costs;
    }
    async update(id, organizationId, data) {
        const cost = await this.findCostWithJob(id);
        if (cost.job.organizationId !== organizationId) {
            throw new error_middleware_1.AppError('Cost not found', 404);
        }
        const validatedData = update_cost_schema_1.updateCostSchema.parse(data);
        const quantity = validatedData.quantity ?? cost.quantity;
        const unitCost = validatedData.unitCost ?? Number(cost.unitCost);
        const totalCost = new runtime_1.Decimal(quantity).mul(new runtime_1.Decimal(unitCost)).toNumber();
        const updatedCost = await database_1.default.jobCost.update({
            where: { id },
            data: {
                categoryId: validatedData.categoryId,
                description: validatedData.description,
                quantity,
                unitCost,
                totalCost,
                vendor: validatedData.vendor,
                invoiceRef: validatedData.invoiceRef,
                isBillable: validatedData.isBillable,
                isCommitted: validatedData.isCommitted,
                dateIncurred: validatedData.dateIncurred
                    ? new Date(validatedData.dateIncurred)
                    : cost.dateIncurred,
            },
            include: {
                job: { select: { id: true, name: true, jobNumber: true } },
                category: true,
                createdBy: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        return updatedCost;
    }
    async delete(id, organizationId) {
        const cost = await this.findCostWithJob(id);
        if (cost.job.organizationId !== organizationId) {
            throw new error_middleware_1.AppError('Cost not found', 404);
        }
        await database_1.default.jobCost.delete({ where: { id } });
    }
    async getCategories(organizationId) {
        const categories = await database_1.default.costCategory.findMany({
            where: { organizationId, isActive: true },
            orderBy: { name: 'asc' },
        });
        return categories;
    }
    async createCategory(organizationId, data) {
        const category = await database_1.default.costCategory.create({
            data: {
                organizationId,
                name: data.name,
                description: data.description,
                unitType: data.unitType,
            },
        });
        return category;
    }
    async findCostWithJob(id) {
        const cost = await database_1.default.jobCost.findUnique({
            where: { id },
            include: {
                job: { select: { organizationId: true } },
            },
        });
        if (!cost) {
            throw new error_middleware_1.AppError('Cost not found', 404);
        }
        return cost;
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
exports.CostsService = CostsService;
exports.costsService = new CostsService();
//# sourceMappingURL=costs.service.js.map