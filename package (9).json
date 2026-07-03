import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default("owner"), // owner | admin | dispatcher | technician (per-business role)
  businessId: integer("business_id"), // set for team members who accepted an invite; owners are resolved via businesses.ownerId instead
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false), // cross-tenant BurnCall operator access — see PLATFORM_ADMIN_EMAILS
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
