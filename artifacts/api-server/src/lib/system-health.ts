import { count } from "drizzle-orm";
import { db, studiesTable } from "@workspace/db";

type HealthStatus = "ok" | "error";
type SmokeRunStatus = "idle" | "running" | "passed" | "failed";

type SmokeRunState = {
  status: SmokeRunStatus;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;
  summary: string | null;
  output: string;
};

export type SystemHealthSnapshot = {
  checkedAt: string;
  api: {
    status: HealthStatus;
    uptimeSeconds: number;
    nodeEnv: string;
    port: string | null;
  };
  database: {
    status: HealthStatus;
    studyCount: number;
  };
  smokeTests: SmokeRunState & {
    testsAvailable: boolean;
    runner: "builtin";
  };
};

const maxOutputChars = 20000;

const smokeRun: SmokeRunState = {
  status: "idle",
  startedAt: null,
  finishedAt: null,
  exitCode: null,
  summary: null,
  output: "",
};

function appendOutput(line: string) {
  smokeRun.output = `${smokeRun.output}${line}\n`;
  if (smokeRun.output.length > maxOutputChars) {
    smokeRun.output = smokeRun.output.slice(smokeRun.output.length - maxOutputChars);
  }
}

function summarizeOutput(output: string, passed: boolean): string {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let summaryLine: string | undefined;
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (
      /Smoke checks passed\./.test(line) ||
      /^FAIL\b/.test(line) ||
      /^OK\b/.test(line) ||
      /^SKIP\b/.test(line)
    ) {
      summaryLine = line;
      break;
    }
  }
  summaryLine ??= lines[lines.length - 1] ?? "Smoke test run finished.";
  return passed ? summaryLine : `${summaryLine} (failed)`;
}

function smokeCredentials(): { email: string; password: string } | null {
  const email = (
    process.env.SYSTEM_ADMIN_EMAIL ?? process.env.INITIAL_ADMIN_EMAIL
  )
    ?.trim()
    .toLowerCase();
  const password =
    process.env.SYSTEM_ADMIN_PASSWORD ?? process.env.INITIAL_ADMIN_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

class CookieJar {
  private readonly cookies = new Map<string, string>();

  store(response: Response) {
    const setCookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [];
    for (const header of setCookies) {
      const [pair] = header.split(";");
      const eq = pair.indexOf("=");
      if (eq === -1) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      this.cookies.set(name, value);
    }
  }

  header(): string | undefined {
    if (this.cookies.size === 0) return undefined;
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

function apiBaseUrl(): string {
  const port = process.env.PORT ?? "8080";
  return `http://127.0.0.1:${port}/api`;
}

async function invokeApi(
  jar: CookieJar,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<{ status: number; body: Record<string, unknown> | null; raw: string }> {
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";
  const cookie = jar.header();
  if (cookie) headers.Cookie = cookie;

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  jar.store(response);

  const raw = await response.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    parsed = null;
  }

  return { status: response.status, body: parsed, raw };
}

function assertOk(
  name: string,
  result: { status: number; body: Record<string, unknown> | null; raw: string },
  allowed: number[] = [200],
): boolean {
  if (!allowed.includes(result.status)) {
    const detail =
      (typeof result.body?.error === "string" ? result.body.error : null) ??
      result.raw;
    appendOutput(`FAIL ${name} status=${result.status} ${detail}`);
    return false;
  }
  appendOutput(`OK   ${name} status=${result.status}`);
  return true;
}

async function runBuiltinSmokeTests(): Promise<boolean> {
  const creds = smokeCredentials();
  if (!creds) {
    appendOutput("FAIL credentials SYSTEM_ADMIN_* or INITIAL_ADMIN_* env vars required");
    return false;
  }

  const sysJar = new CookieJar();
  const studyJar = new CookieJar();
  let fail = 0;

  if (!assertOk("healthz", await invokeApi(studyJar, "GET", "/healthz"))) fail += 1;
  if (!assertOk("studies", await invokeApi(studyJar, "GET", "/studies"))) fail += 1;

  if (
    !assertOk(
      "system login",
      await invokeApi(sysJar, "POST", "/system/auth/login", creds),
    )
  ) {
    fail += 1;
  } else {
    if (!assertOk("system dashboard", await invokeApi(sysJar, "GET", "/system/dashboard"))) {
      fail += 1;
    }
    if (!assertOk("system health", await invokeApi(sysJar, "GET", "/system/health"))) {
      fail += 1;
    }
  }

  const studyLogin = await invokeApi(studyJar, "POST", "/auth/login", creds);
  if (studyLogin.status === 200) {
    appendOutput("OK   study login status=200");
    if (!assertOk("auth/me", await invokeApi(studyJar, "GET", "/auth/me"))) fail += 1;
    if (
      !assertOk(
        "study surveys",
        await invokeApi(studyJar, "GET", "/studies/telehealth-readiness/surveys"),
      )
    ) {
      fail += 1;
    }
  } else {
    appendOutput(`SKIP study login status=${studyLogin.status}`);
  }

  if (fail > 0) return false;
  appendOutput("Smoke checks passed.");
  return true;
}

export async function getSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  const [studyRow] = await db.select({ count: count() }).from(studiesTable);

  return {
    checkedAt: new Date().toISOString(),
    api: {
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      nodeEnv: process.env.NODE_ENV ?? "development",
      port: process.env.PORT ?? null,
    },
    database: {
      status: "ok",
      studyCount: Number(studyRow?.count ?? 0),
    },
    smokeTests: {
      ...smokeRun,
      testsAvailable: true,
      runner: "builtin",
    },
  };
}

export async function runSystemSmokeTests(): Promise<SystemHealthSnapshot> {
  if (smokeRun.status === "running") {
    throw new Error("Smoke tests are already running");
  }

  smokeRun.status = "running";
  smokeRun.startedAt = new Date().toISOString();
  smokeRun.finishedAt = null;
  smokeRun.exitCode = null;
  smokeRun.summary = "Smoke test run started.";
  smokeRun.output = "";

  void (async () => {
    try {
      const passed = await runBuiltinSmokeTests();
      smokeRun.finishedAt = new Date().toISOString();
      smokeRun.exitCode = passed ? 0 : 1;
      smokeRun.status = passed ? "passed" : "failed";
      smokeRun.summary = summarizeOutput(smokeRun.output, passed);
    } catch (error) {
      smokeRun.finishedAt = new Date().toISOString();
      smokeRun.exitCode = 1;
      smokeRun.status = "failed";
      appendOutput(error instanceof Error ? error.message : "Smoke test run failed");
      smokeRun.summary = summarizeOutput(smokeRun.output, false);
    }
  })();

  return getSystemHealthSnapshot();
}
