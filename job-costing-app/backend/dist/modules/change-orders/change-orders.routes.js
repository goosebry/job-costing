"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const change_orders_controller_1 = require("./change-orders.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.post('/', (0, rbac_middleware_1.requirePermission)('invoices:create'), (0, error_middleware_1.asyncHandler)(change_orders_controller_1.changeOrdersController.create.bind(change_orders_controller_1.changeOrdersController)));
router.get('/job/:jobId', (0, rbac_middleware_1.requirePermission)('invoices:read'), (0, error_middleware_1.asyncHandler)(change_orders_controller_1.changeOrdersController.findAllByJob.bind(change_orders_controller_1.changeOrdersController)));
router.patch('/:id/approve', (0, rbac_middleware_1.requirePermission)('change-orders:approve'), (0, error_middleware_1.asyncHandler)(change_orders_controller_1.changeOrdersController.approve.bind(change_orders_controller_1.changeOrdersController)));
exports.default = router;
//# sourceMappingURL=change-orders.routes.js.map