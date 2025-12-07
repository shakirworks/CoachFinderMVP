import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAthleteSchema, insertCoachSchema, insertMessageSchema, insertAvailabilitySlotSchema, bookingQuoteRequestSchema, bookingCheckoutRequestSchema, paymentWebhookSchema } from "@shared/schema";

const SERVICE_FEE_PERCENTAGE = 0.10;

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

  // Create checkout session - creates a pending purchase
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
      
      // Calculate pricing
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
        paymentProvider: "google_pay",
        selectedSlots: slots.map(slot => ({
          slotId: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      });
      
      // In production, this would create a Google Pay session and return a token
      // For now, we return the purchase with a placeholder session ID
      res.json({
        purchaseId: purchase.id,
        sessionId: `session_${purchase.id}`,
        totalAmount: totalAmountCents,
        currency: "USD",
        status: "pending",
      });
    } catch (error: any) {
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

  // Payment webhook - confirm payment status
  // NOTE: In production, this endpoint MUST verify the payment provider's signature
  // before processing. Google Pay webhooks should include a signature that validates
  // the request originated from Google. This is critical for security.
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const validatedData = paymentWebhookSchema.parse(req.body);
      const { purchaseId, status, transactionId, receiptUrl, signature } = validatedData;
      
      // TODO: In production, verify payment provider signature here
      // if (!verifyGooglePaySignature(signature, req.body)) {
      //   return res.status(401).json({ error: "Invalid signature" });
      // }
      
      // Verify purchase exists
      const purchase = await storage.getPurchase(purchaseId);
      if (!purchase) {
        return res.status(404).json({ error: "Purchase not found" });
      }
      
      // Idempotency check - don't process if already in terminal state
      if (["succeeded", "failed", "refunded"].includes(purchase.status)) {
        return res.json({ 
          success: true, 
          message: "Purchase already processed",
          purchase 
        });
      }
      
      // Update purchase status
      const updatedPurchase = await storage.updatePurchaseStatus(purchaseId, status, transactionId);
      
      // If payment succeeded, create invoice
      if (status === "succeeded" && updatedPurchase) {
        // Check if invoice already exists (idempotency)
        const existingInvoice = await storage.getInvoiceByPurchase(purchaseId);
        if (!existingInvoice) {
          const invoiceNumber = await storage.generateInvoiceNumber();
          const invoice = await storage.createInvoice({
            purchaseId,
            invoiceNumber,
            paidAt: new Date(),
            providerReceiptUrl: receiptUrl || null,
            metadata: { transactionId },
          });
          
          return res.json({
            success: true,
            purchase: updatedPurchase,
            invoice,
          });
        } else {
          return res.json({
            success: true,
            purchase: updatedPurchase,
            invoice: existingInvoice,
          });
        }
      }
      
      res.json({ success: true, purchase: updatedPurchase });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
