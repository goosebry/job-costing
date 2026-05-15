import { z } from 'zod';

export const createJobSchema = z.object({
  name: z.string().min(1, 'Job name is required').max(200),
  description: z.string().max(2000).optional(),
  clientId: z.string().uuid().optional(),
  clientName: z.string().max(200).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  templateId: z.string().uuid('Invalid template ID').optional(),
  estimatedBudget: z.number().nonnegative().optional(),
  estimatedHours: z.number().nonnegative().optional(),
  // Accept both date (2026-05-16) and datetime (2026-05-16T00:00:00Z) strings
  startedAt: z.string().optional().transform(v => {
    if (!v) return undefined;
    // If it's just a date, append midnight UTC
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00.000Z` : v;
  }),
  status: z.enum(['DRAFT', 'PLANNING', 'ACTIVE', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;