"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const onboarding_controller_1 = require("./onboarding.controller");
const router = (0, express_1.Router)();
// All onboarding routes require authentication
router.use(auth_middleware_1.authMiddleware);
router.post('/setup-demo', (0, error_middleware_1.asyncHandler)((req, res) => onboarding_controller_1.onboardingController.setupDemo(req, res)));
router.post('/go-live', (0, error_middleware_1.asyncHandler)((req, res) => onboarding_controller_1.onboardingController.goLive(req, res)));
router.post('/clear-data', (0, error_middleware_1.asyncHandler)((req, res) => onboarding_controller_1.onboardingController.clearData(req, res)));
router.post('/redo-setup', (0, error_middleware_1.asyncHandler)((req, res) => onboarding_controller_1.onboardingController.redoSetup(req, res)));
router.get('/status', (0, error_middleware_1.asyncHandler)((req, res) => onboarding_controller_1.onboardingController.getStatus(req, res)));
exports.default = router;
//# sourceMappingURL=onboarding.routes.js.map