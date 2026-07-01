import type { AdminRole } from "@workspace/db";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    email?: string;
    name?: string;
    role?: AdminRole;
  }
}

export {};
