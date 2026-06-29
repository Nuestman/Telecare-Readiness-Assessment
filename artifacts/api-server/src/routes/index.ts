import { Router, type IRouter } from "express";
import healthRouter from "./health";
import surveysRouter from "./surveys";

const router: IRouter = Router();

router.use(healthRouter);
router.use(surveysRouter);

export default router;
