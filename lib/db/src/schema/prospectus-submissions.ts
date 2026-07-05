import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  ProspectusStatus,
  ProspectusStudyType,
  StudyTemplate,
} from "../constants";
import { adminUsersTable } from "./admin-users";

/** Structured methodology block (design, population, sampling, instruments, analysis). */
export type ProspectusMethodology = {
  approach: "quantitative" | "qualitative" | "mixed_methods";
  design: string;
  population: string;
  sampling: string;
  instruments: string;
  analysis: string;
};

/** Timeline milestone for work plan section. */
export type ProspectusTimelinePhase = {
  phase: string;
  start: string;
  end: string;
};

/** Co-investigator row stored as JSON objects in co_investigators. */
export type CoInvestigator = {
  name: string;
  role: string;
};

export const prospectusSubmissionsTable = pgTable(
  "prospectus_submissions",
  {
    id: serial("id").primaryKey(),
    public_id: uuid("public_id").notNull().unique().defaultRandom(),
    status: text("status")
      .notNull()
      .$type<ProspectusStatus>()
      .default("draft"),
    submitter_email: text("submitter_email").notNull(),
    submitter_name: text("submitter_name").notNull(),
    submitter_user_id: integer("submitter_user_id").references(() => adminUsersTable.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull().default(""),
    principal_investigator: text("principal_investigator").notNull().default(""),
    co_investigators: jsonb("co_investigators").$type<CoInvestigator[]>().notNull().default([]),
    organization: text("organization").notNull().default("AGA Health Foundation"),
    department: text("department"),
    background: text("background").notNull().default(""),
    research_problem: text("research_problem").notNull().default(""),
    research_questions: jsonb("research_questions").$type<string[]>().notNull().default([]),
    aims: text("aims").notNull().default(""),
    objectives: jsonb("objectives").$type<string[]>().notNull().default([]),
    literature_overview: text("literature_overview").notNull().default(""),
    theoretical_framework: text("theoretical_framework"),
    methodology: jsonb("methodology").$type<ProspectusMethodology>().notNull().default({
      approach: "quantitative",
      design: "",
      population: "",
      sampling: "",
      instruments: "",
      analysis: "",
    }),
    significance: text("significance").notNull().default(""),
    ethics_notes: text("ethics_notes").notNull().default(""),
    identifiable_data: boolean("identifiable_data").notNull().default(false),
    ethics_reference: text("ethics_reference"),
    data_retention: text("data_retention"),
    timeline: jsonb("timeline").$type<ProspectusTimelinePhase[]>().notNull().default([]),
    references_text: text("references_text").notNull().default(""),
    proposed_slug: text("proposed_slug"),
    study_type: text("study_type").notNull().$type<ProspectusStudyType>().default("survey"),
    study_template: text("study_template").notNull().$type<StudyTemplate>().default("custom"),
    /** Amendment linked to an approved prospectus — no edits to approved originals */
    parent_prospectus_id: integer("parent_prospectus_id"),
    is_amendment: boolean("is_amendment").notNull().default(false),
    linked_study_slug: text("linked_study_slug"),
    submitted_at: timestamp("submitted_at", { withTimezone: true }),
    approved_at: timestamp("approved_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("prospectus_submissions_status_idx").on(table.status),
    index("prospectus_submissions_submitter_email_idx").on(table.submitter_email),
    index("prospectus_submissions_linked_study_slug_idx").on(table.linked_study_slug),
  ],
);

export type ProspectusSubmission = typeof prospectusSubmissionsTable.$inferSelect;
export type InsertProspectusSubmission = typeof prospectusSubmissionsTable.$inferInsert;
