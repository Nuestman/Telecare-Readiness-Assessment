import { and, eq, gte, ilike, lte, sql, type SQL } from "drizzle-orm";
import type { Request } from "express";
import { clinicianTelehealthReadinessSurveysTable } from "@workspace/db";

export type ClinicianSurveyListQuery = {
  page?: number;
  limit?: number;
  clinical_role?: string;
  department?: string;
  date_from?: string;
  date_to?: string;
  min_willingness?: number;
};

export function parseClinicianSurveyListQuery(req: Request): ClinicianSurveyListQuery {
  const minWillingnessRaw = req.query.min_willingness;
  const minWillingness =
    minWillingnessRaw !== undefined
      ? parseInt(String(minWillingnessRaw), 10)
      : undefined;

  return {
    page: Math.max(1, parseInt(String(req.query.page ?? "1"), 10)),
    limit: Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10))),
    clinical_role: req.query.clinical_role as string | undefined,
    department: req.query.department as string | undefined,
    date_from: req.query.date_from as string | undefined,
    date_to: req.query.date_to as string | undefined,
    min_willingness:
      minWillingness !== undefined && !Number.isNaN(minWillingness)
        ? minWillingness
        : undefined,
  };
}

export function buildClinicianSurveyWhereClause(
  query: Pick<
    ClinicianSurveyListQuery,
    "clinical_role" | "department" | "date_from" | "date_to" | "min_willingness"
  >,
): SQL | undefined {
  const conditions: SQL[] = [];

  if (query.clinical_role) {
    conditions.push(
      eq(clinicianTelehealthReadinessSurveysTable.clinical_role, query.clinical_role),
    );
  }
  if (query.department) {
    conditions.push(
      ilike(clinicianTelehealthReadinessSurveysTable.department, `%${query.department}%`),
    );
  }
  if (query.date_from) {
    conditions.push(
      gte(
        clinicianTelehealthReadinessSurveysTable.submitted_at,
        new Date(query.date_from),
      ),
    );
  }
  if (query.date_to) {
    conditions.push(
      lte(
        clinicianTelehealthReadinessSurveysTable.submitted_at,
        new Date(query.date_to),
      ),
    );
  }
  if (query.min_willingness !== undefined) {
    conditions.push(
      gte(
        sql`CAST(${clinicianTelehealthReadinessSurveysTable.willing_to_provide_telehealth} AS INTEGER)`,
        query.min_willingness,
      ),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
