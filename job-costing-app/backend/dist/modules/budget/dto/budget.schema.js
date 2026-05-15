"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBudgetLineSchema = exports.createBudgetLineSchema = void 0;
const zod_1 = require("zod");
exports.createBudgetLineSchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid({ message: 'Valid job ID required' }),
    categoryId: zod_1.z.string().uuid({ message: 'Valid category ID required' }),
    costCodeId: zod_1.z.string().uuid().optional().nullable(),
    budgetedAmount: zod_1.z.number().positive({ message: 'Budgeted amount must be positive' }),
});
exports.updateBudgetLineSchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid().optional(),
    costCodeId: zod_1.z.string().uuid().optional().nullable(),
    budgetedAmount: zod_1.z.number().positive().optional(),
});
//# sourceMappingURL=budget.schema.js.map