"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoicesService = exports.InvoicesService = void 0;
const database_1 = __importDefault(require("../../../config/database"));
const error_middleware_1 = require("../../../middleware/error.middleware");
const create_invoice_schema_1 = require("./dto/create-invoice.schema");
const create_invoice_schema_2 = require("./dto/create-invoice.schema");
const client_1 = require("@prisma/client");
const TAX_RATE_DEFAULT = 0;
class InvoicesService {
    async create(data, organizationId) {
        const validatedData = create_invoice_schema_1.createInvoiceSchema.parse(data);
        await this.validateJobOwnership(validatedData.jobId, organizationId);
        const [job, invoiceCount] = await Promise.all([
            database_1.default.job.findFirst({
                where: { id: validatedData.jobId, organizationId },
                include: {
                    costs: { where: { isBillable: true } },
                    labor: true,
                    changeOrders: { where: { status: 'APPROVED' } },
                },
            }),
            database_1.default.invoice.count({
                where: { jobId: validatedData.jobId },
            }),
        ]);
        if (!job) {
            throw new error_middleware_1.AppError('Job not found', 404);
        }
        const subtotal = [
            ...job.costs.map(c => Number(c.totalCost)),
            ...job.labor.map(l => Number(l.totalCost)),
            ...job.changeOrders.map(co => Number(co.amount)),
        ].reduce((sum, amount) => sum + amount, 0);
        const taxRate = validatedData.taxRate ?? TAX_RATE_DEFAULT;
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax;
        const invoice = await database_1.default.invoice.create({
            data: {
                jobId: validatedData.jobId,
                invoiceNumber: `INV-${job.jobNumber}-${String(invoiceCount + 1).padStart(3, '0')}`,
                status: client_1.InvoiceStatus.DRAFT,
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
    async findAll(organizationId, filters) {
        const { status, jobId, page = 1, limit = 20 } = filters || {};
        const skip = (page - 1) * limit;
        const jobs = await database_1.default.job.findMany({
            where: { organizationId },
            select: { id: true },
        });
        const jobIds = jobs.map(j => j.id);
        const where = {
            jobId: { in: jobIds },
            ...(status && { status }),
            ...(jobId && { jobId }),
        };
        const [invoices, total] = await Promise.all([
            database_1.default.invoice.findMany({
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
            database_1.default.invoice.count({ where }),
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
    async findOne(id, organizationId) {
        const invoice = await database_1.default.invoice.findUnique({
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
            throw new error_middleware_1.AppError('Invoice not found', 404);
        }
        const job = await database_1.default.job.findFirst({
            where: { id: invoice.jobId, organizationId },
            select: { id: true },
        });
        if (!job) {
            throw new error_middleware_1.AppError('Invoice not found', 404);
        }
        return invoice;
    }
    async update(id, organizationId, data) {
        await this.findOne(id, organizationId);
        const validatedData = create_invoice_schema_2.updateInvoiceSchema.parse(data);
        const updateData = {};
        if (validatedData.status) {
            updateData.status = validatedData.status;
            if (validatedData.status === client_1.InvoiceStatus.PAID) {
                updateData.paidAt = new Date();
            }
        }
        if (validatedData.dueDate) {
            updateData.dueDate = new Date(validatedData.dueDate);
        }
        const invoice = await database_1.default.invoice.update({
            where: { id },
            data: updateData,
        });
        return invoice;
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
exports.InvoicesService = InvoicesService;
exports.invoicesService = new InvoicesService();
//# sourceMappingURL=invoices.service.js.map