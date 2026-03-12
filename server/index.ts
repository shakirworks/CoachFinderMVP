import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { WebhookHandlers } from "./webhookHandlers";
import { db } from "./db";
import { coaches, availabilitySlots, purchases, invoices, notifications, messages } from "@shared/schema";
import { inArray, like } from "drizzle-orm";

const app = express();

async function removeDummyCoaches() {
  try {
    const dummyCoaches = await db
      .select({ id: coaches.id })
      .from(coaches)
      .where(like(coaches.email, "%@email.com"));

    if (dummyCoaches.length === 0) return;

    const ids = dummyCoaches.map((c) => c.id);
    console.log(`Removing ${ids.length} dummy coach(es) from database...`);

    await db.delete(notifications).where(inArray(notifications.recipientId, ids));
    await db.delete(messages).where(inArray(messages.coachId, ids));
    await db.delete(availabilitySlots).where(inArray(availabilitySlots.coachId, ids));

    const affectedPurchases = await db
      .select({ id: purchases.id })
      .from(purchases)
      .where(inArray(purchases.coachId, ids));
    if (affectedPurchases.length > 0) {
      const purchaseIds = affectedPurchases.map((p) => p.id);
      await db.delete(invoices).where(inArray(invoices.purchaseId, purchaseIds));
      await db.delete(purchases).where(inArray(purchases.id, purchaseIds));
    }

    await db.delete(coaches).where(inArray(coaches.id, ids));
    console.log(`Removed ${ids.length} dummy coach(es) successfully.`);
  } catch (err: any) {
    console.error("removeDummyCoaches error:", err.message);
  }
}

removeDummyCoaches().catch(console.error);

async function initStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  if (!secretKey || !publishableKey) {
    console.warn('Stripe keys not configured - Stripe features will be unavailable');
    return;
  }

  try {
    const stripe = new (await import('stripe')).default(secretKey);
    const account = await stripe.accounts.retrieve();
    console.log(`Stripe connected successfully (account: ${account.id})`);
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      const webhookUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/stripe/webhook`;
      console.warn(`STRIPE_WEBHOOK_SECRET not set. Create a webhook in Stripe Dashboard pointing to: ${webhookUrl}`);
      console.warn('Events needed: checkout.session.*, account.updated, v2.core.account.*');
    }
  } catch (error: any) {
    console.error('Stripe connection check failed:', error.message);
    console.warn('Stripe features may not work correctly. Check your API keys.');
  }
}

initStripe().catch(console.error);

// V1 webhook endpoint for checkout and legacy account events
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer.');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig);

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

// V2 thin events webhook endpoint for Connect account updates
app.post(
  '/api/stripe/webhook/v2',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('V2 WEBHOOK ERROR: req.body is not a Buffer.');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      await WebhookHandlers.processV2ThinEvent(req.body as Buffer, sig);

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('V2 Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

const PgSession = connectPgSimple(session);
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  app.set("trust proxy", 1);
}
app.use(
  session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "coachfinders-dev-fallback-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 60 * 1000,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    },
    rolling: true,
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
