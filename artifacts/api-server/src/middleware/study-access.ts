import type { NextFunction, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, adminUserStudyAccessTable, studiesTable, TELEHEALTH_STUDY_SLUG } from "@workspace/db";
import type { AdminRole } from "@workspace/db";
import { insufficientRoleMessage, ROLE_RANK } from "../lib/role-utils";
import { isStudySession } from "./session-kind";

export async function resolveStudy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const slug = req.params.studySlug ?? req.params.slug;
  if (!slug || typeof slug !== "string") {
    res.status(400).json({ error: "Study slug required" });
    return;
  }

  const [study] = await db
    .select()
    .from(studiesTable)
    .where(eq(studiesTable.slug, slug))
    .limit(1);

  if (!study) {
    res.status(404).json({ error: "Study not found" });
    return;
  }

  req.study = study;
  next();
}

export function requireStudyAccess(minRole: AdminRole = "viewer") {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!isStudySession(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = req.session.userId!;

    const slug =
      req.study?.slug ??
      (typeof req.params.studySlug === "string" ? req.params.studySlug : undefined) ??
      TELEHEALTH_STUDY_SLUG;

    const [access] = await db
      .select({
        role: adminUserStudyAccessTable.role,
      })
      .from(adminUserStudyAccessTable)
      .where(
        and(
          eq(adminUserStudyAccessTable.admin_user_id, userId),
          eq(adminUserStudyAccessTable.study_slug, slug),
        ),
      )
      .limit(1);

    if (!access) {
      res.status(403).json({ error: "You do not have access to this study" });
      return;
    }

    if (ROLE_RANK[access.role] < ROLE_RANK[minRole]) {
      res.status(403).json({
        error: insufficientRoleMessage(minRole, access.role),
        code: "insufficient_role",
        requiredRole: minRole,
        currentRole: access.role,
      });
      return;
    }

    req.studyRole = access.role;
    next();
  };
}

export async function loadStudyAccessForUser(userId: number) {
  return db
    .select({
      slug: adminUserStudyAccessTable.study_slug,
      role: adminUserStudyAccessTable.role,
    })
    .from(adminUserStudyAccessTable)
    .where(eq(adminUserStudyAccessTable.admin_user_id, userId));
}
