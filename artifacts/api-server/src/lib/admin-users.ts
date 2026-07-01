import { count } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";

export async function hasAnyAdminUser(): Promise<boolean> {
  const [row] = await db.select({ count: count() }).from(adminUsersTable);
  return (row?.count ?? 0) > 0;
}
