import type { Study } from "@workspace/db";
import type { AdminRole } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      study?: Study;
      studyRole?: AdminRole;
    }
  }
}

export {};
