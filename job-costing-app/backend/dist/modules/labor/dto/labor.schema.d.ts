import { z } from 'zod';
export declare const createLaborEntrySchema: z.ZodObject<{
    jobId: z.ZodString;
    date: z.ZodString;
    hoursWorked: z.ZodNumber;
    hoursTravel: z.ZodDefault<z.ZodNumber>;
    hourlyRate: z.ZodOptional<z.ZodNumber>;
    lumpSum: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    hoursWorked: number;
    hoursTravel: number;
    date: string;
    hourlyRate?: number | undefined;
    notes?: string | undefined;
    lumpSum?: number | undefined;
}, {
    jobId: string;
    hoursWorked: number;
    date: string;
    hourlyRate?: number | undefined;
    hoursTravel?: number | undefined;
    notes?: string | undefined;
    lumpSum?: number | undefined;
}>;
export type CreateLaborEntryInput = z.infer<typeof createLaborEntrySchema>;
export declare const updateLaborEntrySchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodString>;
    hoursWorked: z.ZodOptional<z.ZodNumber>;
    hoursTravel: z.ZodOptional<z.ZodNumber>;
    hourlyRate: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    lumpSum: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    approvalStatus: z.ZodOptional<z.ZodNativeEnum<any>>;
}, "strip", z.ZodTypeAny, {
    [x: string]: any;
    date?: unknown;
    hoursWorked?: unknown;
    hoursTravel?: unknown;
    hourlyRate?: unknown;
    lumpSum?: unknown;
    notes?: unknown;
    approvalStatus?: unknown;
}, {
    [x: string]: any;
    date?: unknown;
    hoursWorked?: unknown;
    hoursTravel?: unknown;
    hourlyRate?: unknown;
    lumpSum?: unknown;
    notes?: unknown;
    approvalStatus?: unknown;
}>;
export type UpdateLaborEntryInput = z.infer<typeof updateLaborEntrySchema>;
export declare const approveLaborEntrySchema: z.ZodObject<{
    status: z.ZodEnum<["APPROVED", "REJECTED"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "APPROVED" | "REJECTED";
    notes?: string | undefined;
}, {
    status: "APPROVED" | "REJECTED";
    notes?: string | undefined;
}>;
export type ApproveLaborEntryInput = z.infer<typeof approveLaborEntrySchema>;
//# sourceMappingURL=labor.schema.d.ts.map