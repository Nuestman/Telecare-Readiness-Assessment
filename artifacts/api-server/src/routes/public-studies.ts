import { Router } from "express";
import { inArray } from "drizzle-orm";
import { db, studiesTable } from "@workspace/db";
import {
  getStudyCollectionStatus,
  isStudyPubliclyListed,
} from "../lib/study-collection";

const router = Router();

router.get("/studies", async (_req, res) => {
  const rows = await db
    .select()
    .from(studiesTable)
    .where(inArray(studiesTable.status, ["active", "paused"]));

  const studies = rows
    .filter(isStudyPubliclyListed)
    .map((study) => {
      const collection = getStudyCollectionStatus(study);
      return {
        slug: study.slug,
        shortTitle: study.short_title,
        fullTitle: study.full_title,
        status: study.status,
        organization: study.organization,
        estimatedMinutes: study.estimated_minutes,
        collectionOpen: collection.is_open,
        href: `/studies/${study.slug}`,
        surveyHref: `/studies/${study.slug}/survey`,
      };
    });

  res.json({ studies });
});

export default router;
