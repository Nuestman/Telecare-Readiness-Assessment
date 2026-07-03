import { Router } from "express";
import { requireSystemAuth } from "../middleware/system-auth";
import {
  getSystemHealthSnapshot,
  runSystemSmokeTests,
} from "../lib/system-health";

const router = Router();

router.get("/system/health", requireSystemAuth, async (_req, res) => {
  const snapshot = await getSystemHealthSnapshot();
  res.json(snapshot);
});

router.post("/system/health/run-tests", requireSystemAuth, async (_req, res) => {
  try {
    const snapshot = await runSystemSmokeTests();
    res.status(202).json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start smoke tests";
    const statusCode = message === "Smoke tests are already running" ? 409 : 500;
    res.status(statusCode).json({ error: message });
  }
});

export default router;
