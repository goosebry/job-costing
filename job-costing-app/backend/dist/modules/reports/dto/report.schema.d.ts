import { z } from 'zod';
export declare const generateReportSchema: z.ZodObject<{
    type: z.ZodEnum<["job_pl", "cost_vs_budget", "labor_utilization", "wip_summary", "job_status"]>;
    jobId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    format: z.ZodDefault<z.ZodEnum<["json", "pdf", "csv"]>>;
}, "strip", z.ZodTypeAny, {
    type: "job_pl" | "cost_vs_budget" | "labor_utilization" | "wip_summary" | "job_status";
    format: "csv" | "pdf" | "json";
    jobId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    type: "job_pl" | "cost_vs_budget" | "labor_utilization" | "wip_summary" | "job_status";
    jobId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    format?: "csv" | "pdf" | "json" | undefined;
}>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
//# sourceMappingURL=report.schema.d.ts.map