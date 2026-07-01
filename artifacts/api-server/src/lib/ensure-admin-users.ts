import { asc, count, eq } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";
import { logger } from "./logger";

/**
 * After adding account approval, existing deployments may have every user stuck
 * in `pending` with nobody able to sign in. Recover by approving one bootstrap
 * admin when no approved accounts exist.
 */
export async function ensureBootstrapAdminApproved(): Promise<void> {
  const [approvedRow] = await db
    .select({ count: count() })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.status, "approved"));

  if ((approvedRow?.count ?? 0) > 0) {
    return;
  }

  const [totalRow] = await db.select({ count: count() }).from(adminUsersTable);
  if ((totalRow?.count ?? 0) === 0) {
    return;
  }

  const [adminCandidate] = await db
    .select({ id: adminUsersTable.id, email: adminUsersTable.email })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.role, "admin"))
    .orderBy(asc(adminUsersTable.created_at))
    .limit(1);

  let fallback = adminCandidate;
  if (!fallback) {
    [fallback] = await db
      .select({ id: adminUsersTable.id, email: adminUsersTable.email })
      .from(adminUsersTable)
      .orderBy(asc(adminUsersTable.created_at))
      .limit(1);
  }

  if (!fallback) {
    return;
  }

  await db
    .update(adminUsersTable)
    .set({ status: "approved", role: "admin" })
    .where(eq(adminUsersTable.id, fallback.id));

  logger.warn(
    { userId: fallback.id, email: fallback.email },
    "No approved admin users found; auto-approved bootstrap account for migration recovery",
  );
}
