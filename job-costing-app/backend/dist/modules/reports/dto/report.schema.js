"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReportSchema = void 0;
const zod_1 = require("zod");
exports.generateReportSchema = zod_1.z.object({
    type: zod_1.z.enum(['job_pl', 'cost_vs_budget', 'labor_utilization', 'wip_summary', 'job_status']),
    jobId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    format: zod_1.z.enum(['json', 'pdf', 'csv']).default('json'),
});
//# sourceMappingURL=report.schema.js.map