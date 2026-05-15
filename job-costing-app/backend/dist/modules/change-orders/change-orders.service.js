"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeOrdersService = exports.ChangeOrdersService = void 0;
const database_1 = __importDefault(require("../../../config/database"));
const error_middleware_1 = require("../../../middleware/error.middleware");
const create_change_order_schema_1 = require("./dto/create-change-order.schema");
const approve_change_order_schema_1 = require("./dto/approve-change-order.schema");
const client_1 = require("@prisma/client");
class ChangeOrdersService {
    async create(data, organizationId, userId) {
        const validatedData = create_change_order_schema_1.createChangeOrderSchema.parse(data);
        await this.validateJobOwnership(validatedData.jobId, organizationId);
        const orderCount = await database_1.default.changeOrder.count({
            where: { jobId: validatedData.jobId },
        });
        const changeOrder = await database_1.default.changeOrder.create({
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
    async findAllByJob(jobId, organizationId) {
        await this.validateJobOwnership(jobId, organizationId);
        const changeOrders = await database_1.default.changeOrder.findMany({
            where: { jobId },
            include: {
                approvedBy: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return changeOrders;
    }
    async approve(id, organizationId, userId, data) {
        const validatedData = approve_change_order_schema_1.approveChangeOrderSchema.parse(data);
        const changeOrder = await database_1.default.changeOrder.findUnique({
            where: { id },
            include: {
                job: { select: { organizationId: true } },
            },
        });
        if (!changeOrder) {
            throw new error_middleware_1.AppError('Change order not found', 404);
        }
        if (changeOrder.job.organizationId !== organizationId) {
            throw new error_middleware_1.AppError('Change order not found', 404);
        }
        if (changeOrder.status !== client_1.ChangeOrderStatus.PENDING) {
            throw new error_middleware_1.AppError('Change order has already been processed', 400);
        }
        const updated = await database_1.default.changeOrder.update({
            where: { id },
            data: {
                status: validatedData.status,
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
exports.ChangeOrdersService = ChangeOrdersService;
exports.changeOrdersService = new ChangeOrdersService();
//# sourceMappingURL=change-orders.service.js.map