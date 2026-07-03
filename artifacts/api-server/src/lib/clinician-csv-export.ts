import type { ClinicianTelehealthReadinessSurvey } from "@workspace/db";

const CSV_COLUMNS: (keyof ClinicianTelehealthReadinessSurvey)[] = [
  "id",
  "submitted_at",
  "clinical_role",
  "clinical_role_other",
  "department",
  "department_other",
  "years_in_clinical_practice",
  "years_at_aga_health",
  "telehealth_exposure_in_role",
  "heard_of_telehealth",
  "awareness_sources",
  "awareness_sources_other",
  "used_telehealth_before",
  "used_modalities",
  "national_policy_awareness",
  "confidence_video_consultation",
  "confidence_phone_followup",
  "confidence_async_messaging",
  "confidence_remote_vitals",
  "confidence_digital_documentation",
  "time_for_telehealth",
  "documentation_burden_concern",
  "workflow_integration",
  "referral_pathway_clarity",
  "team_coordination",
  "comfort_clinical_decisions_remotely",
  "comfort_patient_education_remotely",
  "internet_at_workplace",
  "power_reliability",
  "device_availability",
  "private_space_for_calls",
  "facility_support",
  "barrier_liability",
  "barrier_privacy",
  "barrier_patient_digital_literacy",
  "barrier_language",
  "barrier_technical_failure",
  "barrier_effectiveness",
  "other_barriers",
  "other_barriers_text",
  "received_telehealth_training",
  "training_needs",
  "training_format_preference",
  "willing_to_provide_telehealth",
  "willing_ncd_telecare",
  "willing_routine_review",
  "willing_triage",
  "preferred_modalities",
  "willing_prescribe_after_remote",
  "willing_remote_monitoring",
  "suggestions",
  "consent_given",
];

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function clinicianSurveysToCsv(
  surveys: ClinicianTelehealthReadinessSurvey[],
): string {
  const header = CSV_COLUMNS.join(",");
  const rows = surveys.map((survey) =>
    CSV_COLUMNS.map((col) => escapeCsv(survey[col])).join(","),
  );
  return [header, ...rows].join("\n");
}
