import { z } from 'zod';
export declare const updateCostEntrySchema: z.ZodObject<{
    categoryId: z.ZodOptional<z.ZodString>;
    costCodeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    amount: z.ZodOptional<z.ZodNumber>;
    vendor: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    invoiceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    invoiceDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    receiptUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    description?: string | null | undefined;
    categoryId?: string | undefined;
    vendor?: string | null | undefined;
    amount?: number | undefined;
    costCodeId?: string | null | undefined;
    invoiceNumber?: string | null | undefined;
    invoiceDate?: string | null | undefined;
    receiptUrl?: string | null | undefined;
}, {
    description?: string | null | undefined;
    categoryId?: string | undefined;
    vendor?: string | null | undefined;
    amount?: number | undefined;
    costCodeId?: string | null | undefined;
    invoiceNumber?: string | null | undefined;
    invoiceDate?: string | null | undefined;
    receiptUrl?: string | null | undefined;
}>;
export type UpdateCostEntryInput = z.infer<typeof updateCostEntrySchema>;
//# sourceMappingURL=update-cost-entry.schema.d.ts.map