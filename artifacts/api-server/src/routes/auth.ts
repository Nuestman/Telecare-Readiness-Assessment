import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, adminUsersTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";
import { hasAnyAdminUser } from "../lib/admin-users";

const router = Router();

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1),
});

function attachSession(
  req: Request,
  user: { id: number; email: string; name: string; role: "viewer" | "analyst" | "admin" },
) {
  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.name = user.name;
  req.session.role = user.role;
}

router.get("/auth/setup-status", async (_req, res) => {
  const registration_open = !(await hasAnyAdminUser());
  res.json({ registration_open });
});

router.post("/auth/register", async (req, res) => {
  if (await hasAnyAdminUser()) {
    res.status(403).json({ error: "Admin registration is closed" });
    return;
  }

  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password_hash = await bcrypt.hash(parsed.data.password, 12);

  const [user] = await db
    .insert(adminUsersTable)
    .values({
      email,
      password_hash,
      name: parsed.data.name,
      role: "admin",
    })
    .returning({
      id: adminUsersTable.id,
      email: adminUsersTable.email,
      name: adminUsersTable.name,
      role: adminUsersTable.role,
    });

  attachSession(req, user);
  res.status(201).json(user);
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
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  attachSession(req, user);
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
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

router.get("/auth/me", (req, res) => {
  if (!req.session.userId || !req.session.role || !req.session.email || !req.session.name) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json({
    id: req.session.userId,
    email: req.session.email,
    name: req.session.name,
    role: req.session.role,
  });
});

export default router;
