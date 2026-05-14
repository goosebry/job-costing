import { z } from 'zod';

export const generateReportSchema = z.object({
  type: z.enum(['job_pl', 'cost_vs_budget', 'labor_utilization', 'wip_summary', 'job_status']),
  jobId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  format: z.enum(['json', 'pdf', 'csv']).default('json'),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;