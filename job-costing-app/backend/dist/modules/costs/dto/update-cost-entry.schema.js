"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCostEntrySchema = void 0;
const zod_1 = require("zod");
exports.updateCostEntrySchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid().optional(),
    costCodeId: zod_1.z.string().uuid().optional().nullable(),
    description: zod_1.z.string().max(500).optional().nullable(),
    amount: zod_1.z.number().positive().optional(),
    vendor: zod_1.z.string().max(200).optional().nullable(),
    invoiceNumber: zod_1.z.string().max(50).optional().nullable(),
    invoiceDate: zod_1.z.string().datetime().optional().nullable(),
    receiptUrl: zod_1.z.string().url().optional().nullable(),
});
//# sourceMappingURL=update-cost-entry.schema.js.map