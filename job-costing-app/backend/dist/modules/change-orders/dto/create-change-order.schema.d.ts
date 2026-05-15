import { z } from 'zod';
export declare const createChangeOrderSchema: z.ZodObject<{
    jobId: z.ZodString;
    description: z.ZodString;
    amount: z.ZodNumber;
    isCommitted: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    description: string;
    jobId: string;
    amount: number;
    isCommitted?: boolean | undefined;
}, {
    description: string;
    jobId: string;
    amount: number;
    isCommitted?: boolean | undefined;
}>;
export type CreateChangeOrderInput = z.infer<typeof createChangeOrderSchema>;
export declare const approveChangeOrderSchema: z.ZodObject<{
    status: z.ZodEnum<["APPROVED", "REJECTED"]>;
}, "strip", z.ZodTypeAny, {
    status: "APPROVED" | "REJECTED";
}, {
    status: "APPROVED" | "REJECTED";
}>;
export type ApproveChangeOrderInput = z.infer<typeof approveChangeOrderSchema>;
//# sourceMappingURL=create-change-order.schema.d.ts.map