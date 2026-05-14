import { z } from 'zod';

export const createChangeOrderSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  description: z.string().min(1, 'Description is required').max(1000),
  amount: z.number().positive('Amount must be positive'),
  isCommitted: z.boolean().optional(),
});

export type CreateChangeOrderInput = z.infer<typeof createChangeOrderSchema>;

export const approveChangeOrderSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export type ApproveChangeOrderInput = z.infer<typeof approveChangeOrderSchema>;