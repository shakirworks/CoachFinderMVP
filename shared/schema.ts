import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const athletes = pgTable("athletes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sport: text("sport").notNull(),
  location: text("location").notNull(),
  email: text("email").notNull().unique(),
  profileImage: text("profile_image"),
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
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull().references(() => athletes.id),
  coachId: varchar("coach_id").notNull().references(() => coaches.id),
  message: text("message").notNull(),
  senderType: text("sender_type").notNull(),
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

export type InsertAthlete = z.infer<typeof insertAthleteSchema>;
export type Athlete = typeof athletes.$inferSelect;
export type InsertCoach = z.infer<typeof insertCoachSchema>;
export type Coach = typeof coaches.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
