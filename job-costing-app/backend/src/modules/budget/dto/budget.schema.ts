import { z } from 'zod';

export const createBudgetLineSchema = z.object({
  jobId: z.string().uuid({ message: 'Valid job ID required' }),
  categoryId: z.string().uuid({ message: 'Valid category ID required' }),
  costCodeId: z.string().uuid().optional().nullable(),
  budgetedAmount: z.number().positive({ message: 'Budgeted amount must be positive' }),
});

export type CreateBudgetLineInput = z.infer<typeof createBudgetLineSchema>;

export const updateBudgetLineSchema = z.object({
  categoryId: z.string().uuid().optional(),
  costCodeId: z.string().uuid().optional().nullable(),
  budgetedAmount: z.number().positive().optional(),
});

export type UpdateBudgetLineInput = z.infer<typeof updateBudgetLineSchema>;