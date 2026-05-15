"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoices_controller_1 = require("./invoices.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.post('/', (0, rbac_middleware_1.requirePermission)('invoices:create'), (0, error_middleware_1.asyncHandler)(invoices_controller_1.invoicesController.create.bind(invoices_controller_1.invoicesController)));
router.get('/', (0, rbac_middleware_1.requirePermission)('invoices:read'), (0, error_middleware_1.asyncHandler)(invoices_controller_1.invoicesController.findAll.bind(invoices_controller_1.invoicesController)));
router.get('/:id', (0, rbac_middleware_1.requirePermission)('invoices:read'), (0, error_middleware_1.asyncHandler)(invoices_controller_1.invoicesController.findOne.bind(invoices_controller_1.invoicesController)));
router.patch('/:id', (0, rbac_middleware_1.requirePermission)('invoices:update'), (0, error_middleware_1.asyncHandler)(invoices_controller_1.invoicesController.update.bind(invoices_controller_1.invoicesController)));
exports.default = router;
//# sourceMappingURL=invoices.routes.js.map