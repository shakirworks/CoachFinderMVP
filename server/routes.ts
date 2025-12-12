import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAthleteSchema, insertCoachSchema, insertMessageSchema, insertAvailabilitySlotSchema, bookingQuoteRequestSchema, bookingCheckoutRequestSchema } from "@shared/schema";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

const SERVICE_FEE_PERCENTAGE = 0.10;
const PLATFORM_FEE_PERCENTAGE = 0.10;

export async function registerRoutes(app: Express): Promise<Server> {
  // Check if email exists
  app.get("/api/users/exists", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const result = await storage.checkEmailExists(email);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create athlete
  app.post("/api/athletes", async (req, res) => {
    try {
      const athleteData = insertAthleteSchema.parse(req.body);
      const athlete = await storage.createAthlete(athleteData);
      res.json(athlete);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all athletes
  app.get("/api/athletes", async (req, res) => {
    try {
      const athletes = await storage.getAllAthletes();
      res.json(athletes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update athlete
  app.patch("/api/athletes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const athlete = await storage.updateAthlete(id, updates);
      if (!athlete) {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
      res.json(athlete);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete athlete
  app.delete("/api/athletes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const athlete = await storage.getAthlete(id);
      if (!athlete) {
        return res.status(404).json({ error: "Athlete not found" });
      }
      await storage.deleteAthlete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create coach
  app.post("/api/coaches", async (req, res) => {
    try {
      const coachData = insertCoachSchema.parse(req.body);
      
      // Check if coach with this email already exists
      const existingCoach = await storage.getCoachByEmail(coachData.email);
      if (existingCoach) {
        return res.status(409).json({ 
          error: "A coach account with this email already exists. Please use a different email or log in to your existing account." 
        });
      }
      
      const coach = await storage.createCoach(coachData);
      res.json(coach);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all coaches
  app.get("/api/coaches", async (req, res) => {
    try {
      const coaches = await storage.getAllCoaches();
      res.json(coaches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Login - check if athlete email exists
  app.post("/api/login", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const athlete = await storage.getAthleteByEmail(email);
      if (!athlete) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(athlete);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Coach login - check if coach email exists
  app.post("/api/login/coach", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const coach = await storage.getCoachByEmail(email);
      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }
      
      res.json(coach);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single coach by ID
  app.get("/api/coaches/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const coach = await storage.getCoach(id);
      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }
      res.json(coach);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update coach
  app.patch("/api/coaches/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const coach = await storage.updateCoach(id, updates);
      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }
      
      res.json(coach);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete coach
  app.delete("/api/coaches/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const coach = await storage.getCoach(id);
      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }
      await storage.deleteCoach(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send message
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get message thread between athlete and coach
  app.get("/api/messages/:athleteId/:coachId", async (req, res) => {
    try {
      const { athleteId, coachId } = req.params;
      const messages = await storage.getMessageThread(athleteId, coachId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all message threads for an athlete
  app.get("/api/athletes/:athleteId/messages", async (req, res) => {
    try {
      const { athleteId } = req.params;
      const threads = await storage.getAthleteMessageThreads(athleteId);
      res.json(threads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create availability slot
  app.post("/api/availability", async (req, res) => {
    try {
      const slotData = insertAvailabilitySlotSchema.parse(req.body);
      const slot = await storage.createAvailabilitySlot(slotData);
      res.json(slot);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get coach availability
  app.get("/api/availability/:coachId", async (req, res) => {
    try {
      const { coachId } = req.params;
      const slots = await storage.getCoachAvailability(coachId);
      res.json(slots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete availability slot
  app.delete("/api/availability/:slotId", async (req, res) => {
    try {
      const { slotId } = req.params;
      await storage.deleteAvailabilitySlot(slotId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clear all slots for a specific day
  app.delete("/api/availability/:coachId/:date", async (req, res) => {
    try {
      const { coachId, date } = req.params;
      await storage.clearDayAvailability(coachId, date);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get booking quote - calculate pricing for selected slots
  app.post("/api/bookings/quote", async (req, res) => {
    try {
      const { coachId, slotIds } = bookingQuoteRequestSchema.parse(req.body);
      
      // Get coach to get hourly rate
      const coach = await storage.getCoach(coachId);
      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }
      
      // Get the selected slots
      const slots = await storage.getAvailabilitySlotsByIds(slotIds);
      if (slots.length === 0) {
        return res.status(400).json({ error: "No valid slots found" });
      }
      
      // Calculate pricing (in cents for precision)
      const hourlyRate = parseFloat(coach.hourlyRate || "50");
      const hourlyRateCents = Math.round(hourlyRate * 100);
      const subtotalCents = hourlyRateCents * slots.length;
      const serviceFeeCents = Math.round(subtotalCents * SERVICE_FEE_PERCENTAGE);
      const totalAmountCents = subtotalCents + serviceFeeCents;
      
      const quote = {
        coachId,
        coachName: coach.name,
        hourlyRate: hourlyRateCents,
        slots: slots.map(slot => ({
          slotId: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
        subtotal: subtotalCents,
        serviceFee: serviceFeeCents,
        serviceFeePercentage: SERVICE_FEE_PERCENTAGE,
        totalAmount: totalAmountCents,
        currency: "USD",
      };
      
      res.json(quote);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get Stripe publishable key for frontend
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      res.status(500).json({ error: "Stripe not configured" });
    }
  });

  // Create Stripe Connect account for coach
  app.post("/api/coaches/:coachId/stripe/connect", async (req, res) => {
    try {
      const { coachId } = req.params;
      const coach = await storage.getCoach(coachId);
      
      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }

      const stripe = await getUncachableStripeClient();
      
      // Check if coach already has a Stripe account
      if (coach.stripeAccountId) {
        // Create new account link for existing account
        const accountLink = await stripe.accountLinks.create({
          account: coach.stripeAccountId,
          refresh_url: `${req.protocol}://${req.get('host')}/coach-dashboard?stripe=refresh`,
          return_url: `${req.protocol}://${req.get('host')}/coach-dashboard?stripe=success`,
          type: 'account_onboarding',
        });
        return res.json({ url: accountLink.url, accountId: coach.stripeAccountId });
      }

      // Create new Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: coach.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          coachId: coach.id,
          coachName: coach.name,
        },
      });

      // Save Stripe account ID to coach
      await storage.updateCoach(coachId, {
        stripeAccountId: account.id,
        stripeAccountStatus: 'pending',
        stripeOnboardingComplete: 'false',
      });

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${req.protocol}://${req.get('host')}/coach-dashboard?stripe=refresh`,
        return_url: `${req.protocol}://${req.get('host')}/coach-dashboard?stripe=success`,
        type: 'account_onboarding',
      });

      res.json({ url: accountLink.url, accountId: account.id });
    } catch (error: any) {
      console.error('Stripe Connect error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get coach's Stripe account status
  app.get("/api/coaches/:coachId/stripe/status", async (req, res) => {
    try {
      const { coachId } = req.params;
      const coach = await storage.getCoach(coachId);
      
      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }

      if (!coach.stripeAccountId) {
        return res.json({ 
          connected: false, 
          onboardingComplete: false,
          chargesEnabled: false,
          payoutsEnabled: false,
        });
      }

      const stripe = await getUncachableStripeClient();
      const account = await stripe.accounts.retrieve(coach.stripeAccountId);

      // Update coach record with latest status
      const onboardingComplete = account.charges_enabled && account.payouts_enabled;
      await storage.updateCoach(coachId, {
        stripeAccountStatus: account.charges_enabled ? 'active' : 'pending',
        stripeOnboardingComplete: onboardingComplete ? 'true' : 'false',
      });

      res.json({
        connected: true,
        onboardingComplete,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        accountId: coach.stripeAccountId,
      });
    } catch (error: any) {
      console.error('Stripe status error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create Stripe login link for coach dashboard
  app.post("/api/coaches/:coachId/stripe/dashboard", async (req, res) => {
    try {
      const { coachId } = req.params;
      const coach = await storage.getCoach(coachId);
      
      if (!coach || !coach.stripeAccountId) {
        return res.status(404).json({ error: "Stripe account not found" });
      }

      const stripe = await getUncachableStripeClient();
      const loginLink = await stripe.accounts.createLoginLink(coach.stripeAccountId);

      res.json({ url: loginLink.url });
    } catch (error: any) {
      console.error('Stripe dashboard error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create Stripe Checkout session for booking
  app.post("/api/bookings/checkout", async (req, res) => {
    try {
      const validatedData = bookingCheckoutRequestSchema.parse(req.body);
      const { athleteId, coachId, slotIds } = validatedData;
      
      // Verify athlete exists
      const athlete = await storage.getAthlete(athleteId);
      if (!athlete) {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
      // Get coach for rate
      const coach = await storage.getCoach(coachId);
      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }
      
      // Get slots
      const slots = await storage.getAvailabilitySlotsByIds(slotIds);
      if (slots.length === 0) {
        return res.status(400).json({ error: "No valid slots found" });
      }
      
      // Calculate pricing (in cents)
      const hourlyRate = parseFloat(coach.hourlyRate || "50");
      const hourlyRateCents = Math.round(hourlyRate * 100);
      const subtotalCents = hourlyRateCents * slots.length;
      const serviceFeeCents = Math.round(subtotalCents * SERVICE_FEE_PERCENTAGE);
      const totalAmountCents = subtotalCents + serviceFeeCents;
      
      // Create pending purchase
      const purchase = await storage.createPurchase({
        athleteId,
        coachId,
        subtotal: subtotalCents,
        serviceFee: serviceFeeCents,
        totalAmount: totalAmountCents,
        currency: "USD",
        status: "pending",
        paymentProvider: "stripe",
        selectedSlots: slots.map(slot => ({
          slotId: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      });

      // Helper function to format time for display
      const formatTimeDisplay = (time: string): string => {
        const [hours, minutes] = time.split(":");
        let h = parseInt(hours);
        const period = h >= 12 ? "PM" : "AM";
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        return `${h}:${minutes} ${period}`;
      };

      // Create line items for each session slot
      const sessionLineItems = slots.map(slot => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Session with ${coach.name}`,
            description: `${slot.date} • ${formatTimeDisplay(slot.startTime)} - ${formatTimeDisplay(slot.endTime)}`,
          },
          unit_amount: hourlyRateCents,
        },
        quantity: 1,
      }));

      // Add service fee as a separate line item
      const serviceFeeLineItem = {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Platform Service Fee',
            description: '10% service fee for booking facilitation',
          },
          unit_amount: serviceFeeCents,
        },
        quantity: 1,
      };

      // Create Stripe Checkout session
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [...sessionLineItems, serviceFeeLineItem],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/booking/success?session_id={CHECKOUT_SESSION_ID}&purchase_id=${purchase.id}`,
        cancel_url: `${req.protocol}://${req.get('host')}/coach/${coachId}?booking=cancelled`,
        metadata: {
          purchaseId: purchase.id,
          athleteId,
          coachId,
          slotIds: slotIds.join(','),
        },
        customer_email: athlete.email,
      });

      // Update purchase with session ID
      await storage.updatePurchaseSession(purchase.id, session.id);

      res.json({
        purchaseId: purchase.id,
        sessionId: session.id,
        url: session.url,
        totalAmount: totalAmountCents,
        currency: "USD",
        status: "pending",
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Verify checkout session and complete purchase
  app.get("/api/bookings/verify/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const stripe = await getUncachableStripeClient();
      
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status === 'paid') {
        const purchaseId = session.metadata?.purchaseId;
        if (purchaseId) {
          const purchase = await storage.getPurchase(purchaseId);
          if (purchase && purchase.status === 'pending') {
            await storage.updatePurchaseStatus(
              purchaseId, 
              'succeeded', 
              session.payment_intent as string
            );
            
            // Create invoice
            const invoiceNumber = await storage.generateInvoiceNumber();
            await storage.createInvoice({
              purchaseId,
              invoiceNumber,
              paidAt: new Date(),
              providerReceiptUrl: null,
              metadata: { sessionId, paymentIntent: session.payment_intent },
            });
          }
        }
        
        res.json({ 
          success: true, 
          status: 'paid',
          purchaseId: session.metadata?.purchaseId,
        });
      } else {
        res.json({ 
          success: false, 
          status: session.payment_status,
        });
      }
    } catch (error: any) {
      console.error('Verify error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get purchase status
  app.get("/api/purchases/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const purchase = await storage.getPurchase(id);
      if (!purchase) {
        return res.status(404).json({ error: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get athlete's purchases
  app.get("/api/athletes/:athleteId/purchases", async (req, res) => {
    try {
      const { athleteId } = req.params;
      const purchases = await storage.getPurchasesByAthlete(athleteId);
      res.json(purchases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel a pending purchase
  app.patch("/api/purchases/:id/cancel", async (req, res) => {
    try {
      const { id } = req.params;
      
      const purchase = await storage.getPurchase(id);
      if (!purchase) {
        return res.status(404).json({ error: "Purchase not found" });
      }
      
      if (purchase.status !== "pending") {
        return res.status(400).json({ error: "Can only cancel pending purchases" });
      }
      
      const updatedPurchase = await storage.updatePurchaseStatus(id, "cancelled");
      res.json(updatedPurchase);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
