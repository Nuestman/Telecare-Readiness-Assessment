import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminUsersRouter from "./admin-users";
import studyStatusRouter, { legacyStudyStatusRouter } from "./study-status";
import surveysRouter from "./surveys";
import clinicianSurveysRouter from "./clinician-surveys";
import publicStudiesRouter from "./public-studies";
import systemAuthRouter from "./system-auth";
import systemHealthRouter from "./system-health";
import systemStudiesRouter from "./system-studies";
import prospectusRouter from "./prospectus";
import systemProspectusRouter from "./system-prospectus";
import { resolveStudy } from "../middleware/study-access";
import {
  db,
  studiesTable,
  TELEHEALTH_STUDY_SLUG,
  CLINICIAN_TELEHEALTH_STUDY_SLUG,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicStudiesRouter);
router.use(systemAuthRouter);
router.use(systemHealthRouter);
router.use(systemStudiesRouter);
router.use(prospectusRouter);
router.use(systemProspectusRouter);
router.use(authRouter);
router.use(adminUsersRouter);
router.use(legacyStudyStatusRouter);

// Study-scoped routes
router.use("/studies/:studySlug", resolveStudy, studyStatusRouter);

router.use(
  "/studies/:studySlug",
  resolveStudy,
  (req, res, next) => {
    const slug = req.params.studySlug;
    if (slug === TELEHEALTH_STUDY_SLUG) {
      surveysRouter(req, res, next);
      return;
    }
    if (slug === CLINICIAN_TELEHEALTH_STUDY_SLUG) {
      clinicianSurveysRouter(req, res, next);
      return;
    }
    res.status(404).json({ error: "Study survey API not available for this study" });
  },
);

// Legacy aliases (deprecated) — inject telehealth study context
const legacyTelehealth = Router();
legacyTelehealth.use(async (req, _res, next) => {
  if (!req.study) {
    const [study] = await db
      .select()
      .from(studiesTable)
      .where(eq(studiesTable.slug, TELEHEALTH_STUDY_SLUG))
      .limit(1);
    if (study) req.study = study;
  }
  next();
});
legacyTelehealth.use(surveysRouter);
router.use("/studies/telehealth-readiness", legacyTelehealth);
router.use(legacyTelehealth);

export default router;
