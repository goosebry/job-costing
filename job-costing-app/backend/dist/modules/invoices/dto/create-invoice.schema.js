"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInvoiceSchema = exports.createInvoiceSchema = void 0;
const zod_1 = require("zod");
exports.createInvoiceSchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid('Invalid job ID'),
    dueDate: zod_1.z.string().datetime('Invalid due date format'),
    taxRate: zod_1.z.number().min(0).max(100).optional(),
});
exports.updateInvoiceSchema = zod_1.z.object({
    status: zod_1.z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
    dueDate: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=create-invoice.schema.js.map