import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { insertAthleteSchema, insertCoachSchema, insertMessageSchema, insertAvailabilitySlotSchema, bookingQuoteRequestSchema, bookingCheckoutRequestSchema } from "@shared/schema";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { sendVerificationCode, sendWelcomeVerification, sendPasswordResetEmail } from "./email";
import multer from "multer";
import path from "path";
import fs from "fs";

declare module "express-session" {
  interface SessionData {
    userId: string;
    userRole: "athlete" | "coach";
    userEmail: string;
  }
}

const SERVICE_FEE_PERCENTAGE = 0.07;
const HST_PERCENTAGE = 0.13;

// Request the transfers capability on a connected account via both V2 and V1 APIs.
// V2 accounts need the 'stripe_balance.stripe_transfers' recipient capability.
// V1 accounts need the 'transfers' capability.  We request both to cover all cases.
async function requestStripeTransfersCapability(stripe: Awaited<ReturnType<typeof getUncachableStripeClient>>, accountId: string): Promise<void> {
  const v2Headers = { additionalHeaders: { 'Stripe-Version': '2025-12-15.preview' } };

  // Try V2: recipient.capabilities.stripe_balance.stripe_transfers
  try {
    await stripe.rawRequest('POST', `/v2/core/accounts/${accountId}`, {
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
    }, v2Headers);
    console.log(`[Stripe] Requested stripe_balance.stripe_transfers via V2 for ${accountId}`);
  } catch (v2Err: any) {
    console.warn(`[Stripe] V2 stripe_balance.stripe_transfers request failed for ${accountId}: ${v2Err.message}`);
  }

  // Also try V1: capabilities.transfers (covers V1 Express accounts and older-API-version flows)
  try {
    await stripe.accounts.update(accountId, {
      capabilities: { transfers: { requested: true } },
    });
    console.log(`[Stripe] Requested transfers capability via V1 for ${accountId}`);
  } catch (v1Err: any) {
    console.warn(`[Stripe] V1 transfers capability request failed for ${accountId}: ${v1Err.message}`);
  }
}

function isTransfersCapabilityActive(account: { capabilities?: unknown }): boolean {
  const caps = account.capabilities as Record<string, string> | null | undefined;
  return caps?.transfers === 'active' || caps?.stripe_balance_stripe_transfers === 'active';
}

function isTransfersCapabilityBlocked(account: { capabilities?: unknown }): boolean {
  const caps = account.capabilities as Record<string, string> | null | undefined;
  const transfers = caps?.transfers;
  return transfers === 'inactive' || transfers === 'restricted';
}

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, WebP, GIF) are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/uploads", express.static(uploadsDir));

  app.post("/api/upload/photo", (req, res) => {
    upload.single("photo")(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File is too large. Maximum size is 5MB." });
          }
          return res.status(400).json({ error: err.message });
        }
        return res.status(400).json({ error: err.message || "Upload failed" });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const url = `/uploads/${req.file.filename}`;
      res.json({ url });
    });
  });
  app.get("/api/session", async (req, res) => {
    if (!req.session.userId || !req.session.userEmail || !req.session.userRole) {
      return res.json({ authenticated: false });
    }
    try {
      const email = req.session.userEmail;
      const role = req.session.userRole;
      let user: any = null;
      if (role === "athlete") {
        const athlete = await storage.getAthleteByEmail(email);
        if (athlete) {
          const { password: _, ...safe } = athlete;
          user = safe;
        }
      } else if (role === "coach") {
        const coach = await storage.getCoachByEmail(email);
        if (coach) {
          const { password: _, ...safe } = coach;
          user = safe;
        }
      }
      if (!user) {
        req.session.destroy(() => {});
        return res.json({ authenticated: false });
      }
      res.json({ authenticated: true, user, role: req.session.userRole });
    } catch (error: any) {
      res.json({ authenticated: false });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

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

  app.post("/api/signup/send-verification", async (req, res) => {
    try {
      const { email, password, role } = req.body;
      if (!email || !password || !role) {
        return res.status(400).json({ error: "Email, password, and role are required" });
      }
      if (!["athlete", "coach"].includes(role)) {
        return res.status(400).json({ error: "Role must be 'athlete' or 'coach'" });
      }

      const existing = await storage.checkEmailExists(email);
      if (existing.exists) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await storage.createVerificationCode({
        email,
        code: token,
        role,
        type: "signup",
        hashedPassword,
        expiresAt,
        used: "false",
      });

      const forwardedProto = req.get("x-forwarded-proto") || req.protocol;
      const forwardedHost = req.get("x-forwarded-host") || req.get("host");
      const origin = req.get("origin");
      const baseUrl = origin || `${forwardedProto}://${forwardedHost}`;
      const verificationLink = `${baseUrl}/verify-email?token=${token}`;

      try {
        await sendWelcomeVerification(email, verificationLink, role as "athlete" | "coach");
      } catch (emailError: any) {
        console.error("Failed to send welcome email:", emailError.message);
        return res.status(500).json({ error: "Failed to send verification email. Please try again." });
      }

      res.json({ success: true, message: "Verification email sent. Please check your inbox." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const record = await storage.getVerificationCodeByToken(token);

      if (!record) {
        return res.status(400).json({ error: "Invalid or already used verification link." });
      }

      if (record.type !== "signup") {
        return res.status(400).json({ error: "Invalid verification link." });
      }

      if (record.used === "true") {
        return res.status(400).json({ error: "This verification link has already been used." });
      }

      if (new Date() > record.expiresAt) {
        return res.status(400).json({ error: "This verification link has expired. Please sign up again." });
      }

      if (!["athlete", "coach"].includes(record.role)) {
        return res.status(400).json({ error: "Invalid verification link." });
      }

      res.json({
        verified: true,
        email: record.email,
        role: record.role,
        token,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create athlete
  app.post("/api/athletes", async (req, res) => {
    try {
      const { verificationToken, ...bodyData } = req.body;
      let finalPassword: string;

      if (verificationToken) {
        const record = await storage.getVerificationCodeByToken(verificationToken);
        if (!record || !record.hashedPassword) {
          return res.status(400).json({ error: "Invalid or expired verification token." });
        }
        if (record.type !== "signup" || record.role !== "athlete") {
          return res.status(400).json({ error: "Invalid verification token for this account type." });
        }
        if (record.used === "true") {
          return res.status(400).json({ error: "This verification token has already been used." });
        }
        if (new Date() > record.expiresAt) {
          return res.status(400).json({ error: "Verification token has expired. Please sign up again." });
        }
        finalPassword = record.hashedPassword;
        await storage.markVerificationCodeUsed(record.id);
        bodyData.password = "placeholder";
        bodyData.emailVerified = "true";
      } else {
        finalPassword = await bcrypt.hash(bodyData.password, 10);
      }

      const athleteData = insertAthleteSchema.parse(bodyData);
      const athlete = await storage.createAthlete({ ...athleteData, password: finalPassword });

      req.session.userId = athlete.id;
      req.session.userRole = "athlete";
      req.session.userEmail = athlete.email;

      const { password: _, ...safeAthlete } = athlete;
      res.json(safeAthlete);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all athletes
  app.get("/api/athletes", async (req, res) => {
    try {
      const athletes = await storage.getAllAthletes();
      const safeAthletes = athletes.map(({ password: _, ...a }) => a);
      res.json(safeAthletes);
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
      
      const { password: _, ...safeAthlete } = athlete;
      res.json(safeAthlete);
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
      const { verificationToken, ...bodyData } = req.body;
      let finalPassword: string;

      if (verificationToken) {
        const record = await storage.getVerificationCodeByToken(verificationToken);
        if (!record || !record.hashedPassword) {
          return res.status(400).json({ error: "Invalid or expired verification token." });
        }
        if (record.type !== "signup" || record.role !== "coach") {
          return res.status(400).json({ error: "Invalid verification token for this account type." });
        }
        if (record.used === "true") {
          return res.status(400).json({ error: "This verification token has already been used." });
        }
        if (new Date() > record.expiresAt) {
          return res.status(400).json({ error: "Verification token has expired. Please sign up again." });
        }
        finalPassword = record.hashedPassword;
        await storage.markVerificationCodeUsed(record.id);
        bodyData.password = "placeholder";
        bodyData.emailVerified = "true";
      } else {
        const existingCoach = await storage.getCoachByEmail(bodyData.email);
        if (existingCoach) {
          return res.status(409).json({ 
            error: "A coach account with this email already exists. Please use a different email or log in to your existing account." 
          });
        }
        finalPassword = await bcrypt.hash(bodyData.password, 10);
      }

      const coachData = insertCoachSchema.parse(bodyData);
      const coach = await storage.createCoach({ ...coachData, password: finalPassword });

      req.session.userId = coach.id;
      req.session.userRole = "coach";
      req.session.userEmail = coach.email;

      const { password: _, ...safeCoach } = coach;
      res.json(safeCoach);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all coaches
  app.get("/api/coaches", async (req, res) => {
    try {
      const coaches = await storage.getAllCoaches();
      const safeCoaches = coaches.map(({ password: _, ...c }) => c);
      res.json(safeCoaches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Login step 1: verify email + password, send verification code
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      const athlete = await storage.getAthleteByEmail(email);
      if (!athlete) {
        const coach = await storage.getCoachByEmail(email);
        if (coach) {
          return res.status(400).json({ error: "This email is registered as a coach account. Please sign in as a coach." });
        }
        return res.status(404).json({ error: "No athlete account found with this email." });
      }

      const passwordMatch = await bcrypt.compare(password, athlete.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const code = String(Math.floor(10000 + Math.random() * 90000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createVerificationCode({
        email,
        code,
        role: "athlete",
        expiresAt,
        used: "false",
      });

      try {
        await sendVerificationCode(email, code, "athlete");
      } catch (emailError: any) {
        console.error("Failed to send verification email:", emailError.message);
        return res.status(500).json({ error: "Failed to send verification email. Please try again." });
      }

      res.json({ success: true, message: "Verification code sent to your email" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Login step 1 for coach: verify email + password, send verification code
  app.post("/api/login/coach", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      const coach = await storage.getCoachByEmail(email);
      if (!coach) {
        const athlete = await storage.getAthleteByEmail(email);
        if (athlete) {
          return res.status(400).json({ error: "This email is registered as an athlete account. Please sign in as an athlete." });
        }
        return res.status(404).json({ error: "No coach account found with this email." });
      }

      const passwordMatch = await bcrypt.compare(password, coach.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const code = String(Math.floor(10000 + Math.random() * 90000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createVerificationCode({
        email,
        code,
        role: "coach",
        expiresAt,
        used: "false",
      });

      try {
        await sendVerificationCode(email, code, "coach");
      } catch (emailError: any) {
        console.error("Failed to send verification email:", emailError.message);
        return res.status(500).json({ error: "Failed to send verification email. Please try again." });
      }

      res.json({ success: true, message: "Verification code sent to your email" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Login step 2: verify the 5-digit code for athlete
  app.post("/api/login/verify", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: "Email and verification code are required" });
      }

      const verificationCode = await storage.getVerificationCode(email, code, "athlete");
      if (!verificationCode) {
        return res.status(401).json({ error: "Invalid or expired verification code" });
      }

      if (new Date() > verificationCode.expiresAt) {
        return res.status(401).json({ error: "Verification code has expired" });
      }

      await storage.markVerificationCodeUsed(verificationCode.id);

      const athlete = await storage.getAthleteByEmail(email);
      if (!athlete) {
        return res.status(404).json({ error: "User not found" });
      }

      req.session.userId = athlete.id;
      req.session.userRole = "athlete";
      req.session.userEmail = email;

      const { password: _, ...safeAthlete } = athlete;
      res.json(safeAthlete);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/login/coach/verify", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: "Email and verification code are required" });
      }

      const verificationCode = await storage.getVerificationCode(email, code, "coach");
      if (!verificationCode) {
        return res.status(401).json({ error: "Invalid or expired verification code" });
      }

      if (new Date() > verificationCode.expiresAt) {
        return res.status(401).json({ error: "Verification code has expired" });
      }

      await storage.markVerificationCodeUsed(verificationCode.id);

      const coach = await storage.getCoachByEmail(email);
      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }

      req.session.userId = coach.id;
      req.session.userRole = "coach";
      req.session.userEmail = email;

      const { password: _, ...safeCoach } = coach;
      res.json(safeCoach);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Forgot password: send reset link to email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email, role } = req.body;
      if (!email || !role || !["athlete", "coach"].includes(role)) {
        return res.status(400).json({ error: "Email and role are required" });
      }

      // Look up the user — always return 200 to not reveal if email exists
      const user = role === "athlete"
        ? await storage.getAthleteByEmail(email)
        : await storage.getCoachByEmail(email);

      if (user) {
        const token = randomUUID();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await storage.createVerificationCode({
          email: user.email,
          code: token,
          role,
          type: "password_reset",
          expiresAt,
        });

        const forwardedProto = req.get("x-forwarded-proto") || req.protocol;
        const forwardedHost = req.get("x-forwarded-host") || req.get("host");
        const origin = req.get("origin");
        const baseUrl = origin || `${forwardedProto}://${forwardedHost}`;
        const resetLink = `${baseUrl}/reset-password?token=${token}&role=${role}`;

        await sendPasswordResetEmail(user.email, resetLink, role);
        console.log(`[Auth] Password reset email sent to ${user.email} (${role})`);
      }

      // Always respond the same way so attackers can't enumerate emails
      res.json({ message: "If an account with that email exists, a reset link has been sent." });
    } catch (error: any) {
      console.error("Forgot password error:", error.message);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Reset password: validate token and set new password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "Token and a password of at least 6 characters are required" });
      }

      const record = await storage.getVerificationCodeByToken(token);
      if (!record || record.type !== "password_reset" || record.used === "true") {
        return res.status(400).json({ error: "This reset link is invalid or has already been used." });
      }

      if (new Date() > record.expiresAt) {
        return res.status(400).json({ error: "This reset link has expired. Please request a new one." });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      const role = record.role as "athlete" | "coach";

      if (role === "athlete") {
        const athlete = await storage.getAthleteByEmail(record.email);
        if (!athlete) return res.status(404).json({ error: "Account not found" });
        await storage.updateAthlete(athlete.id, { password: hashed });
      } else {
        const coach = await storage.getCoachByEmail(record.email);
        if (!coach) return res.status(404).json({ error: "Account not found" });
        await storage.updateCoach(coach.id, { password: hashed });
      }

      await storage.markVerificationCodeUsed(record.id);
      console.log(`[Auth] Password reset successful for ${record.email} (${role})`);

      res.json({ message: "Password updated successfully. You can now sign in with your new password." });
    } catch (error: any) {
      console.error("Reset password error:", error.message);
      res.status(500).json({ error: "Failed to reset password" });
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
      const { password: _, ...safeCoach } = coach;
      res.json(safeCoach);
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

      if (messageData.senderType === "athlete") {
        const athlete = await storage.getAthlete(messageData.athleteId);
        if (athlete) {
          await storage.createNotification({
            recipientId: messageData.coachId,
            recipientType: "coach",
            type: "new_message",
            title: "New Message",
            message: `${athlete.name} sent you a message: "${messageData.message.substring(0, 80)}${messageData.message.length > 80 ? '...' : ''}"`,
            data: {
              athleteId: messageData.athleteId,
              athleteName: athlete.name,
              coachId: messageData.coachId,
            },
            read: "false",
          });
        }
      } else if (messageData.senderType === "coach") {
        const coach = await storage.getCoach(messageData.coachId);
        if (coach) {
          await storage.createNotification({
            recipientId: messageData.athleteId,
            recipientType: "athlete",
            type: "new_message",
            title: "New Message",
            message: `Coach ${coach.name} sent you a message: "${messageData.message.substring(0, 80)}${messageData.message.length > 80 ? '...' : ''}"`,
            data: {
              athleteId: messageData.athleteId,
              coachId: messageData.coachId,
              coachName: coach.name,
            },
            read: "false",
          });
        }
      }

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

  // Get all message threads for a coach
  app.get("/api/coaches/:coachId/messages", async (req, res) => {
    try {
      const { coachId } = req.params;
      const threads = await storage.getCoachMessageThreads(coachId);
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
      
      const hourlyRate = parseFloat(coach.hourlyRate || "50");
      const hourlyRateCents = Math.round(hourlyRate * 100);
      const subtotalCents = hourlyRateCents * slots.length;
      const serviceFeeCents = Math.round(subtotalCents * SERVICE_FEE_PERCENTAGE);
      const taxableAmount = subtotalCents + serviceFeeCents;
      const taxAmountCents = Math.round(taxableAmount * HST_PERCENTAGE);
      const totalAmountCents = subtotalCents + serviceFeeCents + taxAmountCents;
      
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
        taxAmount: taxAmountCents,
        taxPercentage: HST_PERCENTAGE,
        totalAmount: totalAmountCents,
        currency: "CAD",
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

  // Create Stripe Connect account for coach (V2 first, V1 fallback)
  app.post("/api/coaches/:coachId/stripe/connect", async (req, res) => {
    try {
      const { coachId } = req.params;
      const coach = await storage.getCoach(coachId);
      
      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }

      const stripe = await getUncachableStripeClient();
      
      const forwardedProto = req.get("x-forwarded-proto") || req.protocol;
      const forwardedHost = req.get("x-forwarded-host") || req.get("host");
      const origin = req.get("origin");
      const baseUrl = origin || `${forwardedProto}://${forwardedHost}`;

      let accountId = coach.stripeAccountId;
      let isV2Account = false;

      if (!accountId) {
        // Try V2 API first, fall back to V1 if V2 isn't enabled
        try {
          const v2Headers = {
            additionalHeaders: {
              'Stripe-Version': '2025-12-15.preview',
            },
          };

          const account = await stripe.rawRequest('POST', '/v2/core/accounts', {
            display_name: coach.name,
            contact_email: coach.email,
            identity: {
              country: 'ca',
            },
            dashboard: 'full',
            defaults: {
              responsibilities: {
                fees_collector: 'stripe',
                losses_collector: 'stripe',
              },
            },
            configuration: {
              customer: {},
              merchant: {
                capabilities: {
                  card_payments: {
                    requested: true,
                  },
                },
              },
              recipient: {
                capabilities: {
                  stripe_balance: {
                    stripe_transfers: { requested: true },
                  },
                },
              },
            },
            metadata: {
              coachId: coach.id,
              coachName: coach.name,
            },
          }, v2Headers);

          const accountData = account as any;
          accountId = accountData.id;
          isV2Account = true;
          console.log(`Created V2 Connect account ${accountId} for coach ${coachId}`);
        } catch (v2Error: any) {
          console.log(`V2 account creation not available (${v2Error.message}), falling back to V1`);
          
          const account = await stripe.accounts.create({
            type: 'express',
            country: 'CA',
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

          accountId = account.id;
          isV2Account = false;
          console.log(`Created V1 Connect account ${accountId} for coach ${coachId}`);
        }

        await storage.updateCoach(coachId, {
          stripeAccountId: accountId,
          stripeAccountStatus: 'pending',
          stripeOnboardingComplete: 'false',
        });
      }

      // Create account link - try V2 first, fall back to V1
      let onboardingUrl: string;

      try {
        const v2LinkHeaders = {
          additionalHeaders: {
            'Stripe-Version': '2025-12-15.preview',
          },
        };

        const accountLinkResponse = await stripe.rawRequest('POST', '/v2/core/account_links', {
          account: accountId,
          use_case: {
            type: 'account_onboarding',
            account_onboarding: {
              configurations: ['merchant', 'customer'],
              refresh_url: `${baseUrl}/coach-profile?stripe=refresh`,
              return_url: `${baseUrl}/coach-profile?stripe=success&accountId=${accountId}`,
            },
          },
        }, v2LinkHeaders);

        const linkData = accountLinkResponse as any;
        onboardingUrl = linkData.url;
      } catch (v2LinkError: any) {
        console.log(`V2 account link not available, using V1 account links`);
        const accountLink = await stripe.accountLinks.create({
          account: accountId!,
          refresh_url: `${baseUrl}/coach-profile?stripe=refresh`,
          return_url: `${baseUrl}/coach-profile?stripe=success`,
          type: 'account_onboarding',
        });
        onboardingUrl = accountLink.url;
      }

      res.json({ url: onboardingUrl, accountId });
    } catch (error: any) {
      console.error('Stripe Connect error:', error);
      if (error.type === 'StripeInvalidRequestError' && error.message?.includes('signed up for Connect')) {
        return res.status(503).json({ 
          error: "Stripe Connect is not yet enabled on the platform account. The platform administrator needs to activate Stripe Connect at https://dashboard.stripe.com/connect/overview before coaches can connect their accounts." 
        });
      }
      res.status(500).json({ error: error.message || "Failed to connect with Stripe" });
    }
  });

  // Get coach's Stripe account status using V2 API
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
      const stripeAccountId = coach.stripeAccountId!;

      // Use V1 API to get full account details including capabilities
      const account = await stripe.accounts.retrieve(stripeAccountId);
      const chargesEnabled = !!account.charges_enabled;
      const payoutsEnabled = !!account.payouts_enabled;
      const onboardingComplete = chargesEnabled && payoutsEnabled;
      const transfersCap = (account.capabilities as any)?.transfers;
      const cardPaymentsCap = (account.capabilities as any)?.card_payments;

      // Auto-request transfers capability if not yet active (required for destination charges)
      if (!isTransfersCapabilityActive(account)) {
        await requestStripeTransfersCapability(stripe, stripeAccountId);
      }

      await storage.updateCoach(coachId, {
        stripeAccountStatus: chargesEnabled ? 'active' : 'pending',
        stripeOnboardingComplete: onboardingComplete ? 'true' : 'false',
      });

      res.json({
        connected: true,
        onboardingComplete,
        chargesEnabled,
        payoutsEnabled,
        accountId: stripeAccountId,
        transfersActive: isTransfersCapabilityActive(account),
        capabilities: {
          transfers: transfersCap || 'unrequested',
          card_payments: cardPaymentsCap || 'unrequested',
        },
      });
    } catch (error: any) {
      console.error('Stripe status error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create Account Session for embedded onboarding components
  app.post("/api/coaches/:coachId/stripe/account-session", async (req, res) => {
    try {
      const { coachId } = req.params;
      const coach = await storage.getCoach(coachId);

      if (!coach) {
        return res.status(404).json({ error: "Coach not found" });
      }

      if (!coach.stripeAccountId) {
        return res.status(400).json({ error: "No Stripe account exists yet. Please initiate Connect first." });
      }

      const stripe = await getUncachableStripeClient();

      const accountSession = await stripe.accountSessions.create({
        account: coach.stripeAccountId,
        components: {
          account_onboarding: {
            enabled: true,
          },
        },
      });

      res.json({ clientSecret: accountSession.client_secret });
    } catch (error: any) {
      console.error('Account session error:', error);
      res.status(500).json({ error: error.message || "Failed to create account session" });
    }
  });

  // Create Stripe dashboard link for coach
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

  // Admin: Enable transfers capability for all coaches with connected Stripe accounts
  app.post("/api/admin/stripe/enable-transfers", async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const allCoaches = await storage.getAllCoaches();
      const connectedCoaches = allCoaches.filter(c => c.stripeAccountId);

      if (connectedCoaches.length === 0) {
        return res.json({ message: "No coaches with connected Stripe accounts found.", results: [] });
      }

      const results: Array<{ coachId: string; coachName: string; stripeAccountId: string; status: string; transfers?: string }> = [];

      for (const coach of connectedCoaches) {
        try {
          const account = await stripe.accounts.retrieve(coach.stripeAccountId!);
          const alreadyActive = isTransfersCapabilityActive(account);

          if (!alreadyActive) {
            await requestStripeTransfersCapability(stripe, coach.stripeAccountId!);
            results.push({ coachId: coach.id, coachName: coach.name, stripeAccountId: coach.stripeAccountId!, status: 'requested', transfers: 'requested via V2+V1' });
          } else {
            results.push({ coachId: coach.id, coachName: coach.name, stripeAccountId: coach.stripeAccountId!, status: 'already_active', transfers: 'active' });
          }

          // Sync the latest status back to DB
          await storage.updateCoach(coach.id, {
            stripeAccountStatus: account.charges_enabled ? 'active' : 'pending',
            stripeOnboardingComplete: (account.charges_enabled && account.payouts_enabled) ? 'true' : 'false',
          });
        } catch (err: any) {
          results.push({ coachId: coach.id, coachName: coach.name, stripeAccountId: coach.stripeAccountId!, status: 'error', transfers: err.message });
        }
      }

      const requested = results.filter(r => r.status === 'requested').length;
      const alreadyActive = results.filter(r => r.status === 'already_active').length;
      const errors = results.filter(r => r.status === 'error').length;

      res.json({ 
        message: `Processed ${connectedCoaches.length} connected accounts. Requested: ${requested}, Already active: ${alreadyActive}, Errors: ${errors}`,
        results 
      });
    } catch (error: any) {
      console.error('Enable transfers error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Enable transfers capability for a specific coach (V2 + V1 APIs)
  app.post("/api/coaches/:coachId/stripe/enable-transfers", async (req, res) => {
    try {
      const { coachId } = req.params;
      const coach = await storage.getCoach(coachId);

      if (!coach || !coach.stripeAccountId) {
        return res.status(404).json({ error: "Coach or Stripe account not found" });
      }

      const stripe = await getUncachableStripeClient();
      const accountBefore = await stripe.accounts.retrieve(coach.stripeAccountId);

      if (isTransfersCapabilityActive(accountBefore)) {
        return res.json({ message: 'Transfers capability already active', transfers: 'active' });
      }

      await requestStripeTransfersCapability(stripe, coach.stripeAccountId);

      // Re-check after requesting
      const accountAfter = await stripe.accounts.retrieve(coach.stripeAccountId);
      const transfersStatus = (accountAfter.capabilities as any)?.transfers || 'unrequested';

      console.log(`[Stripe] enable-transfers for coach ${coachId}: ${transfersStatus}`);
      res.json({ 
        message: `Transfers capability requested via V2 and V1 APIs`, 
        transfers: transfersStatus,
        active: isTransfersCapabilityActive(accountAfter),
      });
    } catch (error: any) {
      console.error('Enable transfers error:', error);
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
      
      const hourlyRate = parseFloat(coach.hourlyRate || "50");
      const hourlyRateCents = Math.round(hourlyRate * 100);
      const subtotalCents = hourlyRateCents * slots.length;
      const serviceFeeCents = Math.round(subtotalCents * SERVICE_FEE_PERCENTAGE);
      const taxableAmount = subtotalCents + serviceFeeCents;
      const taxAmountCents = Math.round(taxableAmount * HST_PERCENTAGE);
      const totalAmountCents = subtotalCents + serviceFeeCents + taxAmountCents;

      if (!coach.stripeAccountId) {
        return res.status(400).json({ error: "This coach has not connected their Stripe account yet. Payments cannot be processed." });
      }

      // Verify the coach's Stripe account is ready to accept payments
      const stripeForCheck = await getUncachableStripeClient();
      try {
        let connectedAccount = await stripeForCheck.accounts.retrieve(coach.stripeAccountId);

        if (!connectedAccount.charges_enabled) {
          return res.status(400).json({ 
            error: "This coach has not fully completed their Stripe account setup. They need to finish onboarding before payments can be processed." 
          });
        }
        if (!connectedAccount.payouts_enabled) {
          return res.status(400).json({ 
            error: "This coach's Stripe account is not yet approved for payouts. Please try again shortly or contact the coach." 
          });
        }

        // Ensure the transfers capability is requested via both V2 and V1 APIs.
        // This is required for destination charges (stripe_balance.stripe_transfers feature).
        if (!isTransfersCapabilityActive(connectedAccount)) {
          if (isTransfersCapabilityBlocked(connectedAccount)) {
            return res.status(400).json({ 
              error: "This coach's transfers capability is restricted. They need to complete additional Stripe account verification before payments can be processed." 
            });
          }
          // Request via V2 + V1, then re-check immediately
          await requestStripeTransfersCapability(stripeForCheck, coach.stripeAccountId);
          connectedAccount = await stripeForCheck.accounts.retrieve(coach.stripeAccountId);
          console.log(`[Stripe] Transfers after request for ${coach.stripeAccountId}: ${(connectedAccount.capabilities as any)?.transfers}`);
        }
      } catch (accountCheckError: any) {
        console.error('Failed to verify coach Stripe account:', accountCheckError.message);
        return res.status(400).json({ 
          error: "Unable to verify coach's payment account. Please try again." 
        });
      }
      
      const purchase = await storage.createPurchase({
        athleteId,
        coachId,
        subtotal: subtotalCents,
        serviceFee: serviceFeeCents,
        taxAmount: taxAmountCents,
        totalAmount: totalAmountCents,
        currency: "CAD",
        status: "pending",
        paymentProvider: "stripe",
        selectedSlots: slots.map(slot => ({
          slotId: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      });

      const formatTimeDisplay = (time: string): string => {
        const [hours, minutes] = time.split(":");
        let h = parseInt(hours);
        const period = h >= 12 ? "PM" : "AM";
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        return `${h}:${minutes} ${period}`;
      };

      const sessionLineItems = slots.map(slot => ({
        price_data: {
          currency: 'cad',
          product_data: {
            name: `Coaching Session with ${coach.name}`,
            description: `${slot.date} | ${formatTimeDisplay(slot.startTime)} - ${formatTimeDisplay(slot.endTime)}`,
          },
          unit_amount: hourlyRateCents,
        },
        quantity: 1,
      }));

      const serviceFeeLineItem = {
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'CoachFinders Service Fee (7%)',
            description: 'Platform service fee for booking facilitation',
          },
          unit_amount: serviceFeeCents,
        },
        quantity: 1,
      };

      const taxLineItem = {
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'HST (Ontario 13%)',
            description: 'Harmonized Sales Tax - Ontario',
          },
          unit_amount: taxAmountCents,
        },
        quantity: 1,
      };

      const applicationFeeAmount = serviceFeeCents + taxAmountCents;

      const forwardedProto = req.get("x-forwarded-proto") || req.protocol;
      const forwardedHost = req.get("x-forwarded-host") || req.get("host");
      const origin = req.get("origin");
      const baseUrl = origin || `${forwardedProto}://${forwardedHost}`;

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [...sessionLineItems, serviceFeeLineItem, taxLineItem],
        mode: 'payment',
        success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&purchase_id=${purchase.id}`,
        cancel_url: `${baseUrl}/coach/${coachId}?booking=cancelled`,
        metadata: {
          purchaseId: purchase.id,
          athleteId,
          coachId,
          slotIds: slotIds.join(','),
        },
        customer_email: athlete.email,
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: coach.stripeAccountId,
          },
        },
      });

      // Update purchase with session ID
      await storage.updatePurchaseSession(purchase.id, session.id);

      res.json({
        purchaseId: purchase.id,
        sessionId: session.id,
        url: session.url,
        totalAmount: totalAmountCents,
        currency: "CAD",
        status: "pending",
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      if (error?.code === 'insufficient_capabilities_for_transfer' || error?.message?.includes('stripe_balance.stripe_transfers')) {
        return res.status(400).json({ 
          error: "This coach's payment account is still completing its setup for receiving transfers. Please try again in a few minutes, or ask the coach to visit their Stripe dashboard to confirm their account is fully verified." 
        });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Verify checkout session and complete purchase
  app.get("/api/bookings/verify/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const stripe = await getUncachableStripeClient();
      
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      const purchaseId = session.metadata?.purchaseId;
      
      if (session.payment_status === 'paid') {
        if (purchaseId) {
          const purchase = await storage.getPurchase(purchaseId);
          
          // Get invoice for this purchase
          const invoice = await storage.getInvoiceByPurchase(purchaseId);
          
          res.json({ 
            success: true, 
            status: 'paid',
            purchaseId,
            invoiceId: invoice?.id,
            invoiceNumber: invoice?.invoiceNumber,
          });
        } else {
          res.json({ 
            success: true, 
            status: 'paid',
          });
        }
      } else {
        res.json({ 
          success: false, 
          status: session.payment_status,
          purchaseId,
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

  // Get coach's invoices (bookings they received)
  app.get("/api/coaches/:coachId/invoices", async (req, res) => {
    try {
      const { coachId } = req.params;
      const invoices = await storage.getInvoicesByCoach(coachId);
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get athlete's invoices (bookings they made)
  app.get("/api/athletes/:athleteId/invoices", async (req, res) => {
    try {
      const { athleteId } = req.params;
      const invoices = await storage.getInvoicesByAthlete(athleteId);
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get invoice by ID
  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download receipt as HTML (can be printed to PDF)
  app.get("/api/invoices/:id/receipt", async (req, res) => {
    try {
      const { id } = req.params;
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      const sessionDetails = invoice.sessionDetails as Array<{
        slotId: string;
        date: string;
        startTime: string;
        endTime: string;
      }>;
      
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(":");
        let h = parseInt(hours);
        const period = h >= 12 ? "PM" : "AM";
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        return `${h}:${minutes} ${period}`;
      };
      
      const sessionsHtml = sessionDetails.map(session => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${session.date}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${formatTime(session.startTime)} - ${formatTime(session.endTime)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${(invoice.subtotal / sessionDetails.length / 100).toFixed(2)}</td>
        </tr>
      `).join('');
      
      const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #8B2635; }
    .logo { font-size: 24px; font-weight: bold; color: #8B2635; }
    .invoice-info { text-align: right; }
    .invoice-number { font-size: 18px; font-weight: bold; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .party { flex: 1; }
    .party-label { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f8f8f8; padding: 12px; text-align: left; font-weight: 600; }
    th:last-child { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row.final { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 12px; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px; }
    .paid-badge { display: inline-block; background: #22c55e; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 600; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">CoachFinders</div>
      <div style="color: #666; margin-top: 4px;">Athletic Coaching Platform</div>
    </div>
    <div class="invoice-info">
      <div class="invoice-number">${invoice.invoiceNumber}</div>
      <div style="color: #666; margin-top: 4px;">Issued: ${new Date(invoice.issuedAt).toLocaleDateString()}</div>
      <div style="margin-top: 8px;"><span class="paid-badge">PAID</span></div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Billed To</div>
      <div style="font-weight: 600;">${invoice.athleteName}</div>
      <div style="color: #666;">${invoice.athleteEmail}</div>
    </div>
    <div class="party">
      <div class="party-label">Coach</div>
      <div style="font-weight: 600;">${invoice.coachName}</div>
      <div style="color: #666;">${invoice.coachEmail}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${sessionsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Coaching Sessions</span>
      <span>CA$${(invoice.subtotal / 100).toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span>Service Fee (7%)</span>
      <span>CA$${(invoice.serviceFee / 100).toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span>HST (13%)</span>
      <span>CA$${((invoice.taxAmount || 0) / 100).toFixed(2)}</span>
    </div>
    <div class="total-row final">
      <span>Total Paid</span>
      <span>CA$${(invoice.totalAmount / 100).toFixed(2)} ${invoice.currency}</span>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for booking with CoachFinders!</p>
    <p>Payment processed on ${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : 'N/A'}</p>
  </div>
</body>
</html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="receipt-${invoice.invoiceNumber}.html"`);
      res.send(receiptHtml);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get coach's notifications
  app.get("/api/coaches/:coachId/notifications", async (req, res) => {
    try {
      const { coachId } = req.params;
      const notifications = await storage.getNotificationsByRecipient(coachId, 'coach');
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get notifications for athlete
  app.get("/api/athletes/:athleteId/notifications", async (req, res) => {
    try {
      const { athleteId } = req.params;
      const notifications = await storage.getNotificationsByRecipient(athleteId, 'athlete');
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get unread notification count for coach
  app.get("/api/coaches/:coachId/notifications/unread-count", async (req, res) => {
    try {
      const { coachId } = req.params;
      const count = await storage.getUnreadNotificationCount(coachId, 'coach');
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationRead(id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
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
