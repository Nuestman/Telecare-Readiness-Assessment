import { Router } from "express";
import { db, surveysTable } from "@workspace/db";
import { eq, desc, count, and } from "drizzle-orm";
import { SubmitSurveyBody } from "@workspace/api-zod";

const router = Router();

// Simple admin key protection for read endpoints (set ADMIN_KEY env var, default: "aga-admin")
const ADMIN_KEY = process.env.ADMIN_KEY ?? "aga-admin";

function requireAdmin(req: any, res: any, next: any) {
  const key =
    (req.headers["x-admin-key"] as string | undefined) ??
    (req.query["admin_key"] as string | undefined);
  if (key !== ADMIN_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// POST /surveys - submit a new survey response (public)
router.post("/surveys", async (req, res) => {
  const parsed = SubmitSurveyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  const [survey] = await db
    .insert(surveysTable)
    .values({
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

// GET /surveys - list all surveys with pagination (admin only)
router.get("/surveys", requireAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;

  const employmentType = req.query.employment_type as string | undefined;
  const hasNcd = req.query.has_ncd as string | undefined;

  // Build filter conditions
  const conditions = [];
  if (employmentType) conditions.push(eq(surveysTable.employment_type, employmentType));
  if (hasNcd) conditions.push(eq(surveysTable.has_ncd, hasNcd));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [surveys, [{ count: total }]] = await Promise.all([
    db
      .select()
      .from(surveysTable)
      .where(whereClause)
      .orderBy(desc(surveysTable.submitted_at))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(surveysTable).where(whereClause),
  ]);

  res.json({ surveys, total: Number(total), page, limit });
});

// GET /surveys/stats - aggregate statistics (admin only)
router.get("/surveys/stats", requireAdmin, async (req, res) => {
  const rows = await db.select().from(surveysTable);

  const total = rows.length;

  const breakdown = (field: keyof typeof rows[0]) => {
    const map: Record<string, number> = {};
    for (const row of rows) {
      const val = String(row[field] ?? "unknown");
      map[val] = (map[val] ?? 0) + 1;
    }
    return map;
  };

  const rateOf = (field: keyof typeof rows[0], value: string) =>
    total > 0 ? rows.filter((r) => r[field] === value).length / total : 0;

  const avgWillingness =
    total > 0
      ? rows.reduce((sum, r) => sum + parseInt(r.willing_to_use_telehealth ?? "0", 10), 0) / total
      : 0;

  res.json({
    total_responses: total,
    employment_type_breakdown: breakdown("employment_type"),
    age_group_breakdown: breakdown("age_group"),
    gender_breakdown: breakdown("gender"),
    has_ncd_breakdown: breakdown("has_ncd"),
    attends_followup_breakdown: breakdown("attends_followup"),
    has_smartphone_rate: rateOf("has_smartphone", "yes"),
    has_internet_rate: rateOf("has_internet", "yes"),
    heard_of_telehealth_rate: rateOf("heard_of_telehealth", "yes"),
    avg_willingness_score: Math.round(avgWillingness * 10) / 10,
    willing_for_followup_telecare_breakdown: breakdown("willing_for_followup_telecare"),
    willing_for_ncd_telecare_breakdown: breakdown("willing_for_ncd_telecare"),
  });
});

// GET /surveys/:id - single survey (admin only)
router.get("/surveys/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid survey ID" });
    return;
  }

  const [survey] = await db
    .select()
    .from(surveysTable)
    .where(eq(surveysTable.id, id));

  if (!survey) {
    res.status(404).json({ error: "Survey not found" });
    return;
  }

  res.json(survey);
});

export default router;
