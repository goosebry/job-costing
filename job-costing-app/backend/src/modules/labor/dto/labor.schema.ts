import { z } from 'zod';
import { LaborApprovalStatus } from '@prisma/client';

export const createLaborEntrySchema = z.object({
  jobId: z.string().uuid({ message: 'Valid job ID required' }),
  date: z.string().datetime({ message: 'Valid date required' }),
  hoursWorked: z.number().min(0).max(24, { message: 'Hours worked must be between 0 and 24' }),
  hoursTravel: z.number().min(0).max(24).default(0),
  hourlyRate: z.number().positive().optional(),
  lumpSum: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

export type CreateLaborEntryInput = z.infer<typeof createLaborEntrySchema>;

export const updateLaborEntrySchema = z.object({
  date: z.string().datetime().optional(),
  hoursWorked: z.number().min(0).max(24).optional(),
  hoursTravel: z.number().min(0).max(24).optional(),
  hourlyRate: z.number().positive().optional().nullable(),
  lumpSum: z.number().positive().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  approvalStatus: z.nativeEnum(LaborApprovalStatus).optional(),
});

export type UpdateLaborEntryInput = z.infer<typeof updateLaborEntrySchema>;

export const approveLaborEntrySchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().max(500).optional(),
});

export type ApproveLaborEntryInput = z.infer<typeof approveLaborEntrySchema>;