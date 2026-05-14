import { z } from 'zod';

export const createLaborSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  workerName: z.string().min(1, 'Worker name is required').max(100),
  role: z.string().min(1, 'Role is required').max(100),
  hoursWorked: z.number().positive('Hours worked must be positive'),
  hourlyRate: z.number().min(0, 'Hourly rate cannot be negative'),
  hoursTravel: z.number().min(0).optional(),
  date: z.string().datetime('Invalid date format'),
});

export type CreateLaborInput = z.infer<typeof createLaborSchema>;

export const updateLaborSchema = z.object({
  workerName: z.string().min(1).max(100).optional(),
  role: z.string().min(1).max(100).optional(),
  hoursWorked: z.number().positive().optional(),
  hourlyRate: z.number().min(0).optional(),
  hoursTravel: z.number().min(0).optional(),
  date: z.string().datetime().optional(),
});

export type UpdateLaborInput = z.infer<typeof updateLaborSchema>;