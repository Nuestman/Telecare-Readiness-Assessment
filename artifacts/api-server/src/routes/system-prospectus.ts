import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  prospectusApprovalsTable,
  prospectusReviewsTable,
  prospectusSubmissionsTable,
  studiesTable,
  type StudyStatus,
} from "@workspace/db";
import { requireSystemAuth } from "../middleware/system-auth";
import {
  computeProspectusStatusAfterApproval,
  responsesTableFromSlug,
  slugFromProposed,
} from "../lib/prospectus-helpers";
import { loadProspectusPublic } from "../lib/prospectus-load";
import {
  ProspectusApprovalBody,
  ProspectusReviewBody,
  ProvisionStudyBody,
} from "../lib/prospectus-schemas";

const router = Router();

function paramId(value: string | string[]): number {
  return Number(Array.isArray(value) ? value[0] : value);
}

async function loadProspectusById(id: number) {
  const [row] = await db
    .select()
    .from(prospectusSubmissionsTable)
    .where(eq(prospectusSubmissionsTable.id, id))
    .limit(1);
  return row ?? null;
}

async function loadProspectusDetail(id: number) {
  const row = await loadProspectusById(id);
  if (!row) return null;

  const reviews = await db
    .select()
    .from(prospectusReviewsTable)
    .where(eq(prospectusReviewsTable.prospectus_id, id))
    .orderBy(desc(prospectusReviewsTable.created_at));

  const prospectus = await loadProspectusPublic(row.public_id, true);
  if (!prospectus) return null;

  return {
    prospectus,
    reviews: reviews.map((r) => ({
      id: r.id,
      decision: r.decision,
      comments: r.is_internal ? null : r.comments,
      isInternal: r.is_internal,
      createdAt: r.created_at.toISOString(),
    })),
  };
}

router.get("/system/prospectus", requireSystemAuth, async (req, res) => {
  const statusFilter = typeof req.query.status === "string" ? req.query.status : undefined;

  const rows = statusFilter
    ? await db
        .select()
        .from(prospectusSubmissionsTable)
        .where(eq(prospectusSubmissionsTable.status, statusFilter as never))
        .orderBy(desc(prospectusSubmissionsTable.updated_at))
    : await db
        .select()
        .from(prospectusSubmissionsTable)
        .orderBy(desc(prospectusSubmissionsTable.updated_at));

  res.json({
    prospectuses: rows.map((row) => ({
      id: row.id,
      publicId: row.public_id,
      status: row.status,
      title: row.title,
      submitterName: row.submitter_name,
      submitterEmail: row.submitter_email,
      principalInvestigator: row.principal_investigator,
      proposedSlug: row.proposed_slug,
      linkedStudySlug: row.linked_study_slug,
      submittedAt: row.submitted_at?.toISOString() ?? null,
      updatedAt: row.updated_at.toISOString(),
    })),
  });
});

router.get("/system/prospectus/:id", requireSystemAuth, async (req, res) => {
  const id = paramId(req.params.id);
  const detail = await loadProspectusDetail(id);
  if (!detail) {
    res.status(404).json({ error: "Prospectus not found" });
    return;
  }
  res.json(detail);
});

router.post("/system/prospectus/:id/reviews", requireSystemAuth, async (req, res) => {
  const id = paramId(req.params.id);
  const parsed = ProspectusReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await loadProspectusById(id);
  if (!existing) {
    res.status(404).json({ error: "Prospectus not found" });
    return;
  }

  if (!["submitted", "under_review", "revision_requested"].includes(existing.status)) {
    res.status(409).json({ error: "Prospectus is not open for review" });
    return;
  }

  const adminId = req.session.userId;
  if (!adminId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await db.insert(prospectusReviewsTable).values({
    prospectus_id: id,
    reviewer_system_admin_id: adminId,
    decision: parsed.data.decision,
    comments: parsed.data.comments,
    is_internal: parsed.data.isInternal ?? false,
  });

  const nextStatus =
    parsed.data.decision === "revision_requested" ? "revision_requested" : "under_review";

  await db
    .update(prospectusSubmissionsTable)
    .set({ status: nextStatus, updated_at: new Date() })
    .where(eq(prospectusSubmissionsTable.id, id));

  const detail = await loadProspectusDetail(id);
  res.status(201).json(detail);
});

router.post("/system/prospectus/:id/approve", requireSystemAuth, async (req, res) => {
  const id = paramId(req.params.id);
  const parsed = ProspectusApprovalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await loadProspectusById(id);
  if (!existing) {
    res.status(404).json({ error: "Prospectus not found" });
    return;
  }

  if (!["submitted", "under_review", "revision_requested"].includes(existing.status)) {
    res.status(409).json({ error: "Prospectus is not open for approval decisions" });
    return;
  }

  const adminId = req.session.userId;
  if (!adminId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await db
    .insert(prospectusApprovalsTable)
    .values({
      prospectus_id: id,
      approval_role: parsed.data.approvalRole,
      system_admin_id: adminId,
      decision: parsed.data.decision,
      comments: parsed.data.comments ?? "",
    })
    .onConflictDoUpdate({
      target: [prospectusApprovalsTable.prospectus_id, prospectusApprovalsTable.approval_role],
      set: {
        system_admin_id: adminId,
        decision: parsed.data.decision,
        comments: parsed.data.comments ?? "",
        created_at: new Date(),
      },
    });

  const approvals = await db
    .select()
    .from(prospectusApprovalsTable)
    .where(eq(prospectusApprovalsTable.prospectus_id, id));

  const nextStatus = computeProspectusStatusAfterApproval(approvals);
  const approvedAt = nextStatus === "approved" ? new Date() : null;

  await db
    .update(prospectusSubmissionsTable)
    .set({
      status: nextStatus,
      approved_at: approvedAt,
      updated_at: new Date(),
    })
    .where(eq(prospectusSubmissionsTable.id, id));

  const detail = await loadProspectusDetail(id);
  res.json(detail);
});

router.post("/system/prospectus/:id/provision-study", requireSystemAuth, async (req, res) => {
  const id = paramId(req.params.id);
  const parsed = ProvisionStudyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await loadProspectusById(id);
  if (!existing) {
    res.status(404).json({ error: "Prospectus not found" });
    return;
  }

  if (existing.status !== "approved") {
    res.status(409).json({
      error: "Study can only be provisioned after dual approval (research leadership + platform ops).",
    });
    return;
  }

  if (existing.linked_study_slug) {
    res.status(409).json({ error: "A study is already linked to this prospectus" });
    return;
  }

  const slug = parsed.data.slug ?? slugFromProposed(existing.proposed_slug, existing.id);
  const responsesTable = parsed.data.responsesTable ?? responsesTableFromSlug(slug);
  const shortTitle = (parsed.data.shortTitle ?? existing.title.slice(0, 120)) || slug;

  try {
    const [study] = await db
      .insert(studiesTable)
      .values({
        slug,
        responses_table: responsesTable,
        short_title: shortTitle,
        full_title: existing.title,
        organization: existing.organization,
        principal_investigator: existing.principal_investigator,
        ethics_reference: existing.ethics_reference,
        data_retention: existing.data_retention,
        status: "draft" as StudyStatus,
        prospectus_id: existing.id,
        prospectus_exempt: false,
      })
      .returning();

    await db
      .update(prospectusSubmissionsTable)
      .set({ linked_study_slug: slug, updated_at: new Date() })
      .where(eq(prospectusSubmissionsTable.id, id));

    res.status(201).json({
      slug: study.slug,
      prospectusId: existing.id,
      message: "Study registry row created in draft status. IT must deploy the study artifact before activation.",
    });
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
      res.status(409).json({ error: "Study slug or responses table already exists" });
      return;
    }
    throw err;
  }
});

export default router;
