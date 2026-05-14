import { z } from 'zod';
import { InvoiceStatus } from '@prisma/client';

export const createInvoiceSchema = z.object({
  jobId: z.string().uuid({ message: 'Valid job ID required' }),
  invoiceNumber: z.string().min(1).max(50),
  amount: z.number().positive(),
  dueDate: z.string().datetime().optional(),
  lines: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    amount: z.number().positive(),
  })).min(1, { message: 'At least one line item required' }),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).max(50).optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.nativeEnum(InvoiceStatus).optional(),
});

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;