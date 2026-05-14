import { Router } from 'express';
import { stripeController } from './stripe.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

const router = Router();

router.post(
  '/create-checkout-session',
  authMiddleware,
  requirePermission('invoices:create'),
  asyncHandler(stripeController.createCheckoutSession.bind(stripeController))
);

router.get(
  '/payment-status/:invoiceId',
  authMiddleware,
  requirePermission('invoices:read'),
  asyncHandler(stripeController.getPaymentStatus.bind(stripeController))
);

router.post(
  '/webhook',
  stripeController.handleWebhook.bind(stripeController)
);

export default router;