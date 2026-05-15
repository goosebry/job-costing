import { z } from 'zod';
export declare const createChangeOrderSchema: z.ZodObject<{
    jobId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    lines: z.ZodOptional<z.ZodArray<z.ZodObject<{
        budgetLineId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        amount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        amount: number;
        unitPrice: number;
        budgetLineId?: string | null | undefined;
    }, {
        description: string;
        quantity: number;
        amount: number;
        unitPrice: number;
        budgetLineId?: string | null | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    amount: number;
    title: string;
    description?: string | undefined;
    lines?: {
        description: string;
        quantity: number;
        amount: number;
        unitPrice: number;
        budgetLineId?: string | null | undefined;
    }[] | undefined;
}, {
    jobId: string;
    amount: number;
    title: string;
    description?: string | undefined;
    lines?: {
        description: string;
        quantity: number;
        amount: number;
        unitPrice: number;
        budgetLineId?: string | null | undefined;
    }[] | undefined;
}>;
export type CreateChangeOrderInput = z.infer<typeof createChangeOrderSchema>;
export declare const updateChangeOrderSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    amount: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodNativeEnum<{
        PENDING: "PENDING";
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
    }>>;
}, "strip", z.ZodTypeAny, {
    status?: "APPROVED" | "REJECTED" | "PENDING" | undefined;
    description?: string | null | undefined;
    amount?: number | undefined;
    title?: string | undefined;
}, {
    status?: "APPROVED" | "REJECTED" | "PENDING" | undefined;
    description?: string | null | undefined;
    amount?: number | undefined;
    title?: string | undefined;
}>;
export type UpdateChangeOrderInput = z.infer<typeof updateChangeOrderSchema>;
export declare const approveChangeOrderSchema: z.ZodObject<{
    status: z.ZodEnum<["APPROVED", "REJECTED"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "APPROVED" | "REJECTED";
    notes?: string | undefined;
}, {
    status: "APPROVED" | "REJECTED";
    notes?: string | undefined;
}>;
export type ApproveChangeOrderInput = z.infer<typeof approveChangeOrderSchema>;
//# sourceMappingURL=change-order.schema.d.ts.map