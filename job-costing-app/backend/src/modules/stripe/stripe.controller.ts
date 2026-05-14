import { Request, Response } from 'express';
import { stripeService } from './stripe.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class StripeController {
  async createCheckoutSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { invoiceId, successUrl, cancelUrl } = req.body;
    const result = await stripeService.createCheckoutSession({
      invoiceId,
      organizationId: req.user.organizationId,
      successUrl,
      cancelUrl,
    });
    res.json(result);
  }

  async getPaymentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { invoiceId } = req.params;
    const status = await stripeService.getPaymentStatus(invoiceId, req.user.organizationId);
    res.json(status);
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.body;

    try {
      const result = await stripeService.handleWebhook(payload, signature);
      res.json(result);
    } catch (error) {
      console.error('[Stripe Webhook Error]', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  }
}

export const stripeController = new StripeController();