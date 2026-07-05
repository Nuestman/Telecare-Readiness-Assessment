import { boolean, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { StudyStatus } from "../constants";
import { prospectusSubmissionsTable } from "./prospectus-submissions";

export const studiesTable = pgTable(
  "studies",
  {
    slug: text("slug").primaryKey(),
    responses_table: text("responses_table").notNull().unique(),
    short_title: text("short_title").notNull(),
    full_title: text("full_title").notNull(),
    organization: text("organization").notNull().default("AGA Health Foundation"),
    location: text("location"),
    principal_investigator: text("principal_investigator"),
    ethics_reference: text("ethics_reference"),
    contact_email: text("contact_email"),
    contact_phone: text("contact_phone"),
    data_retention: text("data_retention"),
    estimated_minutes: text("estimated_minutes"),
    status: text("status").notNull().$type<StudyStatus>().default("draft"),
    opens_at: timestamp("opens_at", { withTimezone: true }),
    closes_at: timestamp("closes_at", { withTimezone: true }),
    prospectus_id: integer("prospectus_id").references(() => prospectusSubmissionsTable.id, {
      onDelete: "restrict",
    }),
    /** Pre-prospectus studies grandfathered without linked prospectus */
    prospectus_exempt: boolean("prospectus_exempt").notNull().default(false),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("studies_status_idx").on(table.status),
    index("studies_prospectus_id_idx").on(table.prospectus_id),
  ],
);

export type Study = typeof studiesTable.$inferSelect;
export type InsertStudy = typeof studiesTable.$inferInsert;
