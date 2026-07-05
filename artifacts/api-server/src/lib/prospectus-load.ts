import { count, eq } from "drizzle-orm";
import {
  db,
  prospectusApprovalsTable,
  prospectusAttachmentsTable,
  prospectusSubmissionsTable,
} from "@workspace/db";
import { toPublicProspectus } from "./prospectus-helpers";

export async function loadProspectusByPublicId(publicId: string) {
  const [row] = await db
    .select()
    .from(prospectusSubmissionsTable)
    .where(eq(prospectusSubmissionsTable.public_id, publicId))
    .limit(1);
  return row ?? null;
}

export async function loadProspectusPublic(publicId: string, includeAttachmentUrls = false) {
  const row = await loadProspectusByPublicId(publicId);
  if (!row) return null;

  const approvals = await db
    .select()
    .from(prospectusApprovalsTable)
    .where(eq(prospectusApprovalsTable.prospectus_id, row.id));

  const attachments = await db
    .select()
    .from(prospectusAttachmentsTable)
    .where(eq(prospectusAttachmentsTable.prospectus_id, row.id));

  const [{ total: attachmentCount }] = await db
    .select({ total: count() })
    .from(prospectusAttachmentsTable)
    .where(eq(prospectusAttachmentsTable.prospectus_id, row.id));

  return {
    ...toPublicProspectus(row, { approvals, attachmentCount: Number(attachmentCount) }),
    attachments: attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      mimeType: a.mime_type,
      sizeBytes: a.size_bytes,
      uploadedAt: a.uploaded_at.toISOString(),
      ...(includeAttachmentUrls ? { downloadUrl: a.blob_url } : {}),
    })),
  };
}
