import { z } from 'zod';

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  organizationName: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'COST_ACCOUNTANT', 'FIELD_WORKER']).optional(),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;