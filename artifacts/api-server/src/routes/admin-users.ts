import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, adminUsersTable } from "@workspace/db";
import { requireRole } from "../middleware/auth";

const router = Router();

const CreateUserBody = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1, "Name is required"),
  role: z.enum(["viewer", "analyst", "admin"]).default("viewer"),
  status: z.enum(["pending", "approved", "rejected"]).default("approved"),
});

const UpdateUserBody = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  role: z.enum(["viewer", "analyst", "admin"]).optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  return first?.message ?? "Invalid request";
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}

function toPublicUser(user: {
  id: number;
  email: string;
  name: string;
  role: "viewer" | "analyst" | "admin";
  status: "pending" | "approved" | "rejected";
  created_at: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    created_at: user.created_at.toISOString(),
  };
}

function parseUserId(raw: string | string[]): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

router.get("/auth/admin/users", requireRole("admin"), async (req, res) => {
  try {
    const users = await db
      .select({
        id: adminUsersTable.id,
        email: adminUsersTable.email,
        name: adminUsersTable.name,
        role: adminUsersTable.role,
        status: adminUsersTable.status,
        created_at: adminUsersTable.created_at,
      })
      .from(adminUsersTable)
      .orderBy(desc(adminUsersTable.created_at));

    req.log.info({ count: users.length, actorId: req.session.userId }, "Listed admin users");

    res.json({
      users: users.map(toPublicUser),
      total: users.length,
    });
  } catch (err) {
    req.log.error({ err, actorId: req.session.userId }, "Failed to list admin users");
    res.status(500).json({ error: "Failed to load users" });
  }
});

router.post("/auth/admin/users", requireRole("admin"), async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn(
      { actorId: req.session.userId, issues: parsed.error.issues },
      "Create admin user validation failed",
    );
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password_hash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const [user] = await db
      .insert(adminUsersTable)
      .values({
        email,
        password_hash,
        name: parsed.data.name,
        role: parsed.data.role,
        status: parsed.data.status,
      })
      .returning({
        id: adminUsersTable.id,
        email: adminUsersTable.email,
        name: adminUsersTable.name,
        role: adminUsersTable.role,
        status: adminUsersTable.status,
        created_at: adminUsersTable.created_at,
      });

    req.log.info(
      { actorId: req.session.userId, userId: user.id, email: user.email, role: user.role, status: user.status },
      "Created admin user",
    );

    res.status(201).json(toPublicUser(user));
  } catch (err) {
    if (isUniqueViolation(err)) {
      req.log.warn({ actorId: req.session.userId, email }, "Create admin user duplicate email");
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    req.log.error({ err, actorId: req.session.userId, email }, "Failed to create admin user");
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.patch("/auth/admin/users/:id", requireRole("admin"), async (req, res) => {
  const id = parseUserId(req.params.id);
  if (id === null) {
    req.log.warn({ actorId: req.session.userId, rawId: req.params.id }, "Update admin user invalid id");
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn(
      { actorId: req.session.userId, userId: id, issues: parsed.error.issues },
      "Update admin user validation failed",
    );
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.password !== undefined) {
    updates.password_hash = await bcrypt.hash(parsed.data.password, 12);
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  try {
    const [user] = await db
      .update(adminUsersTable)
      .set(updates)
      .where(eq(adminUsersTable.id, id))
      .returning({
        id: adminUsersTable.id,
        email: adminUsersTable.email,
        name: adminUsersTable.name,
        role: adminUsersTable.role,
        status: adminUsersTable.status,
        created_at: adminUsersTable.created_at,
      });

    if (!user) {
      req.log.warn({ actorId: req.session.userId, userId: id }, "Update admin user not found");
      res.status(404).json({ error: "User not found" });
      return;
    }

    req.log.info(
      { actorId: req.session.userId, userId: user.id, updates: Object.keys(updates) },
      "Updated admin user",
    );

    res.json(toPublicUser(user));
  } catch (err) {
    req.log.error({ err, actorId: req.session.userId, userId: id }, "Failed to update admin user");
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/auth/admin/users/:id", requireRole("admin"), async (req: Request, res) => {
  const id = parseUserId(req.params.id);
  if (id === null) {
    req.log.warn({ actorId: req.session.userId, rawId: req.params.id }, "Delete admin user invalid id");
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  if (req.session.userId === id) {
    req.log.warn({ actorId: req.session.userId, userId: id }, "Delete admin user blocked self-delete");
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }

  try {
    const [deleted] = await db
      .delete(adminUsersTable)
      .where(eq(adminUsersTable.id, id))
      .returning({ id: adminUsersTable.id, email: adminUsersTable.email });

    if (!deleted) {
      req.log.warn({ actorId: req.session.userId, userId: id }, "Delete admin user not found");
      res.status(404).json({ error: "User not found" });
      return;
    }

    req.log.info(
      { actorId: req.session.userId, userId: deleted.id, email: deleted.email },
      "Deleted admin user",
    );

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err, actorId: req.session.userId, userId: id }, "Failed to delete admin user");
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
