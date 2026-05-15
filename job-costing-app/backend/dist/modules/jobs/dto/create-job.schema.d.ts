import { z } from 'zod';
export declare const createJobSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    clientName: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodObject<{
        street: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        zip: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
        country?: string | undefined;
    }, {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
        country?: string | undefined;
    }>>;
    templateId: z.ZodOptional<z.ZodString>;
    estimatedBudget: z.ZodOptional<z.ZodNumber>;
    startedAt: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    status?: "DRAFT" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED" | undefined;
    description?: string | undefined;
    clientName?: string | undefined;
    address?: {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
        country?: string | undefined;
    } | undefined;
    templateId?: string | undefined;
    estimatedBudget?: number | undefined;
    startedAt?: string | undefined;
}, {
    name: string;
    status?: "DRAFT" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED" | undefined;
    description?: string | undefined;
    clientName?: string | undefined;
    address?: {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
        country?: string | undefined;
    } | undefined;
    templateId?: string | undefined;
    estimatedBudget?: number | undefined;
    startedAt?: string | undefined;
}>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
//# sourceMappingURL=create-job.schema.d.ts.map