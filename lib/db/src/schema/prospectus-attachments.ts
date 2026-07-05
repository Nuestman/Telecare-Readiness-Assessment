import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { prospectusSubmissionsTable } from "./prospectus-submissions";

/** File metadata — binary stored in Vercel Blob; DB holds pointer only. */
export const prospectusAttachmentsTable = pgTable(
  "prospectus_attachments",
  {
    id: serial("id").primaryKey(),
    prospectus_id: integer("prospectus_id")
      .notNull()
      .references(() => prospectusSubmissionsTable.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    mime_type: text("mime_type").notNull(),
    size_bytes: integer("size_bytes").notNull(),
    /** Vercel Blob pathname (used for delete) */
    blob_pathname: text("blob_pathname").notNull(),
    /** Vercel Blob URL (private; served via signed redirect or proxy) */
    blob_url: text("blob_url").notNull(),
    uploaded_at: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("prospectus_attachments_prospectus_id_idx").on(table.prospectus_id)],
);

export type ProspectusAttachment = typeof prospectusAttachmentsTable.$inferSelect;
export type InsertProspectusAttachment = typeof prospectusAttachmentsTable.$inferInsert;
