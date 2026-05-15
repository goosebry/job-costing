"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveChangeOrderSchema = exports.updateChangeOrderSchema = exports.createChangeOrderSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createChangeOrderSchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid({ message: 'Valid job ID required' }),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000).optional(),
    amount: zod_1.z.number().positive(),
    lines: zod_1.z.array(zod_1.z.object({
        budgetLineId: zod_1.z.string().uuid().optional().nullable(),
        description: zod_1.z.string().min(1).max(500),
        quantity: zod_1.z.number().positive(),
        unitPrice: zod_1.z.number().positive(),
        amount: zod_1.z.number().positive(),
    })).optional(),
});
exports.updateChangeOrderSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().max(2000).optional().nullable(),
    amount: zod_1.z.number().positive().optional(),
    status: zod_1.z.nativeEnum(client_1.ChangeOrderStatus).optional(),
});
exports.approveChangeOrderSchema = zod_1.z.object({
    status: zod_1.z.enum(['APPROVED', 'REJECTED']),
    notes: zod_1.z.string().max(500).optional(),
});
//# sourceMappingURL=change-order.schema.js.map