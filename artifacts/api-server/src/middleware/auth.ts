import type { NextFunction, Request, Response } from "express";
import type { AdminRole } from "@workspace/db";

const ROLE_RANK: Record<AdminRole, number> = {
  viewer: 1,
  analyst: 2,
  admin: 3,
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || !req.session.role) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireRole(minRole: AdminRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId || !req.session.role) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (ROLE_RANK[req.session.role] < ROLE_RANK[minRole]) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
