import { z } from 'zod';
export declare const createCostSchema: z.ZodObject<{
    jobId: z.ZodString;
    categoryId: z.ZodString;
    description: z.ZodString;
    quantity: z.ZodNumber;
    unitCost: z.ZodNumber;
    vendor: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    invoiceRef: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isBillable: z.ZodOptional<z.ZodBoolean>;
    isCommitted: z.ZodOptional<z.ZodBoolean>;
    dateIncurred: z.ZodString;
}, "strip", z.ZodTypeAny, {
    description: string;
    jobId: string;
    categoryId: string;
    quantity: number;
    unitCost: number;
    dateIncurred: string;
    vendor?: string | null | undefined;
    invoiceRef?: string | null | undefined;
    isBillable?: boolean | undefined;
    isCommitted?: boolean | undefined;
}, {
    description: string;
    jobId: string;
    categoryId: string;
    quantity: number;
    unitCost: number;
    dateIncurred: string;
    vendor?: string | null | undefined;
    invoiceRef?: string | null | undefined;
    isBillable?: boolean | undefined;
    isCommitted?: boolean | undefined;
}>;
export type CreateCostInput = z.infer<typeof createCostSchema>;
export declare const updateCostSchema: z.ZodObject<{
    categoryId: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    unitCost: z.ZodOptional<z.ZodNumber>;
    vendor: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    invoiceRef: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isBillable: z.ZodOptional<z.ZodBoolean>;
    isCommitted: z.ZodOptional<z.ZodBoolean>;
    dateIncurred: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    categoryId?: string | undefined;
    quantity?: number | undefined;
    unitCost?: number | undefined;
    vendor?: string | null | undefined;
    invoiceRef?: string | null | undefined;
    isBillable?: boolean | undefined;
    isCommitted?: boolean | undefined;
    dateIncurred?: string | undefined;
}, {
    description?: string | undefined;
    categoryId?: string | undefined;
    quantity?: number | undefined;
    unitCost?: number | undefined;
    vendor?: string | null | undefined;
    invoiceRef?: string | null | undefined;
    isBillable?: boolean | undefined;
    isCommitted?: boolean | undefined;
    dateIncurred?: string | undefined;
}>;
export type UpdateCostInput = z.infer<typeof updateCostSchema>;
//# sourceMappingURL=create-cost.schema.d.ts.map