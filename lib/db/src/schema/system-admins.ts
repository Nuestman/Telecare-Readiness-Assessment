import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const systemAdminsTable = pgTable("system_admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  name: text("name").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  last_login_at: timestamp("last_login_at", { withTimezone: true }),
});

export type SystemAdmin = typeof systemAdminsTable.$inferSelect;
