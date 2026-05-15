"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_controller_js_1 = __importDefault(require("./notifications.controller.js"));
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const rbac_middleware_js_1 = require("../../middleware/rbac.middleware.js");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticate);
router.get('/', (0, rbac_middleware_js_1.requirePermission)('notifications:read'), notifications_controller_js_1.default.getNotifications.bind(notifications_controller_js_1.default));
router.patch('/:id/read', (0, rbac_middleware_js_1.requirePermission)('notifications:read'), notifications_controller_js_1.default.markAsRead.bind(notifications_controller_js_1.default));
router.patch('/read-all', (0, rbac_middleware_js_1.requirePermission)('notifications:read'), notifications_controller_js_1.default.markAllAsRead.bind(notifications_controller_js_1.default));
router.delete('/:id', (0, rbac_middleware_js_1.requirePermission)('notifications:write'), notifications_controller_js_1.default.deleteNotification.bind(notifications_controller_js_1.default));
exports.default = router;
//# sourceMappingURL=notifications.routes.js.map