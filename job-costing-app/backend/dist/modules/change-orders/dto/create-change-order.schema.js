"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveChangeOrderSchema = exports.createChangeOrderSchema = void 0;
const zod_1 = require("zod");
exports.createChangeOrderSchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid('Invalid job ID'),
    description: zod_1.z.string().min(1, 'Description is required').max(1000),
    amount: zod_1.z.number().positive('Amount must be positive'),
    isCommitted: zod_1.z.boolean().optional(),
});
exports.approveChangeOrderSchema = zod_1.z.object({
    status: zod_1.z.enum(['APPROVED', 'REJECTED']),
});
//# sourceMappingURL=create-change-order.schema.js.map