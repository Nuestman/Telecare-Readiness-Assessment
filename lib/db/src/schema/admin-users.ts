import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { AdminRole } from "../constants";

export const adminUsersTable = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().$type<AdminRole>(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type AdminUser = typeof adminUsersTable.$inferSelect;
