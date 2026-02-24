import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import Stripe from 'stripe';

async function fulfillCheckout(sessionId: string): Promise<void> {
  console.log(`Fulfilling Checkout Session ${sessionId}`);
  
  const stripe = await getUncachableStripeClient();
  
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items'],
  });
  
  if (session.payment_status === 'unpaid') {
    console.log(`Session ${sessionId} is unpaid, skipping fulfillment`);
    return;
  }
  
  const purchaseId = session.metadata?.purchaseId;
  if (!purchaseId) {
    console.log(`No purchaseId in session ${sessionId} metadata, skipping`);
    return;
  }
  
  const purchase = await storage.getPurchase(purchaseId);
  if (!purchase) {
    console.log(`Purchase ${purchaseId} not found`);
    return;
  }
  
  if (purchase.status === 'succeeded') {
    console.log(`Purchase ${purchaseId} already fulfilled, skipping`);
    return;
  }
  
  await storage.updatePurchaseStatus(
    purchaseId,
    'succeeded',
    session.payment_intent as string
  );
  
  const athlete = await storage.getAthlete(purchase.athleteId);
  const coach = await storage.getCoach(purchase.coachId);
  
  if (!athlete || !coach) {
    console.log(`Athlete or coach not found for purchase ${purchaseId}`);
    return;
  }
  
  const selectedSlots = purchase.selectedSlots as Array<{
    slotId: string;
    date: string;
    startTime: string;
    endTime: string;
  }>;
  
  const invoiceNumber = await storage.generateInvoiceNumber();
  await storage.createInvoice({
    purchaseId,
    invoiceNumber,
    athleteId: purchase.athleteId,
    coachId: purchase.coachId,
    athleteName: athlete.name,
    athleteEmail: athlete.email,
    coachName: coach.name,
    coachEmail: coach.email,
    subtotal: purchase.subtotal,
    serviceFee: purchase.serviceFee,
    taxAmount: purchase.taxAmount,
    totalAmount: purchase.totalAmount,
    currency: purchase.currency,
    sessionDetails: selectedSlots,
    paidAt: new Date(),
    providerReceiptUrl: null,
    metadata: { 
      sessionId, 
      paymentIntent: session.payment_intent,
      amountTotal: session.amount_total,
      currency: session.currency,
    },
  });
  
  const slotIds = selectedSlots.map(slot => slot.slotId);
  await storage.deleteAvailabilitySlotsByIds(slotIds);
  console.log(`Blocked ${slotIds.length} slots for coach ${purchase.coachId}`);
  
  const sessionCount = selectedSlots.length;
  const coachAmount = ((purchase.subtotal) / 100).toFixed(2);
  
  await storage.createNotification({
    recipientId: purchase.coachId,
    recipientType: 'coach',
    type: 'new_booking',
    title: 'New Booking Received!',
    message: `${athlete.name} booked ${sessionCount} session${sessionCount > 1 ? 's' : ''} with you. You'll receive CA$${coachAmount} directly to your Stripe account.`,
    data: {
      purchaseId,
      athleteId: purchase.athleteId,
      athleteName: athlete.name,
      athleteEmail: athlete.email,
      sessionCount,
      totalAmount: purchase.totalAmount,
      coachAmount: purchase.subtotal,
      sessions: selectedSlots,
    },
  });
  
  console.log(`Created notification for coach ${purchase.coachId}`);
  console.log(`Successfully fulfilled purchase ${purchaseId} with invoice ${invoiceNumber}`);
}

async function handlePaymentFailed(sessionId: string): Promise<void> {
  console.log(`Handling failed payment for session ${sessionId}`);
  
  const stripe = await getUncachableStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  
  const purchaseId = session.metadata?.purchaseId;
  if (!purchaseId) {
    return;
  }
  
  const purchase = await storage.getPurchase(purchaseId);
  if (!purchase || purchase.status !== 'pending') {
    return;
  }
  
  await storage.updatePurchaseStatus(purchaseId, 'failed');
  console.log(`Marked purchase ${purchaseId} as failed`);
}

async function handleSessionExpired(sessionId: string): Promise<void> {
  console.log(`Handling expired session ${sessionId}`);
  
  const stripe = await getUncachableStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  
  const purchaseId = session.metadata?.purchaseId;
  if (!purchaseId) {
    return;
  }
  
  const purchase = await storage.getPurchase(purchaseId);
  if (!purchase || purchase.status !== 'pending') {
    return;
  }
  
  await storage.updatePurchaseStatus(purchaseId, 'cancelled');
  console.log(`Marked purchase ${purchaseId} as cancelled due to session expiry`);
}

async function handleV2AccountUpdate(accountId: string): Promise<void> {
  console.log(`Handling V2 account update for ${accountId}`);
  
  const stripe = await getUncachableStripeClient();
  
  try {
    const accountResponse = await stripe.rawRequest(
      'GET',
      `/v2/core/accounts/${accountId}?include[]=configuration.merchant&include[]=requirements`,
      undefined,
      {
        additionalHeaders: {
          'Stripe-Version': '2025-12-15.preview',
        },
      }
    );
    
    const account = accountResponse as any;
    const coachId = account?.metadata?.coachId;
    
    if (!coachId) {
      console.log(`No coachId in V2 account ${accountId} metadata, skipping`);
      return;
    }
    
    const cardPaymentsStatus = account?.configuration?.merchant?.capabilities?.card_payments?.status;
    const chargesEnabled = cardPaymentsStatus === 'active';
    const requirementsStatus = account?.requirements?.summary?.minimum_deadline?.status;
    const onboardingComplete = requirementsStatus !== 'currently_due' && requirementsStatus !== 'past_due';
    
    await storage.updateCoach(coachId, {
      stripeAccountStatus: chargesEnabled ? 'active' : 'pending',
      stripeOnboardingComplete: (chargesEnabled && onboardingComplete) ? 'true' : 'false',
    });
    
    console.log(`Updated coach ${coachId} from V2 event: charges=${chargesEnabled}, onboarding=${onboardingComplete}`);
  } catch (error: any) {
    console.error(`Error handling V2 account update for ${accountId}:`, error.message);
  }
}

async function handleV1AccountUpdate(account: Stripe.Account): Promise<void> {
  console.log(`Handling V1 account update for ${account.id}`);
  
  const coachId = account.metadata?.coachId;
  if (!coachId) {
    console.log(`No coachId in account ${account.id} metadata, skipping`);
    return;
  }

  const onboardingComplete = account.charges_enabled && account.payouts_enabled;
  await storage.updateCoach(coachId, {
    stripeAccountStatus: account.charges_enabled ? 'active' : 'pending',
    stripeOnboardingComplete: onboardingComplete ? 'true' : 'false',
  });
  
  console.log(`Updated coach ${coachId} V1 status: charges=${account.charges_enabled}, payouts=${account.payouts_enabled}`);
}

export class WebhookHandlers {
  // Handle V1 webhook events (checkout, account.updated)
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const stripe = await getUncachableStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET is not set. Webhook signature verification cannot be skipped. ' +
        'Set the STRIPE_WEBHOOK_SECRET environment variable from your Stripe Dashboard webhook settings.'
      );
    }

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    
    console.log(`Received webhook event: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const completedSession = event.data.object as Stripe.Checkout.Session;
        await fulfillCheckout(completedSession.id);
        break;
      }
      case 'checkout.session.async_payment_failed': {
        const failedSession = event.data.object as Stripe.Checkout.Session;
        await handlePaymentFailed(failedSession.id);
        break;
      }
      case 'checkout.session.expired': {
        const expiredSession = event.data.object as Stripe.Checkout.Session;
        await handleSessionExpired(expiredSession.id);
        break;
      }
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        await handleV1AccountUpdate(account);
        break;
      }
    }
  }

  static async processV2ThinEvent(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error('V2 webhook payload must be a Buffer.');
    }

    const stripe = await getUncachableStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_V2 || process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('Webhook secret not configured for V2 events.');
    }

    // Verify signature using the same constructEvent method (works for V2 thin events too)
    const verifiedEvent = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    
    console.log(`Received V2 thin event: ${verifiedEvent.type}`);

    const eventType = verifiedEvent.type;

    if (
      eventType === 'v2.core.account[requirements].updated' ||
      eventType === 'v2.core.account[configuration.merchant].capability_status_updated' ||
      eventType === 'v2.core.account[configuration.customer].capability_status_updated' ||
      eventType === 'account.updated'
    ) {
      const eventData = verifiedEvent as any;
      const accountId = eventData.related_object?.id || eventData.data?.object?.id || eventData.account;
      if (accountId) {
        await handleV2AccountUpdate(accountId);
      }
    }
  }
}
