"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCostSchema = exports.createCostSchema = void 0;
const zod_1 = require("zod");
exports.createCostSchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid('Invalid job ID'),
    categoryId: zod_1.z.string().uuid('Invalid category ID'),
    description: zod_1.z.string().min(1, 'Description is required').max(500),
    quantity: zod_1.z.number().positive('Quantity must be positive'),
    unitCost: zod_1.z.number().min(0, 'Unit cost cannot be negative'),
    vendor: zod_1.z.string().max(200).optional().nullable(),
    invoiceRef: zod_1.z.string().max(100).optional().nullable(),
    isBillable: zod_1.z.boolean().optional(),
    isCommitted: zod_1.z.boolean().optional(),
    dateIncurred: zod_1.z.string().datetime('Invalid date format'),
});
exports.updateCostSchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid('Invalid category ID').optional(),
    description: zod_1.z.string().min(1).max(500).optional(),
    quantity: zod_1.z.number().positive().optional(),
    unitCost: zod_1.z.number().min(0).optional(),
    vendor: zod_1.z.string().max(200).optional().nullable(),
    invoiceRef: zod_1.z.string().max(100).optional().nullable(),
    isBillable: zod_1.z.boolean().optional(),
    isCommitted: zod_1.z.boolean().optional(),
    dateIncurred: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=create-cost.schema.js.map