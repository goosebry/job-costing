"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const costs_controller_1 = require("./costs.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.post('/', (0, rbac_middleware_1.requirePermission)('costs:create'), (0, error_middleware_1.asyncHandler)(costs_controller_1.costsController.create.bind(costs_controller_1.costsController)));
router.get('/job/:jobId', (0, rbac_middleware_1.requirePermission)('costs:read'), (0, error_middleware_1.asyncHandler)(costs_controller_1.costsController.findAllByJob.bind(costs_controller_1.costsController)));
router.patch('/:id', (0, rbac_middleware_1.requirePermission)('costs:update'), (0, error_middleware_1.asyncHandler)(costs_controller_1.costsController.update.bind(costs_controller_1.costsController)));
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('costs:delete'), (0, error_middleware_1.asyncHandler)(costs_controller_1.costsController.delete.bind(costs_controller_1.costsController)));
router.get('/categories', (0, rbac_middleware_1.requirePermission)('costs:read'), (0, error_middleware_1.asyncHandler)(costs_controller_1.costsController.getCategories.bind(costs_controller_1.costsController)));
router.post('/categories', (0, rbac_middleware_1.requirePermission)('settings:manage'), (0, error_middleware_1.asyncHandler)(costs_controller_1.costsController.createCategory.bind(costs_controller_1.costsController)));
exports.default = router;
//# sourceMappingURL=costs.routes.js.map