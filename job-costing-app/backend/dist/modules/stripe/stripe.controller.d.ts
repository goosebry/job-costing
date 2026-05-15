import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
export declare class StripeController {
    createCheckoutSession(req: AuthenticatedRequest, res: Response): Promise<void>;
    getPaymentStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    handleWebhook(req: Request, res: Response): Promise<void>;
}
export declare const stripeController: StripeController;
//# sourceMappingURL=stripe.controller.d.ts.map