import { z } from 'zod';

export const updateCostEntrySchema = z.object({
  categoryId: z.string().uuid().optional(),
  costCodeId: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  amount: z.number().positive().optional(),
  vendor: z.string().max(200).optional().nullable(),
  invoiceNumber: z.string().max(50).optional().nullable(),
  invoiceDate: z.string().datetime().optional().nullable(),
  receiptUrl: z.string().url().optional().nullable(),
});

export type UpdateCostEntryInput = z.infer<typeof updateCostEntrySchema>;