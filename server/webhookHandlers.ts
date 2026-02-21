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
  
  // Update purchase status
  await storage.updatePurchaseStatus(
    purchaseId,
    'succeeded',
    session.payment_intent as string
  );
  
  // Get athlete and coach details for invoice
  const athlete = await storage.getAthlete(purchase.athleteId);
  const coach = await storage.getCoach(purchase.coachId);
  
  if (!athlete || !coach) {
    console.log(`Athlete or coach not found for purchase ${purchaseId}`);
    return;
  }
  
  // Parse selected slots from purchase
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
  
  // Block the booked slots by deleting them from availability
  const slotIds = selectedSlots.map(slot => slot.slotId);
  await storage.deleteAvailabilitySlotsByIds(slotIds);
  console.log(`Blocked ${slotIds.length} slots for coach ${purchase.coachId}`);
  
  // Create notification for the coach
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

async function handleAccountUpdated(account: Stripe.Account): Promise<void> {
  console.log(`Handling account update for ${account.id}`);
  
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
  
  console.log(`Updated coach ${coachId} Stripe status: charges=${account.charges_enabled}, payouts=${account.payouts_enabled}`);
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

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const stripe = await getUncachableStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    if (!webhookSecret) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET is not set. Webhook signature verification cannot be skipped. ' +
        'Set the STRIPE_WEBHOOK_SECRET environment variable from your Stripe Dashboard webhook settings.'
      );
    }

    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    
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
        await handleAccountUpdated(account);
        break;
      }
    }
  }
}
