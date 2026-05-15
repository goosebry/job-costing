"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInvoiceSchema = exports.createInvoiceSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createInvoiceSchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid({ message: 'Valid job ID required' }),
    invoiceNumber: zod_1.z.string().min(1).max(50),
    amount: zod_1.z.number().positive(),
    dueDate: zod_1.z.string().datetime().optional(),
    lines: zod_1.z.array(zod_1.z.object({
        description: zod_1.z.string().min(1).max(500),
        quantity: zod_1.z.number().positive(),
        unitPrice: zod_1.z.number().positive(),
        amount: zod_1.z.number().positive(),
    })).min(1, { message: 'At least one line item required' }),
});
exports.updateInvoiceSchema = zod_1.z.object({
    invoiceNumber: zod_1.z.string().min(1).max(50).optional(),
    amount: zod_1.z.number().positive().optional(),
    dueDate: zod_1.z.string().datetime().optional().nullable(),
    status: zod_1.z.nativeEnum(client_1.InvoiceStatus).optional(),
});
//# sourceMappingURL=invoice.schema.js.map