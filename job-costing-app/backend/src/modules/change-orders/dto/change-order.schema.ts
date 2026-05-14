import { z } from 'zod';
import { ChangeOrderStatus } from '@prisma/client';

export const createChangeOrderSchema = z.object({
  jobId: z.string().uuid({ message: 'Valid job ID required' }),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  amount: z.number().positive(),
  lines: z.array(z.object({
    budgetLineId: z.string().uuid().optional().nullable(),
    description: z.string().min(1).max(500),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    amount: z.number().positive(),
  })).optional(),
});

export type CreateChangeOrderInput = z.infer<typeof createChangeOrderSchema>;

export const updateChangeOrderSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  amount: z.number().positive().optional(),
  status: z.nativeEnum(ChangeOrderStatus).optional(),
});

export type UpdateChangeOrderInput = z.infer<typeof updateChangeOrderSchema>;

export const approveChangeOrderSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().max(500).optional(),
});

export type ApproveChangeOrderInput = z.infer<typeof approveChangeOrderSchema>;