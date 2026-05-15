import { z } from 'zod';
export declare const createInvoiceSchema: z.ZodObject<{
    jobId: z.ZodString;
    dueDate: z.ZodString;
    taxRate: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    dueDate: string;
    taxRate?: number | undefined;
}, {
    jobId: string;
    dueDate: string;
    taxRate?: number | undefined;
}>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export declare const updateInvoiceSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]>>;
    dueDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "CANCELLED" | "SENT" | "PAID" | "OVERDUE" | undefined;
    dueDate?: string | undefined;
}, {
    status?: "DRAFT" | "CANCELLED" | "SENT" | "PAID" | "OVERDUE" | undefined;
    dueDate?: string | undefined;
}>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
//# sourceMappingURL=create-invoice.schema.d.ts.map