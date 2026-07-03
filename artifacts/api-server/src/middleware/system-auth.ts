import type { NextFunction, Request, Response } from "express";

export function requireSystemAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session.sessionKind !== "system" || !req.session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
