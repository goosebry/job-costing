"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobsService = exports.JobsService = void 0;
const database_1 = __importDefault(require("../../../config/database"));
const error_middleware_1 = require("../../../middleware/error.middleware");
const create_job_schema_1 = require("./dto/create-job.schema");
const update_job_schema_1 = require("./dto/update-job.schema");
const client_1 = require("@prisma/client");
class JobsService {
    async create(data, organizationId, userId) {
        const validatedData = create_job_schema_1.createJobSchema.parse(data);
        const jobNumber = await this.generateJobNumber(organizationId);
        const job = await database_1.default.job.create({
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
                status: validatedData.status || client_1.JobStatus.DRAFT,
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
    async findAll(organizationId, filters) {
        const { status, search, page = 1, limit = 20 } = filters || {};
        const skip = (page - 1) * limit;
        const where = {
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
            database_1.default.job.findMany({
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
            database_1.default.job.count({ where }),
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
    async findOne(id, organizationId) {
        const job = await database_1.default.job.findFirst({
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
            throw new error_middleware_1.AppError('Job not found', 404);
        }
        return job;
    }
    async update(id, organizationId, data) {
        await this.findOne(id, organizationId);
        const validatedData = update_job_schema_1.updateJobSchema.parse(data);
        const job = await database_1.default.job.update({
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
    async delete(id, organizationId) {
        await this.findOne(id, organizationId);
        await database_1.default.job.delete({
            where: { id },
        });
    }
    async getTemplates(organizationId) {
        const templates = await database_1.default.jobTemplate.findMany({
            where: {
                organizationId,
                isSystem: true,
            },
            orderBy: { name: 'asc' },
        });
        return templates;
    }
    async applyTemplate(jobId, templateId, organizationId) {
        const [job, template] = await Promise.all([
            this.findOne(jobId, organizationId),
            database_1.default.jobTemplate.findFirst({
                where: { id: templateId, organizationId },
            }),
        ]);
        if (!template) {
            throw new error_middleware_1.AppError('Template not found', 404);
        }
        const templateData = template.template;
        if (templateData.costCategories) {
            for (const cat of templateData.costCategories) {
                await database_1.default.costCategory.upsert({
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
    async generateJobNumber(organizationId) {
        const count = await database_1.default.job.count({
            where: { organizationId },
        });
        const year = new Date().getFullYear();
        return `JOB-${year}-${String(count + 1).padStart(4, '0')}`;
    }
}
exports.JobsService = JobsService;
exports.jobsService = new JobsService();
//# sourceMappingURL=jobs.service.js.map