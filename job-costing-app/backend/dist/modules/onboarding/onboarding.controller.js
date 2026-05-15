"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingController = exports.OnboardingController = void 0;
const onboarding_service_1 = require("./onboarding.service");
const error_middleware_1 = require("../../middleware/error.middleware");
class OnboardingController {
    async setupDemo(req, res) {
        if (!req.user)
            throw new error_middleware_1.AppError('Unauthorized', 401);
        const { businessType, businessName, password } = req.body;
        const result = await onboarding_service_1.onboardingService.setupDemo(req.user.organizationId, businessType, businessName, password);
        res.json(result);
    }
    async goLive(req, res) {
        if (!req.user)
            throw new error_middleware_1.AppError('Unauthorized', 401);
        const { password } = req.body;
        const result = await onboarding_service_1.onboardingService.goLive(req.user.organizationId, req.user.userId, password);
        res.json(result);
    }
    async clearData(req, res) {
        if (!req.user)
            throw new error_middleware_1.AppError('Unauthorized', 401);
        const { password } = req.body;
        const result = await onboarding_service_1.onboardingService.clearData(req.user.organizationId, req.user.userId, password);
        res.json(result);
    }
    async redoSetup(req, res) {
        if (!req.user)
            throw new error_middleware_1.AppError('Unauthorized', 401);
        const { password } = req.body;
        const result = await onboarding_service_1.onboardingService.redoSetup(req.user.organizationId, req.user.userId, password);
        res.json(result);
    }
    async getStatus(req, res) {
        if (!req.user)
            throw new error_middleware_1.AppError('Unauthorized', 401);
        const result = await onboarding_service_1.onboardingService.getStatus(req.user.organizationId);
        res.json(result);
    }
}
exports.OnboardingController = OnboardingController;
exports.onboardingController = new OnboardingController();
//# sourceMappingURL=onboarding.controller.js.map