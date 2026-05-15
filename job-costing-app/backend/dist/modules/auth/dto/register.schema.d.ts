import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    organizationName: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<["ADMIN", "PROJECT_MANAGER", "COST_ACCOUNTANT", "FIELD_WORKER"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    role?: "ADMIN" | "PROJECT_MANAGER" | "COST_ACCOUNTANT" | "FIELD_WORKER" | undefined;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    role?: "ADMIN" | "PROJECT_MANAGER" | "COST_ACCOUNTANT" | "FIELD_WORKER" | undefined;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
//# sourceMappingURL=register.schema.d.ts.map