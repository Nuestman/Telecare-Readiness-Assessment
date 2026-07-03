import type { Survey } from "@workspace/db";

const CSV_COLUMNS: (keyof Survey)[] = [
  "id",
  "submitted_at",
  "age_group",
  "gender",
  "employment_type",
  "contractor_company",
  "work_area",
  "years_at_aga",
  "has_ncd",
  "ncd_types",
  "other_ncd",
  "currently_on_treatment",
  "treatment_location",
  "attends_followup",
  "missed_followup_reasons",
  "other_missed_reason",
  "has_smartphone",
  "smartphone_usage",
  "has_internet",
  "internet_quality",
  "comfortable_with_video_call",
  "heard_of_telehealth",
  "telehealth_sources",
  "used_telehealth_before",
  "willing_to_use_telehealth",
  "preferred_telehealth_mode",
  "preferred_telehealth_use",
  "willing_for_ncd_telecare",
  "willing_for_followup_telecare",
  "privacy_concern",
  "technical_difficulty_concern",
  "effectiveness_concern",
  "other_concerns",
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

export function surveysToCsv(surveys: Survey[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = surveys.map((survey) =>
    CSV_COLUMNS.map((col) => escapeCsv(survey[col])).join(","),
  );
  return [header, ...rows].join("\n");
}
