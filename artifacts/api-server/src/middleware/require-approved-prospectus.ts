import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db, prospectusSubmissionsTable, studiesTable } from "@workspace/db";

/**
 * Blocks survey submission when the study is not prospectus-exempt and lacks dual approval.
 */
export async function requireApprovedProspectus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const study = req.study;
  if (!study) {
    res.status(500).json({ error: "Study context missing" });
    return;
  }

  if (study.prospectus_exempt) {
    next();
    return;
  }

  if (!study.prospectus_id) {
    res.status(403).json({
      error: "Survey collection is not available until an approved prospectus is linked to this study.",
    });
    return;
  }

  const [prospectus] = await db
    .select({ status: prospectusSubmissionsTable.status })
    .from(prospectusSubmissionsTable)
    .where(eq(prospectusSubmissionsTable.id, study.prospectus_id))
    .limit(1);

  if (!prospectus || prospectus.status !== "approved") {
    res.status(403).json({
      error: "Survey collection is not available until the research prospectus is fully approved.",
    });
    return;
  }

  next();
}

export async function assertStudyMayActivate(
  study: typeof studiesTable.$inferSelect,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (study.prospectus_exempt) {
    return { ok: true };
  }

  if (!study.prospectus_id) {
    return {
      ok: false,
      error: "Cannot activate study without an approved prospectus (or prospectus_exempt flag).",
    };
  }

  const [prospectus] = await db
    .select({ status: prospectusSubmissionsTable.status })
    .from(prospectusSubmissionsTable)
    .where(eq(prospectusSubmissionsTable.id, study.prospectus_id))
    .limit(1);

  if (!prospectus || prospectus.status !== "approved") {
    return {
      ok: false,
      error: "Linked prospectus must be fully approved (research leadership + platform ops) before activation.",
    };
  }

  return { ok: true };
}
