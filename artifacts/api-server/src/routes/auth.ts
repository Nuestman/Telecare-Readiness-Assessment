import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  adminUsersTable,
  adminUserStudyAccessTable,
  TELEHEALTH_STUDY_SLUG,
} from "@workspace/db";
import { isStudySession } from "../middleware/session-kind";
import { requireAuth } from "../middleware/auth";
import { loadStudyAccessForUser } from "../middleware/study-access";

const router = Router();

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1),
  studySlug: z.string().optional(),
});

function attachSession(
  req: Request,
  user: {
    id: number;
    email: string;
    name: string;
    role: "viewer" | "analyst" | "admin";
    status: "pending" | "approved" | "rejected";
  },
) {
  req.session.sessionKind = "study";
  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.name = user.name;
  req.session.role = user.role;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}

function publicUser(user: {
  id: number;
  email: string;
  name: string;
  role: "viewer" | "analyst" | "admin";
  status: "pending" | "approved" | "rejected";
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };
}

async function countApprovedAdmins(): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.status, "approved"));
  return row?.count ?? 0;
}

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password_hash = await bcrypt.hash(parsed.data.password, 12);
  const isFirstUser = (await countApprovedAdmins()) === 0;
  const studySlug = parsed.data.studySlug ?? TELEHEALTH_STUDY_SLUG;

  try {
    const [user] = await db
      .insert(adminUsersTable)
      .values({
        email,
        password_hash,
        name: parsed.data.name,
        role: isFirstUser ? "admin" : "viewer",
        status: isFirstUser ? "approved" : "pending",
      })
      .returning({
        id: adminUsersTable.id,
        email: adminUsersTable.email,
        name: adminUsersTable.name,
        role: adminUsersTable.role,
        status: adminUsersTable.status,
      });

    if (isFirstUser || studySlug) {
      await db
        .insert(adminUserStudyAccessTable)
        .values({
          admin_user_id: user.id,
          study_slug: isFirstUser ? TELEHEALTH_STUDY_SLUG : studySlug,
          role: user.role,
        })
        .onConflictDoNothing();
    }

    if (user.status === "approved") {
      attachSession(req, user);
    }

    res.status(201).json({
      ...publicUser(user),
      studySlug,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    throw err;
  }
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.email, email))
    .limit(1);

  if (!user) {
    req.log.info({ email }, "Login failed: unknown email");
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password_hash);
  if (!valid) {
    req.log.info({ email, userId: user.id }, "Login failed: invalid password");
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.status === "pending") {
    req.log.info({ email, userId: user.id }, "Login blocked: account pending approval");
    res.status(403).json({ error: "Your account is pending approval. Contact an administrator." });
    return;
  }

  if (user.status === "rejected") {
    req.log.info({ email, userId: user.id }, "Login blocked: account rejected");
    res.status(403).json({ error: "Your account was not approved. Contact an administrator." });
    return;
  }

  attachSession(req, user);
  if (!req.session.sessionKind) {
    req.session.sessionKind = "study";
  }
  req.log.info({ email, userId: user.id, role: user.role }, "Login succeeded");
  res.json(publicUser(user));
});

router.post("/auth/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to log out" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", async (req, res) => {
  if (!isStudySession(req) || !req.session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select({
      id: adminUsersTable.id,
      email: adminUsersTable.email,
      name: adminUsersTable.name,
      role: adminUsersTable.role,
      status: adminUsersTable.status,
    })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, req.session.userId))
    .limit(1);

  if (!user || user.status !== "approved") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const studyAccess = await loadStudyAccessForUser(user.id);

  res.json({
    ...publicUser(user),
    studyAccess,
  });
});

export default router;
