import { Router } from "express";
import { db, surveysTable, TELEHEALTH_STUDY_SLUG } from "@workspace/db";
import { desc, count, eq, and } from "drizzle-orm";
import { SubmitSurveyBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middleware/auth";
import { surveySubmitLimiter } from "../middleware/rate-limit";
import {
  assertCollectionOpen,
  validateSubmissionTiming,
} from "../lib/study-window";
import {
  buildSurveyWhereClause,
  parseSurveyListQuery,
} from "../lib/survey-filters";
import { computeSurveyStats } from "../lib/survey-stats";
import { surveysToCsv } from "../lib/csv-export";

const router = Router();

function registerSurveyRoutes(target: Router) {
  target.post("/surveys", surveySubmitLimiter, async (req, res) => {
    const collection = assertCollectionOpen();
    if (!collection.ok) {
      res.status(403).json({ error: collection.message });
      return;
    }

    const body = req.body as Record<string, unknown>;
    if (body.website) {
      res.status(400).json({ error: "Invalid submission" });
      return;
    }

    const timing = validateSubmissionTiming(body.form_started_at as string | undefined);
    if (!timing.ok) {
      res.status(400).json({ error: timing.message });
      return;
    }

    const parsed = SubmitSurveyBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const data = parsed.data;

    const [survey] = await db
      .insert(surveysTable)
      .values({
        study_slug: TELEHEALTH_STUDY_SLUG,
        age_group: data.age_group,
        gender: data.gender,
        employment_type: data.employment_type,
        contractor_company: data.contractor_company ?? null,
        work_area: data.work_area,
        years_at_aga: data.years_at_aga ?? null,
        has_ncd: data.has_ncd,
        ncd_types: data.ncd_types ?? null,
        other_ncd: data.other_ncd ?? null,
        currently_on_treatment: data.currently_on_treatment ?? null,
        treatment_location: data.treatment_location ?? null,
        attends_followup: data.attends_followup,
        missed_followup_reasons: data.missed_followup_reasons ?? null,
        other_missed_reason: data.other_missed_reason ?? null,
        has_smartphone: data.has_smartphone,
        smartphone_usage: data.smartphone_usage ?? null,
        has_internet: data.has_internet,
        internet_quality: data.internet_quality ?? null,
        comfortable_with_video_call: data.comfortable_with_video_call ?? null,
        heard_of_telehealth: data.heard_of_telehealth,
        telehealth_sources: data.telehealth_sources ?? null,
        used_telehealth_before: data.used_telehealth_before ?? null,
        willing_to_use_telehealth: data.willing_to_use_telehealth,
        preferred_telehealth_mode: data.preferred_telehealth_mode ?? null,
        preferred_telehealth_use: data.preferred_telehealth_use ?? null,
        willing_for_ncd_telecare: data.willing_for_ncd_telecare ?? null,
        willing_for_followup_telecare: data.willing_for_followup_telecare ?? null,
        privacy_concern: data.privacy_concern ?? null,
        technical_difficulty_concern: data.technical_difficulty_concern ?? null,
        effectiveness_concern: data.effectiveness_concern ?? null,
        other_concerns: data.other_concerns ?? null,
        suggestions: data.suggestions ?? null,
        consent_given: data.consent_given,
      })
      .returning();

    res.status(201).json(survey);
  });

  target.get("/surveys", requireAuth, async (req, res) => {
    const query = parseSurveyListQuery(req);
    const offset = ((query.page ?? 1) - 1) * (query.limit ?? 20);
    const whereClause = buildSurveyWhereClause(query);

    const [surveys, [{ count: total }]] = await Promise.all([
      db
        .select()
        .from(surveysTable)
        .where(whereClause)
        .orderBy(desc(surveysTable.submitted_at))
        .limit(query.limit ?? 20)
        .offset(offset),
      db.select({ count: count() }).from(surveysTable).where(whereClause),
    ]);

    res.json({
      surveys,
      total: Number(total),
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  });

  target.get("/surveys/stats", requireAuth, async (req, res) => {
    const query = parseSurveyListQuery(req);
    const stats = await computeSurveyStats(query);
    res.json(stats);
  });

  target.get("/surveys/export", requireRole("analyst"), async (req, res) => {
    const query = parseSurveyListQuery(req);
    const whereClause = buildSurveyWhereClause(query);

    const surveys = await db
      .select()
      .from(surveysTable)
      .where(whereClause)
      .orderBy(desc(surveysTable.submitted_at));

    const csv = surveysToCsv(surveys);
    const filename = `telehealth-readiness-export-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  });

  target.get("/surveys/:id", requireAuth, async (req, res) => {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid survey ID" });
      return;
    }

    const whereClause = and(
      eq(surveysTable.id, id),
      eq(surveysTable.study_slug, TELEHEALTH_STUDY_SLUG),
    );

    const [survey] = await db.select().from(surveysTable).where(whereClause);

    if (!survey) {
      res.status(404).json({ error: "Survey not found" });
      return;
    }

    res.json(survey);
  });
}

registerSurveyRoutes(router);

export default router;
