import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clinicianTelehealthReadinessSurveysTable = pgTable(
  "clinician_telehealth_readiness_surveys",
  {
    id: serial("id").primaryKey(),

    // Section 1: Professional profile
    clinical_role: text("clinical_role").notNull(),
    clinical_role_other: text("clinical_role_other"),
    department: text("department").notNull(),
    department_other: text("department_other"),
    years_in_clinical_practice: text("years_in_clinical_practice").notNull(),
    years_at_aga_health: text("years_at_aga_health").notNull(),
    telehealth_exposure_in_role: text("telehealth_exposure_in_role").notNull(),

    // Section 2: Awareness & prior use
    heard_of_telehealth: text("heard_of_telehealth").notNull(),
    awareness_sources: text("awareness_sources"),
    awareness_sources_other: text("awareness_sources_other"),
    used_telehealth_before: text("used_telehealth_before").notNull(),
    used_modalities: text("used_modalities"),
    national_policy_awareness: text("national_policy_awareness").notNull(),

    // Section 3: Self-efficacy
    confidence_video_consultation: text("confidence_video_consultation").notNull(),
    confidence_phone_followup: text("confidence_phone_followup").notNull(),
    confidence_async_messaging: text("confidence_async_messaging").notNull(),
    confidence_remote_vitals: text("confidence_remote_vitals").notNull(),
    confidence_digital_documentation: text("confidence_digital_documentation").notNull(),

    // Section 4: Workflow fit
    time_for_telehealth: text("time_for_telehealth").notNull(),
    documentation_burden_concern: text("documentation_burden_concern").notNull(),
    workflow_integration: text("workflow_integration").notNull(),
    referral_pathway_clarity: text("referral_pathway_clarity").notNull(),
    team_coordination: text("team_coordination").notNull(),
    comfort_clinical_decisions_remotely: text("comfort_clinical_decisions_remotely"),
    comfort_patient_education_remotely: text("comfort_patient_education_remotely"),

    // Section 5: Facility enablers
    internet_at_workplace: text("internet_at_workplace").notNull(),
    power_reliability: text("power_reliability").notNull(),
    device_availability: text("device_availability").notNull(),
    private_space_for_calls: text("private_space_for_calls").notNull(),
    facility_support: text("facility_support").notNull(),

    // Section 6: Barriers & concerns
    barrier_liability: text("barrier_liability").notNull(),
    barrier_privacy: text("barrier_privacy").notNull(),
    barrier_patient_digital_literacy: text("barrier_patient_digital_literacy").notNull(),
    barrier_language: text("barrier_language").notNull(),
    barrier_technical_failure: text("barrier_technical_failure").notNull(),
    barrier_effectiveness: text("barrier_effectiveness").notNull(),
    other_barriers: text("other_barriers"),
    other_barriers_text: text("other_barriers_text"),

    // Section 7: Training needs
    received_telehealth_training: text("received_telehealth_training").notNull(),
    training_needs: text("training_needs").notNull(),
    training_format_preference: text("training_format_preference").notNull(),

    // Section 8: Willingness to deliver telecare
    willing_to_provide_telehealth: text("willing_to_provide_telehealth").notNull(),
    willing_ncd_telecare: text("willing_ncd_telecare").notNull(),
    willing_routine_review: text("willing_routine_review").notNull(),
    willing_triage: text("willing_triage").notNull(),
    preferred_modalities: text("preferred_modalities").notNull(),
    willing_prescribe_after_remote: text("willing_prescribe_after_remote"),
    willing_remote_monitoring: text("willing_remote_monitoring"),

    // Section 9: Open feedback
    suggestions: text("suggestions"),
    consent_given: boolean("consent_given").notNull().default(false),

    submitted_at: timestamp("submitted_at").notNull().defaultNow(),
  },
);

export const insertClinicianTelehealthReadinessSurveySchema = createInsertSchema(
  clinicianTelehealthReadinessSurveysTable,
).omit({
  id: true,
  submitted_at: true,
});

export type InsertClinicianTelehealthReadinessSurvey = z.infer<
  typeof insertClinicianTelehealthReadinessSurveySchema
>;
export type ClinicianTelehealthReadinessSurvey =
  typeof clinicianTelehealthReadinessSurveysTable.$inferSelect;
