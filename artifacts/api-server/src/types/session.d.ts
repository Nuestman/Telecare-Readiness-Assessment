import type { AdminRole } from "@workspace/db";

declare module "express-session" {
  interface SessionData {
    sessionKind?: "study" | "system";
    userId?: number;
    email?: string;
    name?: string;
    role?: AdminRole | "system_admin";
  }
}

export {};
