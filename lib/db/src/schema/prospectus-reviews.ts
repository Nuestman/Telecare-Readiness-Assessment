import { boolean, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { ProspectusReviewDecision } from "../constants";
import { prospectusSubmissionsTable } from "./prospectus-submissions";
import { systemAdminsTable } from "./system-admins";

export const prospectusReviewsTable = pgTable(
  "prospectus_reviews",
  {
    id: serial("id").primaryKey(),
    prospectus_id: integer("prospectus_id")
      .notNull()
      .references(() => prospectusSubmissionsTable.id, { onDelete: "cascade" }),
    reviewer_system_admin_id: integer("reviewer_system_admin_id")
      .notNull()
      .references(() => systemAdminsTable.id, { onDelete: "restrict" }),
    decision: text("decision").notNull().$type<ProspectusReviewDecision>(),
    comments: text("comments").notNull().default(""),
    is_internal: boolean("is_internal").notNull().default(false),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("prospectus_reviews_prospectus_id_idx").on(table.prospectus_id)],
);

export type ProspectusReview = typeof prospectusReviewsTable.$inferSelect;
export type InsertProspectusReview = typeof prospectusReviewsTable.$inferInsert;
