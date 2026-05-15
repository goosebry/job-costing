"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const labor_controller_1 = require("./labor.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.post('/', (0, rbac_middleware_1.requirePermission)('labor:create'), (0, error_middleware_1.asyncHandler)(labor_controller_1.laborController.create.bind(labor_controller_1.laborController)));
router.get('/job/:jobId', (0, rbac_middleware_1.requirePermission)('labor:read'), (0, error_middleware_1.asyncHandler)(labor_controller_1.laborController.findAllByJob.bind(labor_controller_1.laborController)));
router.patch('/:id', (0, rbac_middleware_1.requirePermission)('labor:update'), (0, error_middleware_1.asyncHandler)(labor_controller_1.laborController.update.bind(labor_controller_1.laborController)));
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('labor:delete'), (0, error_middleware_1.asyncHandler)(labor_controller_1.laborController.delete.bind(labor_controller_1.laborController)));
exports.default = router;
//# sourceMappingURL=labor.routes.js.map