"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeController = exports.StripeController = void 0;
const stripe_service_1 = require("./stripe.service");
class StripeController {
    async createCheckoutSession(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { invoiceId, successUrl, cancelUrl } = req.body;
        const result = await stripe_service_1.stripeService.createCheckoutSession({
            invoiceId,
            organizationId: req.user.organizationId,
            successUrl,
            cancelUrl,
        });
        res.json(result);
    }
    async getPaymentStatus(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { invoiceId } = req.params;
        const status = await stripe_service_1.stripeService.getPaymentStatus(invoiceId, req.user.organizationId);
        res.json(status);
    }
    async handleWebhook(req, res) {
        const signature = req.headers['stripe-signature'];
        const payload = req.body;
        try {
            const result = await stripe_service_1.stripeService.handleWebhook(payload, signature);
            res.json(result);
        }
        catch (error) {
            console.error('[Stripe Webhook Error]', error);
            res.status(400).json({ error: 'Webhook processing failed' });
        }
    }
}
exports.StripeController = StripeController;
exports.stripeController = new StripeController();
//# sourceMappingURL=stripe.controller.js.map