import { count, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db, clinicianTelehealthReadinessSurveysTable } from "@workspace/db";
import {
  buildClinicianSurveyWhereClause,
  type ClinicianSurveyListQuery,
} from "./clinician-survey-filters";

type BreakdownField =
  | "clinical_role"
  | "department"
  | "heard_of_telehealth"
  | "used_telehealth_before"
  | "willing_ncd_telecare"
  | "willing_routine_review"
  | "willing_triage"
  | "training_format_preference";

async function fieldBreakdown(
  field: BreakdownField,
  whereClause: SQL | undefined,
): Promise<Record<string, number>> {
  const column = clinicianTelehealthReadinessSurveysTable[field];
  const rows = await db
    .select({ value: column, count: count() })
    .from(clinicianTelehealthReadinessSurveysTable)
    .where(whereClause)
    .groupBy(column);

  const map: Record<string, number> = {};
  for (const row of rows) {
    map[String(row.value ?? "unknown")] = Number(row.count);
  }
  return map;
}

async function multiSelectBreakdown(
  field: "training_needs" | "preferred_modalities" | "awareness_sources",
  whereClause: SQL | undefined,
): Promise<Record<string, number>> {
  const rows = await db
    .select({ value: clinicianTelehealthReadinessSurveysTable[field] })
    .from(clinicianTelehealthReadinessSurveysTable)
    .where(whereClause);

  const map: Record<string, number> = {};
  for (const row of rows) {
    const raw = row.value;
    if (!raw) continue;
    for (const token of raw.split(",")) {
      const key = token.trim();
      if (!key) continue;
      map[key] = (map[key] ?? 0) + 1;
    }
  }
  return map;
}

type ClinicianLikertField = keyof Pick<
  typeof clinicianTelehealthReadinessSurveysTable.$inferSelect,
  | "confidence_video_consultation"
  | "confidence_phone_followup"
  | "confidence_async_messaging"
  | "confidence_remote_vitals"
  | "confidence_digital_documentation"
  | "time_for_telehealth"
  | "documentation_burden_concern"
  | "referral_pathway_clarity"
  | "facility_support"
  | "barrier_liability"
  | "barrier_privacy"
  | "barrier_patient_digital_literacy"
  | "barrier_language"
  | "barrier_technical_failure"
  | "barrier_effectiveness"
  | "willing_to_provide_telehealth"
>;

async function avgLikertField(
  field: ClinicianLikertField,
  whereClause: SQL | undefined,
): Promise<number> {
  const column = clinicianTelehealthReadinessSurveysTable[field];
  const likertWhere =
    whereClause !== undefined
      ? sql`${whereClause} AND ${column} ~ '^[0-9]+$'`
      : sql`${column} ~ '^[0-9]+$'`;

  const [{ avg }] = await db
    .select({
      avg: sql<number>`COALESCE(AVG(CAST(${column} AS INTEGER)), 0)`,
    })
    .from(clinicianTelehealthReadinessSurveysTable)
    .where(likertWhere);

  return Number(avg);
}

async function avgLikertFields(
  fields: ClinicianLikertField[],
  whereClause: SQL | undefined,
): Promise<number> {
  if (fields.length === 0) return 0;
  const values = await Promise.all(fields.map((field) => avgLikertField(field, whereClause)));
  const mean = values.reduce((sum, value) => sum + value, 0) / fields.length;
  return Math.round(mean * 10) / 10;
}

async function rateOf(
  field: "heard_of_telehealth",
  value: string,
  whereClause: SQL | undefined,
): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(clinicianTelehealthReadinessSurveysTable)
    .where(whereClause);

  const totalNum = Number(total);
  if (totalNum === 0) return 0;

  const matchWhere =
    whereClause !== undefined
      ? sql`${whereClause} AND ${clinicianTelehealthReadinessSurveysTable[field]} = ${value}`
      : sql`${clinicianTelehealthReadinessSurveysTable[field]} = ${value}`;

  const [{ matched }] = await db
    .select({ matched: count() })
    .from(clinicianTelehealthReadinessSurveysTable)
    .where(matchWhere);

  return Number(matched) / totalNum;
}

export async function computeClinicianSurveyStats(
  filterQuery: Pick<
    ClinicianSurveyListQuery,
    "clinical_role" | "department" | "date_from" | "date_to" | "min_willingness"
  >,
) {
  const whereClause = buildClinicianSurveyWhereClause(filterQuery);

  const [{ total }] = await db
    .select({ total: count() })
    .from(clinicianTelehealthReadinessSurveysTable)
    .where(whereClause);

  const totalNum = Number(total);

  const [
    clinical_role_breakdown,
    department_breakdown,
    willing_ncd_telecare_breakdown,
    willing_routine_review_breakdown,
    willing_triage_breakdown,
    heard_of_telehealth_breakdown,
    used_telehealth_before_breakdown,
    training_needs_breakdown,
    preferred_modalities_breakdown,
    heard_of_telehealth_rate,
    avg_self_efficacy_score,
    avg_barrier_score,
    avg_facility_readiness_score,
    avg_willingness_score,
    willingness_breakdown,
  ] = await Promise.all([
    fieldBreakdown("clinical_role", whereClause),
    fieldBreakdown("department", whereClause),
    fieldBreakdown("willing_ncd_telecare", whereClause),
    fieldBreakdown("willing_routine_review", whereClause),
    fieldBreakdown("willing_triage", whereClause),
    fieldBreakdown("heard_of_telehealth", whereClause),
    fieldBreakdown("used_telehealth_before", whereClause),
    multiSelectBreakdown("training_needs", whereClause),
    multiSelectBreakdown("preferred_modalities", whereClause),
    rateOf("heard_of_telehealth", "yes", whereClause),
    avgLikertFields(
      [
        "confidence_video_consultation",
        "confidence_phone_followup",
        "confidence_async_messaging",
        "confidence_remote_vitals",
        "confidence_digital_documentation",
      ],
      whereClause,
    ),
    avgLikertFields(
      [
        "barrier_liability",
        "barrier_privacy",
        "barrier_patient_digital_literacy",
        "barrier_language",
        "barrier_technical_failure",
        "barrier_effectiveness",
      ],
      whereClause,
    ),
    avgLikertField("facility_support", whereClause).then((v) => Math.round(v * 10) / 10),
    avgLikertField("willing_to_provide_telehealth", whereClause).then(
      (v) => Math.round(v * 10) / 10,
    ),
    fieldBreakdown("willing_to_provide_telehealth" as BreakdownField, whereClause),
  ]);

  return {
    total_responses: totalNum,
    clinical_role_breakdown,
    department_breakdown,
    willing_ncd_telecare_breakdown,
    willing_routine_review_breakdown,
    willing_triage_breakdown,
    heard_of_telehealth_breakdown,
    used_telehealth_before_breakdown,
    training_needs_breakdown,
    preferred_modalities_breakdown,
    heard_of_telehealth_rate,
    avg_self_efficacy_score,
    avg_barrier_score,
    avg_facility_readiness_score,
    avg_willingness_score,
    willingness_breakdown,
  };
}
