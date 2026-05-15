"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const budget_controller_1 = require("./budget.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/:jobId/summary', (0, rbac_middleware_1.requirePermission)('costs:read'), (0, error_middleware_1.asyncHandler)(budget_controller_1.budgetController.getBudgetSummary.bind(budget_controller_1.budgetController)));
router.get('/:jobId/cost-summary', (0, rbac_middleware_1.requirePermission)('costs:read'), (0, error_middleware_1.asyncHandler)(budget_controller_1.budgetController.getCostSummary.bind(budget_controller_1.budgetController)));
exports.default = router;
//# sourceMappingURL=budget.routes.js.map