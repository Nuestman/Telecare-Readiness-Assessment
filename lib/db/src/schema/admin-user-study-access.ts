import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdminRole } from "../constants";
import { adminUsersTable } from "./admin-users";
import { studiesTable } from "./studies";
import { systemAdminsTable } from "./system-admins";

export const adminUserStudyAccessTable = pgTable(
  "admin_user_study_access",
  {
    id: serial("id").primaryKey(),
    admin_user_id: integer("admin_user_id")
      .notNull()
      .references(() => adminUsersTable.id, { onDelete: "cascade" }),
    study_slug: text("study_slug")
      .notNull()
      .references(() => studiesTable.slug, { onDelete: "cascade" }),
    role: text("role").notNull().$type<AdminRole>(),
    granted_at: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    granted_by_system_admin_id: integer("granted_by_system_admin_id").references(
      () => systemAdminsTable.id,
      { onDelete: "set null" },
    ),
  },
  (table) => [
    uniqueIndex("admin_user_study_access_user_study_uidx").on(
      table.admin_user_id,
      table.study_slug,
    ),
    index("admin_user_study_access_study_slug_idx").on(table.study_slug),
  ],
);

export type AdminUserStudyAccess = typeof adminUserStudyAccessTable.$inferSelect;
