import { Router } from "express";
import {
  db,
  clinicianTelehealthReadinessSurveysTable,
  studiesTable,
  CLINICIAN_TELEHEALTH_STUDY_SLUG,
} from "@workspace/db";
import { desc, count, eq } from "drizzle-orm";
import { SubmitClinicianSurveyBody } from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";
import { surveySubmitLimiter } from "../middleware/rate-limit";
import { validateSubmissionTiming } from "../lib/study-window";
import { assertStudyCollectionOpen } from "../lib/study-collection";
import { requireStudyAccess } from "../middleware/study-access";
import {
  buildClinicianSurveyWhereClause,
  parseClinicianSurveyListQuery,
} from "../lib/clinician-survey-filters";
import { computeClinicianSurveyStats } from "../lib/clinician-survey-stats";
import { clinicianSurveysToCsv } from "../lib/clinician-csv-export";

const router = Router();

function registerClinicianSurveyRoutes(target: Router) {
  target.post("/surveys", surveySubmitLimiter, async (req, res) => {
    let study = req.study;
    if (!study) {
      const [row] = await db
        .select()
        .from(studiesTable)
        .where(eq(studiesTable.slug, CLINICIAN_TELEHEALTH_STUDY_SLUG))
        .limit(1);
      study = row;
    }

    if (!study || study.slug !== CLINICIAN_TELEHEALTH_STUDY_SLUG) {
      res.status(404).json({ error: "Study not found" });
      return;
    }

    const collection = assertStudyCollectionOpen(study);
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

    const parsed = SubmitClinicianSurveyBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const data = parsed.data;

    const [survey] = await db
      .insert(clinicianTelehealthReadinessSurveysTable)
      .values({
        clinical_role: data.clinical_role,
        clinical_role_other: data.clinical_role_other ?? null,
        department: data.department,
        department_other: data.department_other ?? null,
        years_in_clinical_practice: data.years_in_clinical_practice,
        years_at_aga_health: data.years_at_aga_health,
        telehealth_exposure_in_role: data.telehealth_exposure_in_role,
        heard_of_telehealth: data.heard_of_telehealth,
        awareness_sources: data.awareness_sources ?? null,
        awareness_sources_other: data.awareness_sources_other ?? null,
        used_telehealth_before: data.used_telehealth_before,
        used_modalities: data.used_modalities ?? null,
        national_policy_awareness: data.national_policy_awareness,
        confidence_video_consultation: data.confidence_video_consultation,
        confidence_phone_followup: data.confidence_phone_followup,
        confidence_async_messaging: data.confidence_async_messaging,
        confidence_remote_vitals: data.confidence_remote_vitals,
        confidence_digital_documentation: data.confidence_digital_documentation,
        time_for_telehealth: data.time_for_telehealth,
        documentation_burden_concern: data.documentation_burden_concern,
        workflow_integration: data.workflow_integration,
        referral_pathway_clarity: data.referral_pathway_clarity,
        team_coordination: data.team_coordination,
        comfort_clinical_decisions_remotely: data.comfort_clinical_decisions_remotely ?? null,
        comfort_patient_education_remotely: data.comfort_patient_education_remotely ?? null,
        internet_at_workplace: data.internet_at_workplace,
        power_reliability: data.power_reliability,
        device_availability: data.device_availability,
        private_space_for_calls: data.private_space_for_calls,
        facility_support: data.facility_support,
        barrier_liability: data.barrier_liability,
        barrier_privacy: data.barrier_privacy,
        barrier_patient_digital_literacy: data.barrier_patient_digital_literacy,
        barrier_language: data.barrier_language,
        barrier_technical_failure: data.barrier_technical_failure,
        barrier_effectiveness: data.barrier_effectiveness,
        other_barriers: data.other_barriers ?? null,
        other_barriers_text: data.other_barriers_text ?? null,
        received_telehealth_training: data.received_telehealth_training,
        training_needs: data.training_needs,
        training_format_preference: data.training_format_preference,
        willing_to_provide_telehealth: data.willing_to_provide_telehealth,
        willing_ncd_telecare: data.willing_ncd_telecare,
        willing_routine_review: data.willing_routine_review,
        willing_triage: data.willing_triage,
        preferred_modalities: data.preferred_modalities,
        willing_prescribe_after_remote: data.willing_prescribe_after_remote ?? null,
        willing_remote_monitoring: data.willing_remote_monitoring ?? null,
        suggestions: data.suggestions ?? null,
        consent_given: data.consent_given,
      })
      .returning();

    res.status(201).json(survey);
  });

  target.get("/surveys", requireStudyAccess("viewer"), requireAuth, async (req, res) => {
    const query = parseClinicianSurveyListQuery(req);
    const offset = ((query.page ?? 1) - 1) * (query.limit ?? 20);
    const whereClause = buildClinicianSurveyWhereClause(query);

    const [surveys, [{ count: total }]] = await Promise.all([
      db
        .select()
        .from(clinicianTelehealthReadinessSurveysTable)
        .where(whereClause)
        .orderBy(desc(clinicianTelehealthReadinessSurveysTable.submitted_at))
        .limit(query.limit ?? 20)
        .offset(offset),
      db
        .select({ count: count() })
        .from(clinicianTelehealthReadinessSurveysTable)
        .where(whereClause),
    ]);

    res.json({
      surveys,
      total: Number(total),
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  });

  target.get("/surveys/stats", requireStudyAccess("viewer"), requireAuth, async (req, res) => {
    const query = parseClinicianSurveyListQuery(req);
    const stats = await computeClinicianSurveyStats(query);
    res.json(stats);
  });

  target.get("/surveys/export", requireStudyAccess("analyst"), async (req, res) => {
    const query = parseClinicianSurveyListQuery(req);
    const whereClause = buildClinicianSurveyWhereClause(query);

    const surveys = await db
      .select()
      .from(clinicianTelehealthReadinessSurveysTable)
      .where(whereClause)
      .orderBy(desc(clinicianTelehealthReadinessSurveysTable.submitted_at));

    const csv = clinicianSurveysToCsv(surveys);
    const filename = `clinician-telehealth-readiness-export-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  });

  target.get("/surveys/:id", requireStudyAccess("viewer"), requireAuth, async (req, res) => {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid survey ID" });
      return;
    }

    const [survey] = await db
      .select()
      .from(clinicianTelehealthReadinessSurveysTable)
      .where(eq(clinicianTelehealthReadinessSurveysTable.id, id));

    if (!survey) {
      res.status(404).json({ error: "Survey not found" });
      return;
    }

    res.json(survey);
  });
}

registerClinicianSurveyRoutes(router);

export default router;
