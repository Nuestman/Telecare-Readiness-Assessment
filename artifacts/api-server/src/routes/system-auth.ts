import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, systemAdminsTable } from "@workspace/db";
import { requireSystemAuth } from "../middleware/system-auth";

const router = Router();

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function attachSystemSession(
  req: Request,
  user: { id: number; email: string; name: string },
) {
  req.session.sessionKind = "system";
  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.name = user.name;
  req.session.role = "system_admin";
}

router.post("/system/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(systemAdminsTable)
    .where(eq(systemAdminsTable.email, email))
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

  await db
    .update(systemAdminsTable)
    .set({ last_login_at: new Date() })
    .where(eq(systemAdminsTable.id, user.id));

  attachSystemSession(req, user);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at.toISOString(),
    },
  });
});

router.post("/system/auth/logout", requireSystemAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to log out" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/system/auth/me", requireSystemAuth, async (req, res) => {
  const [user] = await db
    .select({
      id: systemAdminsTable.id,
      email: systemAdminsTable.email,
      name: systemAdminsTable.name,
      created_at: systemAdminsTable.created_at,
    })
    .from(systemAdminsTable)
    .where(eq(systemAdminsTable.id, req.session.userId!))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at.toISOString(),
    },
  });
});

export default router;
