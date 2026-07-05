import { index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { ProspectusApprovalDecision, ProspectusApprovalRole } from "../constants";
import { prospectusSubmissionsTable } from "./prospectus-submissions";
import { systemAdminsTable } from "./system-admins";

/** Dual approval: research_leadership + platform_ops must both approve. */
export const prospectusApprovalsTable = pgTable(
  "prospectus_approvals",
  {
    id: serial("id").primaryKey(),
    prospectus_id: integer("prospectus_id")
      .notNull()
      .references(() => prospectusSubmissionsTable.id, { onDelete: "cascade" }),
    approval_role: text("approval_role").notNull().$type<ProspectusApprovalRole>(),
    system_admin_id: integer("system_admin_id")
      .notNull()
      .references(() => systemAdminsTable.id, { onDelete: "restrict" }),
    decision: text("decision").notNull().$type<ProspectusApprovalDecision>(),
    comments: text("comments").notNull().default(""),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("prospectus_approvals_prospectus_role_uidx").on(
      table.prospectus_id,
      table.approval_role,
    ),
    index("prospectus_approvals_prospectus_id_idx").on(table.prospectus_id),
  ],
);

export type ProspectusApproval = typeof prospectusApprovalsTable.$inferSelect;
export type InsertProspectusApproval = typeof prospectusApprovalsTable.$inferInsert;
