import Stripe from 'stripe';
import prisma from '../../../config/database';
import { AppError } from '../../../middleware/error.middleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
});

interface CreateCheckoutSessionParams {
  invoiceId: string;
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
}

export class StripeService {
  async createCheckoutSession(params: CreateCheckoutSessionParams) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.invoiceId },
      include: {
        job: {
          select: { id: true, name: true, clientName: true, organizationId: true },
        },
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (invoice.job.organizationId !== params.organizationId) {
      throw new AppError('Invoice not found', 404);
    }

    const organization = await prisma.organization.findFirst({
      where: { id: params.organizationId },
      select: { stripeCustomerId: true },
    });

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
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

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { stripePaymentIntentId: session.payment_intent as string },
    });

    return { sessionId: session.id, url: session.url };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new AppError('Webhook secret not configured', 500);
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new AppError(`Webhook signature verification failed: ${err}`, 400);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const invoiceId = session.metadata?.invoiceId;

        if (invoiceId) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: 'PAID',
              paidAt: new Date(),
            },
          });

          const invoice = await prisma.invoice.findUnique({
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
            const notification = await prisma.notification.create({
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
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(`[Stripe] Payment failed: ${paymentIntent.id}`);
        break;
      }
    }

    return { received: true };
  }

  async getPaymentStatus(invoiceId: string, organizationId: string) {
    const invoice = await prisma.invoice.findFirst({
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
    } catch {
      return { status: invoice.status.toLowerCase(), paymentIntentId: invoice.stripePaymentIntentId };
    }
  }
}

export const stripeService = new StripeService();