"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const router = (0, express_1.Router)();
router.post('/register', (0, error_middleware_1.asyncHandler)(auth_controller_1.authController.register.bind(auth_controller_1.authController)));
router.post('/login', (0, error_middleware_1.asyncHandler)(auth_controller_1.authController.login.bind(auth_controller_1.authController)));
router.post('/refresh', (0, error_middleware_1.asyncHandler)(auth_controller_1.authController.refreshToken.bind(auth_controller_1.authController)));
router.post('/logout', (0, error_middleware_1.asyncHandler)(auth_controller_1.authController.logout.bind(auth_controller_1.authController)));
router.get('/profile', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(auth_controller_1.authController.getProfile.bind(auth_controller_1.authController)));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map