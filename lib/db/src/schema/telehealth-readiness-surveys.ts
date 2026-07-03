import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const telehealthReadinessSurveysTable = pgTable("telehealth_readiness_surveys", {
  id: serial("id").primaryKey(),

  // Section 1: Demographics
  age_group: text("age_group").notNull(),
  gender: text("gender").notNull(),
  employment_type: text("employment_type").notNull(),
  contractor_company: text("contractor_company"),
  work_area: text("work_area").notNull(),
  years_at_aga: text("years_at_aga"),

  // Section 2: Health background
  has_ncd: text("has_ncd").notNull(),
  ncd_types: text("ncd_types"),
  other_ncd: text("other_ncd"),
  currently_on_treatment: text("currently_on_treatment"),
  treatment_location: text("treatment_location"),

  // Section 3: Follow-up behaviour
  attends_followup: text("attends_followup").notNull(),
  missed_followup_reasons: text("missed_followup_reasons"),
  other_missed_reason: text("other_missed_reason"),

  // Section 4: Technology access
  has_smartphone: text("has_smartphone").notNull(),
  smartphone_usage: text("smartphone_usage"),
  has_internet: text("has_internet").notNull(),
  internet_quality: text("internet_quality"),
  comfortable_with_video_call: text("comfortable_with_video_call"),

  // Section 5: Telehealth awareness
  heard_of_telehealth: text("heard_of_telehealth").notNull(),
  telehealth_sources: text("telehealth_sources"),
  used_telehealth_before: text("used_telehealth_before"),

  // Section 6: Readiness & willingness
  willing_to_use_telehealth: text("willing_to_use_telehealth").notNull(),
  preferred_telehealth_mode: text("preferred_telehealth_mode"),
  preferred_telehealth_use: text("preferred_telehealth_use"),
  willing_for_ncd_telecare: text("willing_for_ncd_telecare"),
  willing_for_followup_telecare: text("willing_for_followup_telecare"),

  // Section 7: Concerns
  privacy_concern: text("privacy_concern"),
  technical_difficulty_concern: text("technical_difficulty_concern"),
  effectiveness_concern: text("effectiveness_concern"),
  other_concerns: text("other_concerns"),

  // Section 8: Open-ended
  suggestions: text("suggestions"),
  consent_given: boolean("consent_given").notNull().default(false),

  submitted_at: timestamp("submitted_at").notNull().defaultNow(),
});

/** @deprecated Use telehealthReadinessSurveysTable */
export const surveysTable = telehealthReadinessSurveysTable;

export const insertTelehealthReadinessSurveySchema = createInsertSchema(
  telehealthReadinessSurveysTable,
).omit({
  id: true,
  submitted_at: true,
});

/** @deprecated Use insertTelehealthReadinessSurveySchema */
export const insertSurveySchema = insertTelehealthReadinessSurveySchema;

export type InsertTelehealthReadinessSurvey = z.infer<
  typeof insertTelehealthReadinessSurveySchema
>;
export type TelehealthReadinessSurvey = typeof telehealthReadinessSurveysTable.$inferSelect;

/** @deprecated Use TelehealthReadinessSurvey */
export type InsertSurvey = InsertTelehealthReadinessSurvey;
/** @deprecated Use TelehealthReadinessSurvey */
export type Survey = TelehealthReadinessSurvey;
