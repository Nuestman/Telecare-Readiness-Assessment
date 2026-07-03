import type { Request } from "express";
import type { AdminRole } from "@workspace/db";

/** Legacy sessions created before platform work may omit sessionKind. */
export function isStudySession(req: Request): boolean {
  if (req.session.sessionKind === "system") return false;
  if (req.session.sessionKind === "study") {
    return !!req.session.userId && !!req.session.role;
  }
  return (
    !!req.session.userId &&
    !!req.session.role &&
    req.session.role !== "system_admin"
  );
}

export function isSystemSession(req: Request): boolean {
  return req.session.sessionKind === "system" && !!req.session.userId;
}

export function studySessionRole(req: Request): AdminRole | null {
  if (!isStudySession(req)) return null;
  const role = req.session.role;
  if (!role || role === "system_admin") return null;
  return role;
}
