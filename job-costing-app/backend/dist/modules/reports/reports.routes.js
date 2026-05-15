"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_controller_1 = require("./reports.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/executive-summary', (0, rbac_middleware_1.requirePermission)('reports:export'), (0, error_middleware_1.asyncHandler)(reports_controller_1.reportsController.getExecutiveSummary.bind(reports_controller_1.reportsController)));
router.get('/job-cost/:jobId', (0, rbac_middleware_1.requirePermission)('reports:export'), (0, error_middleware_1.asyncHandler)(reports_controller_1.reportsController.getJobCostReport.bind(reports_controller_1.reportsController)));
router.get('/profitability', (0, rbac_middleware_1.requirePermission)('reports:export'), (0, error_middleware_1.asyncHandler)(reports_controller_1.reportsController.getProfitabilityReport.bind(reports_controller_1.reportsController)));
router.get('/labor-utilization', (0, rbac_middleware_1.requirePermission)('reports:export'), (0, error_middleware_1.asyncHandler)(reports_controller_1.reportsController.getLaborUtilization.bind(reports_controller_1.reportsController)));
router.get('/cash-flow', (0, rbac_middleware_1.requirePermission)('reports:export'), (0, error_middleware_1.asyncHandler)(reports_controller_1.reportsController.getCashFlowReport.bind(reports_controller_1.reportsController)));
router.get('/export/:type', (0, rbac_middleware_1.requirePermission)('reports:export'), (0, error_middleware_1.asyncHandler)(reports_controller_1.reportsController.exportReport.bind(reports_controller_1.reportsController)));
exports.default = router;
//# sourceMappingURL=reports.routes.js.map