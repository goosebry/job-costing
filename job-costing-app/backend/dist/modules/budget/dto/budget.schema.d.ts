import { z } from 'zod';
export declare const createBudgetLineSchema: z.ZodObject<{
    jobId: z.ZodString;
    categoryId: z.ZodString;
    costCodeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    budgetedAmount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    categoryId: string;
    budgetedAmount: number;
    costCodeId?: string | null | undefined;
}, {
    jobId: string;
    categoryId: string;
    budgetedAmount: number;
    costCodeId?: string | null | undefined;
}>;
export type CreateBudgetLineInput = z.infer<typeof createBudgetLineSchema>;
export declare const updateBudgetLineSchema: z.ZodObject<{
    categoryId: z.ZodOptional<z.ZodString>;
    costCodeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    budgetedAmount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    categoryId?: string | undefined;
    costCodeId?: string | null | undefined;
    budgetedAmount?: number | undefined;
}, {
    categoryId?: string | undefined;
    costCodeId?: string | null | undefined;
    budgetedAmount?: number | undefined;
}>;
export type UpdateBudgetLineInput = z.infer<typeof updateBudgetLineSchema>;
//# sourceMappingURL=budget.schema.d.ts.map