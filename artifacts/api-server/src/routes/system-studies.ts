import { Router } from "express";
import { count, eq, and } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  studiesTable,
  adminUsersTable,
  adminUserStudyAccessTable,
  telehealthReadinessSurveysTable,
  type StudyStatus,
} from "@workspace/db";
import { requireSystemAuth } from "../middleware/system-auth";
import { getStudyCollectionStatus } from "../lib/study-collection";

const router = Router();

const studyStatusSchema = z.enum(["draft", "active", "paused", "closed", "archived"]);

const CreateStudyBody = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(64),
  responses_table: z.string().min(1),
  short_title: z.string().min(1),
  full_title: z.string().min(1),
  organization: z.string().min(1).optional(),
  location: z.string().optional(),
  principal_investigator: z.string().optional(),
  ethics_reference: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  data_retention: z.string().optional(),
  estimated_minutes: z.string().optional(),
  status: studyStatusSchema.optional(),
  opens_at: z.string().datetime().nullable().optional(),
  closes_at: z.string().datetime().nullable().optional(),
});

const PatchStudyBody = CreateStudyBody.partial().omit({ slug: true, responses_table: true });

const GrantAccessBody = z.object({
  admin_user_id: z.number().int().positive(),
  role: z.enum(["viewer", "analyst", "admin"]),
});

function toPublicStudy(study: typeof studiesTable.$inferSelect) {
  const collection = getStudyCollectionStatus(study);
  return {
    slug: study.slug,
    responsesTable: study.responses_table,
    shortTitle: study.short_title,
    fullTitle: study.full_title,
    organization: study.organization,
    location: study.location,
    principalInvestigator: study.principal_investigator,
    ethicsReference: study.ethics_reference,
    contactEmail: study.contact_email,
    contactPhone: study.contact_phone,
    dataRetention: study.data_retention,
    estimatedMinutes: study.estimated_minutes,
    status: study.status,
    opensAt: study.opens_at?.toISOString() ?? null,
    closesAt: study.closes_at?.toISOString() ?? null,
    collectionOpen: collection.is_open,
    createdAt: study.created_at.toISOString(),
    updatedAt: study.updated_at.toISOString(),
  };
}

router.get("/system/dashboard", requireSystemAuth, async (_req, res) => {
  const allStudies = await db.select().from(studiesTable);
  const activeStudies = allStudies.filter((s) => s.status === "active").length;

  const [{ total: telehealthCount }] = await db
    .select({ total: count() })
    .from(telehealthReadinessSurveysTable);

  res.json({
    studyCount: allStudies.length,
    activeStudies,
    totalResponses: Number(telehealthCount),
    responsesByStudy: [
      { slug: "telehealth-readiness", count: Number(telehealthCount) },
    ],
  });
});

router.get("/system/studies", requireSystemAuth, async (_req, res) => {
  const rows = await db.select().from(studiesTable);
  res.json({ studies: rows.map(toPublicStudy) });
});

router.post("/system/studies", requireSystemAuth, async (req, res) => {
  const parsed = CreateStudyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  try {
    const [study] = await db
      .insert(studiesTable)
      .values({
        slug: data.slug,
        responses_table: data.responses_table,
        short_title: data.short_title,
        full_title: data.full_title,
        organization: data.organization,
        location: data.location,
        principal_investigator: data.principal_investigator,
        ethics_reference: data.ethics_reference,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone,
        data_retention: data.data_retention,
        estimated_minutes: data.estimated_minutes,
        status: (data.status ?? "draft") as StudyStatus,
        opens_at: data.opens_at ? new Date(data.opens_at) : null,
        closes_at: data.closes_at ? new Date(data.closes_at) : null,
      })
      .returning();

    res.status(201).json(toPublicStudy(study));
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
      res.status(409).json({ error: "Study slug or responses table already exists" });
      return;
    }
    throw err;
  }
});

function paramString(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

router.get("/system/studies/:slug", requireSystemAuth, async (req, res) => {
  const slug = paramString(req.params.slug);
  const [study] = await db
    .select()
    .from(studiesTable)
    .where(eq(studiesTable.slug, slug))
    .limit(1);

  if (!study) {
    res.status(404).json({ error: "Study not found" });
    return;
  }

  res.json(toPublicStudy(study));
});

router.patch("/system/studies/:slug", requireSystemAuth, async (req, res) => {
  const slug = paramString(req.params.slug);
  const parsed = PatchStudyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updates: Partial<typeof studiesTable.$inferInsert> = {
    updated_at: new Date(),
  };

  if (data.short_title !== undefined) updates.short_title = data.short_title;
  if (data.full_title !== undefined) updates.full_title = data.full_title;
  if (data.organization !== undefined) updates.organization = data.organization;
  if (data.location !== undefined) updates.location = data.location;
  if (data.principal_investigator !== undefined) {
    updates.principal_investigator = data.principal_investigator;
  }
  if (data.ethics_reference !== undefined) updates.ethics_reference = data.ethics_reference;
  if (data.contact_email !== undefined) {
    updates.contact_email = data.contact_email || null;
  }
  if (data.contact_phone !== undefined) updates.contact_phone = data.contact_phone;
  if (data.data_retention !== undefined) updates.data_retention = data.data_retention;
  if (data.estimated_minutes !== undefined) updates.estimated_minutes = data.estimated_minutes;
  if (data.status !== undefined) updates.status = data.status;
  if (data.opens_at !== undefined) {
    updates.opens_at = data.opens_at ? new Date(data.opens_at) : null;
  }
  if (data.closes_at !== undefined) {
    updates.closes_at = data.closes_at ? new Date(data.closes_at) : null;
  }

  const [study] = await db
    .update(studiesTable)
    .set(updates)
    .where(eq(studiesTable.slug, slug))
    .returning();

  if (!study) {
    res.status(404).json({ error: "Study not found" });
    return;
  }

  res.json(toPublicStudy(study));
});

router.delete("/system/studies/:slug", requireSystemAuth, async (req, res) => {
  const slug = paramString(req.params.slug);
  const [study] = await db
    .update(studiesTable)
    .set({ status: "archived", updated_at: new Date() })
    .where(eq(studiesTable.slug, slug))
    .returning();

  if (!study) {
    res.status(404).json({ error: "Study not found" });
    return;
  }

  res.json(toPublicStudy(study));
});

router.get("/system/studies/:slug/access", requireSystemAuth, async (req, res) => {
  const slug = paramString(req.params.slug);
  const rows = await db
    .select({
      id: adminUserStudyAccessTable.id,
      adminUserId: adminUserStudyAccessTable.admin_user_id,
      role: adminUserStudyAccessTable.role,
      grantedAt: adminUserStudyAccessTable.granted_at,
      email: adminUsersTable.email,
      name: adminUsersTable.name,
    })
    .from(adminUserStudyAccessTable)
    .innerJoin(adminUsersTable, eq(adminUsersTable.id, adminUserStudyAccessTable.admin_user_id))
    .where(eq(adminUserStudyAccessTable.study_slug, slug));

  res.json({
    access: rows.map((row) => ({
      id: row.id,
      adminUserId: row.adminUserId,
      email: row.email,
      name: row.name,
      role: row.role,
      grantedAt: row.grantedAt.toISOString(),
    })),
  });
});

router.post("/system/studies/:slug/access", requireSystemAuth, async (req, res) => {
  const slug = paramString(req.params.slug);
  const parsed = GrantAccessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [row] = await db
      .insert(adminUserStudyAccessTable)
      .values({
        admin_user_id: parsed.data.admin_user_id,
        study_slug: slug,
        role: parsed.data.role,
        granted_by_system_admin_id: req.session.userId,
      })
      .returning();

    res.status(201).json(row);
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
      res.status(409).json({ error: "User already has access to this study" });
      return;
    }
    throw err;
  }
});

router.patch(
  "/system/studies/:slug/access/:userId",
  requireSystemAuth,
  async (req, res) => {
    const slug = paramString(req.params.slug);
    const userId = Number(paramString(req.params.userId));
    const role = z.enum(["viewer", "analyst", "admin"]).safeParse(req.body.role);
    if (!role.success) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const [updated] = await db
      .update(adminUserStudyAccessTable)
      .set({ role: role.data })
      .where(
        and(
          eq(adminUserStudyAccessTable.admin_user_id, userId),
          eq(adminUserStudyAccessTable.study_slug, slug),
        ),
      )
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Access record not found" });
      return;
    }

    res.json(updated);
  },
);

router.delete(
  "/system/studies/:slug/access/:userId",
  requireSystemAuth,
  async (req, res) => {
    const slug = paramString(req.params.slug);
    const userId = Number(paramString(req.params.userId));
    const [deleted] = await db
      .delete(adminUserStudyAccessTable)
      .where(
        and(
          eq(adminUserStudyAccessTable.admin_user_id, userId),
          eq(adminUserStudyAccessTable.study_slug, slug),
        ),
      )
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Access record not found" });
      return;
    }

    res.json({ ok: true });
  },
);

router.get("/system/users", requireSystemAuth, async (_req, res) => {
  const users = await db
    .select({
      id: adminUsersTable.id,
      email: adminUsersTable.email,
      name: adminUsersTable.name,
      role: adminUsersTable.role,
      status: adminUsersTable.status,
      created_at: adminUsersTable.created_at,
    })
    .from(adminUsersTable);

  const accessRows = await db.select().from(adminUserStudyAccessTable);

  res.json({
    users: users.map((user) => ({
      ...user,
      createdAt: user.created_at.toISOString(),
      studyAccess: accessRows
        .filter((a) => a.admin_user_id === user.id)
        .map((a) => ({ slug: a.study_slug, role: a.role })),
    })),
  });
});

export default router;
