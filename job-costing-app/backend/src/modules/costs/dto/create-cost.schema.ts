import { z } from 'zod';

export const createCostSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  categoryId: z.string().uuid('Invalid category ID'),
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().positive('Quantity must be positive'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative'),
  vendor: z.string().max(200).optional().nullable(),
  invoiceNumber: z.string().max(100).optional().nullable(),
  isBillable: z.boolean().optional(),
  date: z.string().datetime('Invalid date format'),
});

export type CreateCostInput = z.infer<typeof createCostSchema>;

export const updateCostSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID').optional(),
  description: z.string().min(1).max(500).optional(),
  quantity: z.number().positive().optional(),
  unitCost: z.number().min(0).optional(),
  vendor: z.string().max(200).optional().nullable(),
  invoiceNumber: z.string().max(100).optional().nullable(),
  isBillable: z.boolean().optional(),
  date: z.string().datetime().optional(),
});

export type UpdateCostInput = z.infer<typeof updateCostSchema>;