"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeService = exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const database_1 = __importDefault(require("../../../config/database"));
const error_middleware_1 = require("../../../middleware/error.middleware");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2023-10-16',
});
class StripeService {
    async createCheckoutSession(params) {
        const invoice = await database_1.default.invoice.findUnique({
            where: { id: params.invoiceId },
            include: {
                job: {
                    select: { id: true, name: true, clientName: true, organizationId: true },
                },
            },
        });
        if (!invoice) {
            throw new error_middleware_1.AppError('Invoice not found', 404);
        }
        if (invoice.job.organizationId !== params.organizationId) {
            throw new error_middleware_1.AppError('Invoice not found', 404);
        }
        const organization = await database_1.default.organization.findFirst({
            where: { id: params.organizationId },
            select: { stripeCustomerId: true },
        });
        const sessionConfig = {
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Invoice ${invoice.invoiceNumber}`,
                            description: `Payment for job: ${invoice.job.name}`,
                        },
                        unit_amount: Math.round(Number(invoice.total) * 100),
                    },
                    quantity: 1,
                },
            ],
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            metadata: {
                invoiceId: invoice.id,
                jobId: invoice.jobId,
            },
        };
        if (organization?.stripeCustomerId) {
            sessionConfig.customer = organization.stripeCustomerId;
        }
        const session = await stripe.checkout.sessions.create(sessionConfig);
        await database_1.default.invoice.update({
            where: { id: invoice.id },
            data: { stripePaymentIntentId: session.payment_intent },
        });
        return { sessionId: session.id, url: session.url };
    }
    async handleWebhook(payload, signature) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new error_middleware_1.AppError('Webhook secret not configured', 500);
        }
        let event;
        try {
            event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        }
        catch (err) {
            throw new error_middleware_1.AppError(`Webhook signature verification failed: ${err}`, 400);
        }
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const invoiceId = session.metadata?.invoiceId;
                if (invoiceId) {
                    await database_1.default.invoice.update({
                        where: { id: invoiceId },
                        data: {
                            status: 'PAID',
                            paidAt: new Date(),
                        },
                    });
                    const invoice = await database_1.default.invoice.findUnique({
                        where: { id: invoiceId },
                        include: {
                            job: {
                                include: {
                                    organization: { select: { id: true } },
                                },
                            },
                        },
                    });
                    if (invoice) {
                        const notification = await database_1.default.notification.create({
                            data: {
                                userId: invoice.job.createdById || 'system',
                                type: 'payment_received',
                                title: 'Payment Received',
                                message: `Invoice ${invoice.invoiceNumber} has been paid. Amount: $${invoice.total}`,
                                data: {
                                    invoiceId: invoice.id,
                                    amount: invoice.total,
                                    jobId: invoice.jobId,
                                },
                            },
                        });
                        return notification;
                    }
                }
                break;
            }
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                console.error(`[Stripe] Payment failed: ${paymentIntent.id}`);
                break;
            }
        }
        return { received: true };
    }
    async getPaymentStatus(invoiceId, organizationId) {
        const invoice = await database_1.default.invoice.findFirst({
            where: { id: invoiceId, job: { organizationId } },
            select: { stripePaymentIntentId: true, status: true },
        });
        if (!invoice || !invoice.stripePaymentIntentId) {
            return { status: 'not_started', paymentIntentId: null };
        }
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(invoice.stripePaymentIntentId);
            return {
                status: paymentIntent.status,
                paymentIntentId: paymentIntent.id,
            };
        }
        catch {
            return { status: invoice.status.toLowerCase(), paymentIntentId: invoice.stripePaymentIntentId };
        }
    }
}
exports.StripeService = StripeService;
exports.stripeService = new StripeService();
//# sourceMappingURL=stripe.service.js.map