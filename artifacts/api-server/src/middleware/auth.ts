import type { NextFunction, Request, Response } from "express";
import type { AdminRole } from "@workspace/db";
import { insufficientRoleMessage, ROLE_RANK } from "../lib/role-utils";
import { isStudySession, studySessionRole } from "./session-kind";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!isStudySession(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireRole(minRole: AdminRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.studyRole ?? studySessionRole(req);
    if (!isStudySession(req) || !role) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
      res.status(403).json({
        error: insufficientRoleMessage(minRole, role),
        code: "insufficient_role",
        requiredRole: minRole,
        currentRole: role,
      });
      return;
    }
    next();
  };
}
