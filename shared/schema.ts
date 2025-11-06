import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  name: text("name"),
  profileImage: text("profile_image"),
  location: text("location"),
  sports: text("sports").array(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const updateProfileSchema = createInsertSchema(users).pick({
  name: true,
  profileImage: true,
  location: true,
  sports: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  sports: z.array(z.string()).min(1, "Select at least one sport"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
