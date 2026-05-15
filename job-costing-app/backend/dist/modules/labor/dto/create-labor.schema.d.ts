import { z } from 'zod';
export declare const createLaborSchema: z.ZodObject<{
    jobId: z.ZodString;
    workerName: z.ZodString;
    role: z.ZodString;
    hoursWorked: z.ZodNumber;
    hourlyRate: z.ZodNumber;
    hoursTravel: z.ZodOptional<z.ZodNumber>;
    date: z.ZodString;
}, "strip", z.ZodTypeAny, {
    role: string;
    jobId: string;
    workerName: string;
    hoursWorked: number;
    hourlyRate: number;
    date: string;
    hoursTravel?: number | undefined;
}, {
    role: string;
    jobId: string;
    workerName: string;
    hoursWorked: number;
    hourlyRate: number;
    date: string;
    hoursTravel?: number | undefined;
}>;
export type CreateLaborInput = z.infer<typeof createLaborSchema>;
export declare const updateLaborSchema: z.ZodObject<{
    workerName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    hoursWorked: z.ZodOptional<z.ZodNumber>;
    hourlyRate: z.ZodOptional<z.ZodNumber>;
    hoursTravel: z.ZodOptional<z.ZodNumber>;
    date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role?: string | undefined;
    workerName?: string | undefined;
    hoursWorked?: number | undefined;
    hourlyRate?: number | undefined;
    hoursTravel?: number | undefined;
    date?: string | undefined;
}, {
    role?: string | undefined;
    workerName?: string | undefined;
    hoursWorked?: number | undefined;
    hourlyRate?: number | undefined;
    hoursTravel?: number | undefined;
    date?: string | undefined;
}>;
export type UpdateLaborInput = z.infer<typeof updateLaborSchema>;
//# sourceMappingURL=create-labor.schema.d.ts.map