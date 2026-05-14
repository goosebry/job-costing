import { z } from 'zod';

export const createCostEntrySchema = z.object({
  jobId: z.string().uuid({ message: 'Valid job ID required' }),
  categoryId: z.string().uuid({ message: 'Valid category ID required' }),
  costCodeId: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional(),
  amount: z.number().positive({ message: 'Amount must be positive' }),
  vendor: z.string().max(200).optional(),
  invoiceNumber: z.string().max(50).optional(),
  invoiceDate: z.string().datetime().optional(),
  receiptUrl: z.string().url().optional(),
});

export type CreateCostEntryInput = z.infer<typeof createCostEntrySchema>;