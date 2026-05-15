"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_controller_1 = require("./stripe.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const router = (0, express_1.Router)();
router.post('/create-checkout-session', auth_middleware_1.authMiddleware, (0, rbac_middleware_1.requirePermission)('invoices:create'), (0, error_middleware_1.asyncHandler)(stripe_controller_1.stripeController.createCheckoutSession.bind(stripe_controller_1.stripeController)));
router.get('/payment-status/:invoiceId', auth_middleware_1.authMiddleware, (0, rbac_middleware_1.requirePermission)('invoices:read'), (0, error_middleware_1.asyncHandler)(stripe_controller_1.stripeController.getPaymentStatus.bind(stripe_controller_1.stripeController)));
router.post('/webhook', stripe_controller_1.stripeController.handleWebhook.bind(stripe_controller_1.stripeController));
exports.default = router;
//# sourceMappingURL=stripe.routes.js.map