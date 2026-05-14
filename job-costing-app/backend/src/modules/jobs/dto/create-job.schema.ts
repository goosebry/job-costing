import { z } from 'zod';

export const createJobSchema = z.object({
  name: z.string().min(1, 'Job name is required').max(200),
  description: z.string().max(2000).optional(),
  clientName: z.string().max(200).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  templateId: z.string().uuid('Invalid template ID').optional(),
  estimatedBudget: z.number().positive('Budget must be positive').optional(),
  startedAt: z.string().datetime().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;