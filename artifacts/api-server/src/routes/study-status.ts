import { Router } from "express";
import { getCollectionStatus } from "../lib/study-window";

const router = Router();

router.get("/studies/telehealth-readiness/status", (_req, res) => {
  res.json(getCollectionStatus());
});

export default router;
