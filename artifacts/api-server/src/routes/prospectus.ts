import { Router } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  prospectusAttachmentsTable,
  prospectusApprovalsTable,
  prospectusFormTemplate,
  prospectusSubmissionsTable,
} from "@workspace/db";
import { isProspectusEditable } from "../lib/prospectus-helpers";
import { loadProspectusByPublicId, loadProspectusPublic } from "../lib/prospectus-load";
import {
  CreateProspectusBody,
  PatchProspectusBody,
  PROSPECTUS_ATTACHMENT_MIME_ALLOWLIST,
  UploadAttachmentBody,
} from "../lib/prospectus-schemas";
import {
  BlobStorageError,
  deleteProspectusAttachment as deleteBlob,
  uploadProspectusAttachment,
} from "../lib/vercel-blob";

const router = Router();

function paramPublicId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function paramAttachmentId(value: string | string[]): number {
  return Number(Array.isArray(value) ? value[0] : value);
}

function mapPatchToRow(data: ReturnType<typeof PatchProspectusBody.parse>) {
  const updates: Partial<typeof prospectusSubmissionsTable.$inferInsert> = {
    updated_at: new Date(),
  };

  if (data.submitterEmail !== undefined) updates.submitter_email = data.submitterEmail;
  if (data.submitterName !== undefined) updates.submitter_name = data.submitterName;
  if (data.title !== undefined) updates.title = data.title;
  if (data.principalInvestigator !== undefined) {
    updates.principal_investigator = data.principalInvestigator;
  }
  if (data.coInvestigators !== undefined) updates.co_investigators = data.coInvestigators;
  if (data.organization !== undefined) updates.organization = data.organization;
  if (data.department !== undefined) updates.department = data.department;
  if (data.background !== undefined) updates.background = data.background;
  if (data.researchProblem !== undefined) updates.research_problem = data.researchProblem;
  if (data.researchQuestions !== undefined) updates.research_questions = data.researchQuestions;
  if (data.aims !== undefined) updates.aims = data.aims;
  if (data.objectives !== undefined) updates.objectives = data.objectives;
  if (data.literatureOverview !== undefined) updates.literature_overview = data.literatureOverview;
  if (data.theoreticalFramework !== undefined) {
    updates.theoretical_framework = data.theoreticalFramework;
  }
  if (data.methodology !== undefined) updates.methodology = data.methodology;
  if (data.significance !== undefined) updates.significance = data.significance;
  if (data.ethicsNotes !== undefined) updates.ethics_notes = data.ethicsNotes;
  if (data.identifiableData !== undefined) updates.identifiable_data = data.identifiableData;
  if (data.ethicsReference !== undefined) updates.ethics_reference = data.ethicsReference;
  if (data.dataRetention !== undefined) updates.data_retention = data.dataRetention;
  if (data.timeline !== undefined) updates.timeline = data.timeline;
  if (data.referencesText !== undefined) updates.references_text = data.referencesText;
  if (data.proposedSlug !== undefined) {
    updates.proposed_slug = data.proposedSlug?.trim() ? data.proposedSlug.trim() : null;
  }
  if (data.studyType !== undefined) updates.study_type = data.studyType;
  if (data.studyTemplate !== undefined) updates.study_template = data.studyTemplate;
  if (data.parentProspectusId !== undefined) {
    updates.parent_prospectus_id = data.parentProspectusId;
  }
  if (data.isAmendment !== undefined) updates.is_amendment = data.isAmendment;

  return updates;
}

function validateReadyToSubmit(existing: typeof prospectusSubmissionsTable.$inferSelect): string | null {
  if (!existing.title.trim()) return "Working title is required";
  if (!existing.research_problem.trim()) return "Research problem is required";
  if (!existing.aims.trim()) return "Aims are required";
  if (!existing.significance.trim()) return "Significance is required";
  if (!existing.ethics_notes.trim()) return "Ethics notes are required";
  if (existing.research_questions.length === 0) return "At least one research question is required";
  if (!existing.methodology.design?.trim()) return "Methodology design is required";
  return null;
}

router.get("/prospectus/template", (_req, res) => {
  res.json(prospectusFormTemplate);
});

router.post("/prospectus", async (req, res) => {
  const parsed = CreateProspectusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const [row] = await db
    .insert(prospectusSubmissionsTable)
    .values({
      submitter_email: data.submitterEmail,
      submitter_name: data.submitterName,
      title: data.title ?? "",
      principal_investigator: data.principalInvestigator ?? data.submitterName,
    })
    .returning();

  const payload = await loadProspectusPublic(row.public_id);
  res.status(201).json(payload);
});

router.get("/prospectus/:publicId", async (req, res) => {
  const publicId = paramPublicId(req.params.publicId);
  const payload = await loadProspectusPublic(publicId);
  if (!payload) {
    res.status(404).json({ error: "Prospectus not found" });
    return;
  }
  res.json(payload);
});

router.patch("/prospectus/:publicId", async (req, res) => {
  const publicId = paramPublicId(req.params.publicId);
  const parsed = PatchProspectusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await loadProspectusByPublicId(publicId);
  if (!existing) {
    res.status(404).json({ error: "Prospectus not found" });
    return;
  }

  if (!isProspectusEditable(existing.status)) {
    res.status(409).json({
      error: "Prospectus cannot be edited in its current status. Submit an amendment instead.",
    });
    return;
  }

  await db
    .update(prospectusSubmissionsTable)
    .set(mapPatchToRow(parsed.data))
    .where(eq(prospectusSubmissionsTable.public_id, publicId));

  const payload = await loadProspectusPublic(publicId);
  res.json(payload);
});

router.post("/prospectus/:publicId/submit", async (req, res) => {
  const publicId = paramPublicId(req.params.publicId);
  const existing = await loadProspectusByPublicId(publicId);
  if (!existing) {
    res.status(404).json({ error: "Prospectus not found" });
    return;
  }

  if (!isProspectusEditable(existing.status)) {
    res.status(409).json({ error: "Prospectus is not in a submittable state" });
    return;
  }

  const validationError = validateReadyToSubmit(existing);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  await db
    .delete(prospectusApprovalsTable)
    .where(eq(prospectusApprovalsTable.prospectus_id, existing.id));

  await db
    .update(prospectusSubmissionsTable)
    .set({
      status: "submitted",
      submitted_at: new Date(),
      approved_at: null,
      updated_at: new Date(),
    })
    .where(eq(prospectusSubmissionsTable.public_id, publicId));

  const payload = await loadProspectusPublic(publicId);
  res.json(payload);
});

router.post("/prospectus/:publicId/withdraw", async (req, res) => {
  const publicId = paramPublicId(req.params.publicId);
  const existing = await loadProspectusByPublicId(publicId);
  if (!existing) {
    res.status(404).json({ error: "Prospectus not found" });
    return;
  }

  if (existing.status === "approved" || existing.status === "withdrawn") {
    res.status(409).json({ error: "Prospectus cannot be withdrawn in its current status" });
    return;
  }

  await db
    .update(prospectusSubmissionsTable)
    .set({ status: "withdrawn", updated_at: new Date() })
    .where(eq(prospectusSubmissionsTable.public_id, publicId));

  const payload = await loadProspectusPublic(publicId);
  res.json(payload);
});

router.get("/prospectus/:publicId/attachments", async (req, res) => {
  const publicId = paramPublicId(req.params.publicId);
  const existing = await loadProspectusByPublicId(publicId);
  if (!existing) {
    res.status(404).json({ error: "Prospectus not found" });
    return;
  }

  const attachments = await db
    .select({
      id: prospectusAttachmentsTable.id,
      filename: prospectusAttachmentsTable.filename,
      mimeType: prospectusAttachmentsTable.mime_type,
      sizeBytes: prospectusAttachmentsTable.size_bytes,
      uploadedAt: prospectusAttachmentsTable.uploaded_at,
    })
    .from(prospectusAttachmentsTable)
    .where(eq(prospectusAttachmentsTable.prospectus_id, existing.id));

  res.json({
    attachments: attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      uploadedAt: a.uploadedAt.toISOString(),
    })),
  });
});

router.post("/prospectus/:publicId/attachments", async (req, res) => {
  const publicId = paramPublicId(req.params.publicId);
  const parsed = UploadAttachmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await loadProspectusByPublicId(publicId);
  if (!existing) {
    res.status(404).json({ error: "Prospectus not found" });
    return;
  }

  if (!isProspectusEditable(existing.status)) {
    res.status(409).json({ error: "Attachments cannot be added in the current status" });
    return;
  }

  const mime = parsed.data.mimeType;
  if (
    !PROSPECTUS_ATTACHMENT_MIME_ALLOWLIST.includes(
      mime as (typeof PROSPECTUS_ATTACHMENT_MIME_ALLOWLIST)[number],
    )
  ) {
    res.status(400).json({ error: "Unsupported file type. Upload PDF or Word documents only." });
    return;
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(parsed.data.contentBase64, "base64");
  } catch {
    res.status(400).json({ error: "Invalid base64 content" });
    return;
  }

  try {
    const uploaded = await uploadProspectusAttachment(
      publicId,
      parsed.data.filename,
      buffer,
      mime,
    );

    const [attachment] = await db
      .insert(prospectusAttachmentsTable)
      .values({
        prospectus_id: existing.id,
        filename: parsed.data.filename,
        mime_type: mime,
        size_bytes: buffer.byteLength,
        blob_pathname: uploaded.pathname,
        blob_url: uploaded.url,
      })
      .returning();

    res.status(201).json({
      id: attachment.id,
      filename: attachment.filename,
      mimeType: attachment.mime_type,
      sizeBytes: attachment.size_bytes,
      uploadedAt: attachment.uploaded_at.toISOString(),
    });
  } catch (err) {
    if (err instanceof BlobStorageError) {
      res.status(503).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.delete("/prospectus/:publicId/attachments/:attachmentId", async (req, res) => {
  const publicId = paramPublicId(req.params.publicId);
  const attachmentId = paramAttachmentId(req.params.attachmentId);
  const existing = await loadProspectusByPublicId(publicId);
  if (!existing) {
    res.status(404).json({ error: "Prospectus not found" });
    return;
  }

  if (!isProspectusEditable(existing.status)) {
    res.status(409).json({ error: "Attachments cannot be removed in the current status" });
    return;
  }

  const [attachment] = await db
    .select()
    .from(prospectusAttachmentsTable)
    .where(eq(prospectusAttachmentsTable.id, attachmentId))
    .limit(1);

  if (!attachment || attachment.prospectus_id !== existing.id) {
    res.status(404).json({ error: "Attachment not found" });
    return;
  }

  try {
    await deleteBlob(attachment.blob_pathname);
  } catch (err) {
    if (err instanceof BlobStorageError) {
      res.status(503).json({ error: err.message });
      return;
    }
    throw err;
  }

  await db.delete(prospectusAttachmentsTable).where(eq(prospectusAttachmentsTable.id, attachmentId));
  res.json({ ok: true });
});

export default router;
