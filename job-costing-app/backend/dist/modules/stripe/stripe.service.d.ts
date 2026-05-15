interface CreateCheckoutSessionParams {
    invoiceId: string;
    organizationId: string;
    successUrl: string;
    cancelUrl: string;
}
export declare class StripeService {
    createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{
        sessionId: string;
        url: string | null;
    }>;
    handleWebhook(payload: Buffer, signature: string): Promise<any>;
    getPaymentStatus(invoiceId: string, organizationId: string): Promise<{
        status: any;
        paymentIntentId: any;
    }>;
}
export declare const stripeService: StripeService;
export {};
//# sourceMappingURL=stripe.service.d.ts.map