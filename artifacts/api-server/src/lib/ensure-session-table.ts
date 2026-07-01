import { pool } from "@workspace/db";
import { logger } from "./logger";

const SESSION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
`;

export async function ensureSessionTable(): Promise<void> {
  await pool.query(SESSION_TABLE_SQL);
  logger.info("Session store table ready");
}
