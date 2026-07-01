import { count, eq, sql } from "drizzle-orm";
import { db, surveysTable, TELEHEALTH_STUDY_SLUG } from "@workspace/db";
import type { SQL } from "drizzle-orm";
import { buildSurveyWhereClause, type SurveyListQuery } from "./survey-filters";

type BreakdownField =
  | "employment_type"
  | "age_group"
  | "gender"
  | "has_ncd"
  | "attends_followup"
  | "willing_for_followup_telecare"
  | "willing_for_ncd_telecare"
  | "willing_to_use_telehealth";

async function fieldBreakdown(
  field: BreakdownField,
  whereClause: SQL | undefined,
): Promise<Record<string, number>> {
  const column = surveysTable[field];
  const rows = await db
    .select({
      value: column,
      count: count(),
    })
    .from(surveysTable)
    .where(whereClause)
    .groupBy(column);

  const map: Record<string, number> = {};
  for (const row of rows) {
    const key = String(row.value ?? "unknown");
    map[key] = Number(row.count);
  }
  return map;
}

async function rateOf(
  field: "has_smartphone" | "has_internet" | "heard_of_telehealth",
  value: string,
  whereClause: SQL | undefined,
): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(surveysTable)
    .where(whereClause);

  const totalNum = Number(total);
  if (totalNum === 0) return 0;

  const matchWhere =
    whereClause !== undefined
      ? sql`${whereClause} AND ${surveysTable[field]} = ${value}`
      : sql`${surveysTable.study_slug} = ${TELEHEALTH_STUDY_SLUG} AND ${surveysTable[field]} = ${value}`;

  const [{ matched }] = await db
    .select({ matched: count() })
    .from(surveysTable)
    .where(matchWhere);

  return Number(matched) / totalNum;
}

export async function computeSurveyStats(
  filterQuery: Pick<
    SurveyListQuery,
    | "employment_type"
    | "has_ncd"
    | "work_area"
    | "date_from"
    | "date_to"
    | "min_willingness"
  >,
) {
  const whereClause = buildSurveyWhereClause(filterQuery);

  const [{ total }] = await db
    .select({ total: count() })
    .from(surveysTable)
    .where(whereClause);

  const totalNum = Number(total);

  const avgWhere =
    whereClause !== undefined
      ? sql`${whereClause} AND ${surveysTable.willing_to_use_telehealth} ~ '^[0-9]+$'`
      : sql`${surveysTable.study_slug} = ${TELEHEALTH_STUDY_SLUG} AND ${surveysTable.willing_to_use_telehealth} ~ '^[0-9]+$'`;

  const [{ avgWillingness }] = await db
    .select({
      avgWillingness: sql<number>`COALESCE(AVG(CAST(${surveysTable.willing_to_use_telehealth} AS INTEGER)), 0)`,
    })
    .from(surveysTable)
    .where(avgWhere);

  const [
    employment_type_breakdown,
    age_group_breakdown,
    gender_breakdown,
    has_ncd_breakdown,
    attends_followup_breakdown,
    willing_for_followup_telecare_breakdown,
    willing_for_ncd_telecare_breakdown,
    has_smartphone_rate,
    has_internet_rate,
    heard_of_telehealth_rate,
  ] = await Promise.all([
    fieldBreakdown("employment_type", whereClause),
    fieldBreakdown("age_group", whereClause),
    fieldBreakdown("gender", whereClause),
    fieldBreakdown("has_ncd", whereClause),
    fieldBreakdown("attends_followup", whereClause),
    fieldBreakdown("willing_for_followup_telecare", whereClause),
    fieldBreakdown("willing_for_ncd_telecare", whereClause),
    rateOf("has_smartphone", "yes", whereClause),
    rateOf("has_internet", "yes", whereClause),
    rateOf("heard_of_telehealth", "yes", whereClause),
  ]);

  const concernAvg = async (field: "privacy_concern" | "technical_difficulty_concern" | "effectiveness_concern") => {
    const concernWhere =
      whereClause !== undefined
        ? sql`${whereClause} AND ${surveysTable[field]} ~ '^[0-9]+$'`
        : sql`${surveysTable.study_slug} = ${TELEHEALTH_STUDY_SLUG} AND ${surveysTable[field]} ~ '^[0-9]+$'`;

    const [{ avg }] = await db
      .select({
        avg: sql<number>`COALESCE(AVG(CAST(${surveysTable[field]} AS INTEGER)), 0)`,
      })
      .from(surveysTable)
      .where(concernWhere);

    return Math.round(Number(avg) * 10) / 10;
  };

  const [avg_privacy_concern, avg_technical_concern, avg_effectiveness_concern] =
    await Promise.all([
      concernAvg("privacy_concern"),
      concernAvg("technical_difficulty_concern"),
      concernAvg("effectiveness_concern"),
    ]);

  return {
    total_responses: totalNum,
    employment_type_breakdown,
    age_group_breakdown,
    gender_breakdown,
    has_ncd_breakdown,
    attends_followup_breakdown,
    has_smartphone_rate,
    has_internet_rate,
    heard_of_telehealth_rate,
    avg_willingness_score: Math.round(Number(avgWillingness) * 10) / 10,
    willing_for_followup_telecare_breakdown,
    willing_for_ncd_telecare_breakdown,
    avg_privacy_concern,
    avg_technical_concern,
    avg_effectiveness_concern,
    willingness_breakdown: await fieldBreakdown("willing_to_use_telehealth", whereClause),
  };
}
