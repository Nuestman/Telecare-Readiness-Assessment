import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Load repo-root `.env` into process.env (same rules as drizzle.config.ts). */
export function loadRootEnv(): void {
  const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(scriptsDir, "../../..");
  const envPath = path.resolve(root, ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();

    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }

    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}
