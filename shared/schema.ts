import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const athletes = pgTable("athletes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sport: text("sport").notNull(),
  location: text("location").notNull(),
  email: text("email").notNull().unique(),
  profileImage: text("profile_image"),
  availableForCoachRequests: text("available_for_coach_requests").default("false"),
  gender: text("gender"),
  age: text("age"),
  skillLevel: text("skill_level"),
  preferredCoachGender: text("preferred_coach_gender"),
});

export const coaches = pgTable("coaches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sport: text("sport").notNull(),
  location: text("location").notNull(),
  email: text("email").notNull().unique(),
  profileImage: text("profile_image"),
  certification: text("certification"),
  performanceLevel: text("performance_level"),
  age: text("age"),
  gender: text("gender"),
  bio: text("bio"),
  hourlyRate: text("hourly_rate"),
  coachingOptions: text("coaching_options").array(),
  yearsOfExperience: text("years_of_experience"),
  studentLevels: text("student_levels").array(),
  stripeAccountId: text("stripe_account_id"),
  stripeAccountStatus: text("stripe_account_status"),
  stripeOnboardingComplete: text("stripe_onboarding_complete"),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull().references(() => athletes.id),
  coachId: varchar("coach_id").notNull().references(() => coaches.id),
  message: text("message").notNull(),
  senderType: text("sender_type").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const availabilitySlots = pgTable("availability_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coachId: varchar("coach_id").notNull().references(() => coaches.id),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertAthleteSchema = createInsertSchema(athletes).omit({
  id: true,
});

export const insertCoachSchema = createInsertSchema(coaches).omit({
  id: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
}).extend({
  senderType: z.enum(["athlete", "coach"]),
});

export const insertAvailabilitySlotSchema = createInsertSchema(availabilitySlots).omit({
  id: true,
  createdAt: true,
});

export type InsertAthlete = z.infer<typeof insertAthleteSchema>;
export type Athlete = typeof athletes.$inferSelect;
export type InsertCoach = z.infer<typeof insertCoachSchema>;
export type Coach = typeof coaches.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;

export const purchaseStatusEnum = z.enum(["pending", "authorized", "succeeded", "failed", "refunded", "cancelled"]);
export type PurchaseStatus = z.infer<typeof purchaseStatusEnum>;

export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull().references(() => athletes.id),
  coachId: varchar("coach_id").notNull().references(() => coaches.id),
  subtotal: integer("subtotal").notNull(),
  serviceFee: integer("service_fee").notNull(),
  totalAmount: integer("total_amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"),
  paymentProvider: text("payment_provider"),
  providerSessionId: text("provider_session_id"),
  providerTransactionId: text("provider_transaction_id"),
  selectedSlots: jsonb("selected_slots").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull().references(() => purchases.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  athleteId: varchar("athlete_id").notNull().references(() => athletes.id),
  coachId: varchar("coach_id").notNull().references(() => coaches.id),
  athleteName: text("athlete_name").notNull(),
  athleteEmail: text("athlete_email").notNull(),
  coachName: text("coach_name").notNull(),
  coachEmail: text("coach_email").notNull(),
  subtotal: integer("subtotal").notNull(),
  serviceFee: integer("service_fee").notNull(),
  totalAmount: integer("total_amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  sessionDetails: jsonb("session_details").notNull(),
  issuedAt: timestamp("issued_at").notNull().default(sql`now()`),
  paidAt: timestamp("paid_at"),
  providerReceiptUrl: text("provider_receipt_url"),
  metadata: jsonb("metadata"),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientId: varchar("recipient_id").notNull(),
  recipientType: text("recipient_type").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  read: text("read").notNull().default("false"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: purchaseStatusEnum.optional(),
  selectedSlots: z.array(z.object({
    slotId: z.string(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  issuedAt: true,
}).extend({
  sessionDetails: z.array(z.object({
    slotId: z.string(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const bookingQuoteRequestSchema = z.object({
  coachId: z.string().min(1, "Coach ID is required"),
  slotIds: z.array(z.string()).min(1, "At least one slot must be selected"),
});

export type BookingQuoteRequest = z.infer<typeof bookingQuoteRequestSchema>;

export const bookingCheckoutRequestSchema = z.object({
  athleteId: z.string().min(1, "Athlete ID is required"),
  coachId: z.string().min(1, "Coach ID is required"),
  slotIds: z.array(z.string()).min(1, "At least one slot must be selected"),
});

export type BookingCheckoutRequest = z.infer<typeof bookingCheckoutRequestSchema>;

export const paymentWebhookSchema = z.object({
  purchaseId: z.string().min(1, "Purchase ID is required"),
  status: purchaseStatusEnum,
  transactionId: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  signature: z.string().optional(),
});

export type PaymentWebhookRequest = z.infer<typeof paymentWebhookSchema>;
