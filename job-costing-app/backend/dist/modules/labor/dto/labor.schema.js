"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveLaborEntrySchema = exports.updateLaborEntrySchema = exports.createLaborEntrySchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createLaborEntrySchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid({ message: 'Valid job ID required' }),
    date: zod_1.z.string().datetime({ message: 'Valid date required' }),
    hoursWorked: zod_1.z.number().min(0).max(24, { message: 'Hours worked must be between 0 and 24' }),
    hoursTravel: zod_1.z.number().min(0).max(24).default(0),
    hourlyRate: zod_1.z.number().positive().optional(),
    lumpSum: zod_1.z.number().positive().optional(),
    notes: zod_1.z.string().max(500).optional(),
});
exports.updateLaborEntrySchema = zod_1.z.object({
    date: zod_1.z.string().datetime().optional(),
    hoursWorked: zod_1.z.number().min(0).max(24).optional(),
    hoursTravel: zod_1.z.number().min(0).max(24).optional(),
    hourlyRate: zod_1.z.number().positive().optional().nullable(),
    lumpSum: zod_1.z.number().positive().optional().nullable(),
    notes: zod_1.z.string().max(500).optional().nullable(),
    approvalStatus: zod_1.z.nativeEnum(client_1.LaborApprovalStatus).optional(),
});
exports.approveLaborEntrySchema = zod_1.z.object({
    status: zod_1.z.enum(['APPROVED', 'REJECTED']),
    notes: zod_1.z.string().max(500).optional(),
});
//# sourceMappingURL=labor.schema.js.map