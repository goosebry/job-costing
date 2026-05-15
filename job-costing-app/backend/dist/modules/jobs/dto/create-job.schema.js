"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJobSchema = void 0;
const zod_1 = require("zod");
exports.createJobSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Job name is required').max(200),
    description: zod_1.z.string().max(2000).optional(),
    clientName: zod_1.z.string().max(200).optional(),
    address: zod_1.z.object({
        street: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        zip: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
    }).optional(),
    templateId: zod_1.z.string().uuid('Invalid template ID').optional(),
    estimatedBudget: zod_1.z.number().positive('Budget must be positive').optional(),
    startedAt: zod_1.z.string().datetime().optional(),
    status: zod_1.z.enum(['DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
});
//# sourceMappingURL=create-job.schema.js.map