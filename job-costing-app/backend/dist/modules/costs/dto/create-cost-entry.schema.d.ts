import { z } from 'zod';
export declare const createCostEntrySchema: z.ZodObject<{
    jobId: z.ZodString;
    categoryId: z.ZodString;
    costCodeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    vendor: z.ZodOptional<z.ZodString>;
    invoiceNumber: z.ZodOptional<z.ZodString>;
    invoiceDate: z.ZodOptional<z.ZodString>;
    receiptUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    categoryId: string;
    amount: number;
    description?: string | undefined;
    vendor?: string | undefined;
    costCodeId?: string | null | undefined;
    invoiceNumber?: string | undefined;
    invoiceDate?: string | undefined;
    receiptUrl?: string | undefined;
}, {
    jobId: string;
    categoryId: string;
    amount: number;
    description?: string | undefined;
    vendor?: string | undefined;
    costCodeId?: string | null | undefined;
    invoiceNumber?: string | undefined;
    invoiceDate?: string | undefined;
    receiptUrl?: string | undefined;
}>;
export type CreateCostEntryInput = z.infer<typeof createCostEntrySchema>;
//# sourceMappingURL=create-cost-entry.schema.d.ts.map