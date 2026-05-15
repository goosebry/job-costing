"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jobs_controller_1 = require("./jobs.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.post('/', (0, rbac_middleware_1.requirePermission)('jobs:create'), (0, error_middleware_1.asyncHandler)(jobs_controller_1.jobsController.create.bind(jobs_controller_1.jobsController)));
router.get('/', (0, rbac_middleware_1.requirePermission)('jobs:read'), (0, error_middleware_1.asyncHandler)(jobs_controller_1.jobsController.findAll.bind(jobs_controller_1.jobsController)));
router.get('/templates', (0, rbac_middleware_1.requirePermission)('jobs:read'), (0, error_middleware_1.asyncHandler)(jobs_controller_1.jobsController.getTemplates.bind(jobs_controller_1.jobsController)));
router.get('/:id', (0, rbac_middleware_1.requirePermission)('jobs:read'), (0, error_middleware_1.asyncHandler)(jobs_controller_1.jobsController.findOne.bind(jobs_controller_1.jobsController)));
router.patch('/:id', (0, rbac_middleware_1.requirePermission)('jobs:update'), (0, error_middleware_1.asyncHandler)(jobs_controller_1.jobsController.update.bind(jobs_controller_1.jobsController)));
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('jobs:delete'), (0, error_middleware_1.asyncHandler)(jobs_controller_1.jobsController.delete.bind(jobs_controller_1.jobsController)));
router.post('/:id/apply-template', (0, rbac_middleware_1.requirePermission)('jobs:update'), (0, error_middleware_1.asyncHandler)(jobs_controller_1.jobsController.applyTemplate.bind(jobs_controller_1.jobsController)));
exports.default = router;
//# sourceMappingURL=jobs.routes.js.map