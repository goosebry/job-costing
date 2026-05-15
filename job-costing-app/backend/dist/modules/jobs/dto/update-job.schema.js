"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateJobSchema = void 0;
const zod_1 = require("zod");
exports.updateJobSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().max(2000).optional().nullable(),
    clientName: zod_1.z.string().max(200).optional().nullable(),
    address: zod_1.z.object({
        street: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        zip: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
    }).optional().nullable(),
    estimatedBudget: zod_1.z.number().positive().optional().nullable(),
    startedAt: zod_1.z.string().datetime().optional().nullable(),
    completedAt: zod_1.z.string().datetime().optional().nullable(),
    status: zod_1.z.enum(['DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
});
//# sourceMappingURL=update-job.schema.js.map