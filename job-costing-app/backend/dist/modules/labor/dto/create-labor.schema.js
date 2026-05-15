"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLaborSchema = exports.createLaborSchema = void 0;
const zod_1 = require("zod");
exports.createLaborSchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid('Invalid job ID'),
    workerName: zod_1.z.string().min(1, 'Worker name is required').max(100),
    role: zod_1.z.string().min(1, 'Role is required').max(100),
    hoursWorked: zod_1.z.number().positive('Hours worked must be positive'),
    hourlyRate: zod_1.z.number().min(0, 'Hourly rate cannot be negative'),
    hoursTravel: zod_1.z.number().min(0).optional(),
    date: zod_1.z.string().datetime('Invalid date format'),
});
exports.updateLaborSchema = zod_1.z.object({
    workerName: zod_1.z.string().min(1).max(100).optional(),
    role: zod_1.z.string().min(1).max(100).optional(),
    hoursWorked: zod_1.z.number().positive().optional(),
    hourlyRate: zod_1.z.number().min(0).optional(),
    hoursTravel: zod_1.z.number().min(0).optional(),
    date: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=create-labor.schema.js.map