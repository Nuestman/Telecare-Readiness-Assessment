import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, studiesTable, TELEHEALTH_STUDY_SLUG } from "@workspace/db";
import { resolveStudy } from "../middleware/study-access";
import { getStudyCollectionStatus } from "../lib/study-collection";

const router = Router({ mergeParams: true });

router.get("/status", resolveStudy, (req, res) => {
  if (!req.study) {
    res.status(404).json({ error: "Study not found" });
    return;
  }
  res.json(getStudyCollectionStatus(req.study));
});

export const legacyStudyStatusRouter = Router();
legacyStudyStatusRouter.get("/studies/telehealth-readiness/status", async (_req, res) => {
  const [study] = await db
    .select()
    .from(studiesTable)
    .where(eq(studiesTable.slug, TELEHEALTH_STUDY_SLUG))
    .limit(1);
  if (!study) {
    res.status(404).json({ error: "Study not found" });
    return;
  }
  res.json(getStudyCollectionStatus(study));
});

export default router;
