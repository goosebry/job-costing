import { z } from 'zod';
export declare const createInvoiceSchema: z.ZodObject<{
    jobId: z.ZodString;
    invoiceNumber: z.ZodString;
    amount: z.ZodNumber;
    dueDate: z.ZodOptional<z.ZodString>;
    lines: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        amount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        amount: number;
        unitPrice: number;
    }, {
        description: string;
        quantity: number;
        amount: number;
        unitPrice: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    amount: number;
    lines: {
        description: string;
        quantity: number;
        amount: number;
        unitPrice: number;
    }[];
    invoiceNumber: string;
    dueDate?: string | undefined;
}, {
    jobId: string;
    amount: number;
    lines: {
        description: string;
        quantity: number;
        amount: number;
        unitPrice: number;
    }[];
    invoiceNumber: string;
    dueDate?: string | undefined;
}>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export declare const updateInvoiceSchema: z.ZodObject<{
    invoiceNumber: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodNativeEnum<{
        DRAFT: "DRAFT";
        SENT: "SENT";
        PAID: "PAID";
        OVERDUE: "OVERDUE";
        CANCELLED: "CANCELLED";
    }>>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "CANCELLED" | "SENT" | "PAID" | "OVERDUE" | undefined;
    amount?: number | undefined;
    dueDate?: string | null | undefined;
    invoiceNumber?: string | undefined;
}, {
    status?: "DRAFT" | "CANCELLED" | "SENT" | "PAID" | "OVERDUE" | undefined;
    amount?: number | undefined;
    dueDate?: string | null | undefined;
    invoiceNumber?: string | undefined;
}>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
//# sourceMappingURL=invoice.schema.d.ts.map