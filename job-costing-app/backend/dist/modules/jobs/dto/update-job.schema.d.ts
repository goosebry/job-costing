import { z } from 'zod';
export declare const updateJobSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    clientName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodObject<{
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
    }>>>;
    estimatedBudget: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    startedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    completedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED" | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    clientName?: string | null | undefined;
    address?: {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
        country?: string | undefined;
    } | null | undefined;
    estimatedBudget?: number | null | undefined;
    startedAt?: string | null | undefined;
    completedAt?: string | null | undefined;
}, {
    status?: "DRAFT" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED" | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    clientName?: string | null | undefined;
    address?: {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
        country?: string | undefined;
    } | null | undefined;
    estimatedBudget?: number | null | undefined;
    startedAt?: string | null | undefined;
    completedAt?: string | null | undefined;
}>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
//# sourceMappingURL=update-job.schema.d.ts.map