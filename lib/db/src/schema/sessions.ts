import { index, json, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/** express-session store table (connect-pg-simple). */
export const sessionTable = pgTable(
  "session",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire", { precision: 6, mode: "date" }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);
