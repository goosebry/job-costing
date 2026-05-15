"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCostEntrySchema = void 0;
const zod_1 = require("zod");
exports.createCostEntrySchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid({ message: 'Valid job ID required' }),
    categoryId: zod_1.z.string().uuid({ message: 'Valid category ID required' }),
    costCodeId: zod_1.z.string().uuid().optional().nullable(),
    description: zod_1.z.string().max(500).optional(),
    amount: zod_1.z.number().positive({ message: 'Amount must be positive' }),
    vendor: zod_1.z.string().max(200).optional(),
    invoiceNumber: zod_1.z.string().max(50).optional(),
    invoiceDate: zod_1.z.string().datetime().optional(),
    receiptUrl: zod_1.z.string().url().optional(),
});
//# sourceMappingURL=create-cost-entry.schema.js.map