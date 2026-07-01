import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminUsersRouter from "./admin-users";
import studyStatusRouter from "./study-status";
import surveysRouter from "./surveys";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminUsersRouter);
router.use(studyStatusRouter);

// Canonical study namespace
router.use("/studies/telehealth-readiness", surveysRouter);

// Legacy aliases (deprecated — remove when research hub ships)
router.use(surveysRouter);

export default router;
