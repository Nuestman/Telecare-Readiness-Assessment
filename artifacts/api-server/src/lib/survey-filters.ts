import {
  and,
  eq,
  gte,
  lte,
  sql,
  ilike,
  type SQL,
} from "drizzle-orm";
import type { Request } from "express";
import { telehealthReadinessSurveysTable } from "@workspace/db";

export type SurveyListQuery = {
  page?: number;
  limit?: number;
  employment_type?: string;
  has_ncd?: string;
  work_area?: string;
  date_from?: string;
  date_to?: string;
  min_willingness?: number;
};

export function parseSurveyListQuery(req: Request): SurveyListQuery {
  const minWillingnessRaw = req.query.min_willingness;
  const minWillingness =
    minWillingnessRaw !== undefined
      ? parseInt(String(minWillingnessRaw), 10)
      : undefined;

  return {
    page: Math.max(1, parseInt(String(req.query.page ?? "1"), 10)),
    limit: Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10))),
    employment_type: req.query.employment_type as string | undefined,
    has_ncd: req.query.has_ncd as string | undefined,
    work_area: req.query.work_area as string | undefined,
    date_from: req.query.date_from as string | undefined,
    date_to: req.query.date_to as string | undefined,
    min_willingness:
      minWillingness !== undefined && !Number.isNaN(minWillingness)
        ? minWillingness
        : undefined,
  };
}

export function buildSurveyWhereClause(
  query: Pick<
    SurveyListQuery,
    | "employment_type"
    | "has_ncd"
    | "work_area"
    | "date_from"
    | "date_to"
    | "min_willingness"
  >,
): SQL | undefined {
  const conditions: SQL[] = [];

  if (query.employment_type) {
    conditions.push(
      eq(telehealthReadinessSurveysTable.employment_type, query.employment_type),
    );
  }
  if (query.has_ncd) {
    conditions.push(eq(telehealthReadinessSurveysTable.has_ncd, query.has_ncd));
  }
  if (query.work_area) {
    conditions.push(
      ilike(telehealthReadinessSurveysTable.work_area, `%${query.work_area}%`),
    );
  }
  if (query.date_from) {
    conditions.push(
      gte(telehealthReadinessSurveysTable.submitted_at, new Date(query.date_from)),
    );
  }
  if (query.date_to) {
    conditions.push(
      lte(telehealthReadinessSurveysTable.submitted_at, new Date(query.date_to)),
    );
  }
  if (query.min_willingness !== undefined) {
    conditions.push(
      gte(
        sql`CAST(${telehealthReadinessSurveysTable.willing_to_use_telehealth} AS INTEGER)`,
        query.min_willingness,
      ),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
