import { z } from 'zod';

export const createInvoiceSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  dueDate: z.string().datetime('Invalid due date format'),
  taxRate: z.number().min(0).max(100).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional(),
});

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;