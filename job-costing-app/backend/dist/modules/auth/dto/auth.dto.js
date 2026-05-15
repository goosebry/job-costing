"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterInputSchema = exports.LoginInputSchema = void 0;
const zod_1 = require("zod");
exports.LoginInputSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.RegisterInputSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    organizationName: zod_1.z.string().min(1).optional(),
    role: zod_1.z.enum(['ADMIN', 'PROJECT_MANAGER', 'COST_ACCOUNTANT', 'FIELD_WORKER']).optional(),
});
//# sourceMappingURL=auth.dto.js.map