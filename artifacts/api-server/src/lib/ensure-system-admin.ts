import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import { db, systemAdminsTable } from "@workspace/db";
import { logger } from "./logger";

function bootstrapEnabled(): boolean {
  const raw = process.env.SYSTEM_ADMIN_BOOTSTRAP_ENABLED;
  if (raw === "false") return false;
  return true;
}

function bootstrapCredentials(): { email: string; password: string; name: string } | null {
  const email = (
    process.env.SYSTEM_ADMIN_EMAIL ?? process.env.INITIAL_ADMIN_EMAIL
  )
    ?.trim()
    .toLowerCase();
  const password =
    process.env.SYSTEM_ADMIN_PASSWORD ?? process.env.INITIAL_ADMIN_PASSWORD;
  const name =
    process.env.SYSTEM_ADMIN_NAME ??
    process.env.INITIAL_ADMIN_NAME ??
    "Platform Administrator";

  if (!email || !password) return null;
  return { email, password, name };
}

export async function ensureBootstrapSystemAdmin(): Promise<void> {
  if (!bootstrapEnabled()) return;

  const [row] = await db.select({ count: count() }).from(systemAdminsTable);
  if ((row?.count ?? 0) > 0) return;

  const creds = bootstrapCredentials();
  if (!creds) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SYSTEM_ADMIN_EMAIL and SYSTEM_ADMIN_PASSWORD (or INITIAL_ADMIN_*) required when system_admins is empty",
      );
    }
    logger.warn(
      "System admin bootstrap skipped — set SYSTEM_ADMIN_EMAIL/PASSWORD or INITIAL_ADMIN_EMAIL/PASSWORD",
    );
    return;
  }

  if (creds.password.length < 12) {
    throw new Error("System admin bootstrap password must be at least 12 characters");
  }

  const password_hash = await bcrypt.hash(creds.password, 12);
  await db.insert(systemAdminsTable).values({
    email: creds.email,
    password_hash,
    name: creds.name,
  });

  logger.info({ email: creds.email }, "System admin bootstrapped");
}
