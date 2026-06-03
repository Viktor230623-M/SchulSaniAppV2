import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { customRolesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

const uuidSchema = z.string().uuid();

const VALID_PERMISSIONS = z.enum([
  "missions.view",
  "missions.create",
  "missions.close",
  "missions.respond",
  "duty.view",
  "duty.manage",
  "loa.view",
  "loa.submit",
  "loa.manage",
  "news.view",
  "news.post",
  "news.manage",
  "users.view",
  "users.manage",
  "roles.assign",
  "roles.create",
]);

router.get(
  "/custom-roles",
  requireAuth,
  requireRole("owner", "admin", "sanitaeter_leitung_admin"),
  async (_req, res) => {
    const roles = await db.select().from(customRolesTable);
    res.json(
      roles.map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        permissions: r.permissions as string[],
        createdBy: r.createdBy,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  },
);

const createSchema = z.object({
  name: z.string().min(1).max(64),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  permissions: z.array(VALID_PERMISSIONS),
});

router.post(
  "/custom-roles",
  requireAuth,
  requireRole("owner"),
  async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const [created] = await db
      .insert(customRolesTable)
      .values({
        name: parsed.data.name,
        color: parsed.data.color ?? "#6366F1",
        permissions: parsed.data.permissions,
        createdBy: req.user!.id,
      })
      .returning();

    res.status(201).json({
      id: created!.id,
      name: created!.name,
      color: created!.color,
      permissions: created!.permissions as string[],
      createdBy: created!.createdBy,
      createdAt: created!.createdAt.toISOString(),
    });
  },
);

const updateSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  permissions: z.array(VALID_PERMISSIONS).optional(),
});

router.patch(
  "/custom-roles/:id",
  requireAuth,
  requireRole("owner"),
  async (req, res) => {
    const idParsed = uuidSchema.safeParse(req.params["id"]);
    if (!idParsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const [existing] = await db
      .select()
      .from(customRolesTable)
      .where(eq(customRolesTable.id, idParsed.data))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const [updated] = await db
      .update(customRolesTable)
      .set(parsed.data)
      .where(eq(customRolesTable.id, idParsed.data))
      .returning();

    res.json({
      id: updated!.id,
      name: updated!.name,
      color: updated!.color,
      permissions: updated!.permissions as string[],
      createdBy: updated!.createdBy,
      createdAt: updated!.createdAt.toISOString(),
    });
  },
);

router.delete(
  "/custom-roles/:id",
  requireAuth,
  requireRole("owner"),
  async (req, res) => {
    const idParsed = uuidSchema.safeParse(req.params["id"]);
    if (!idParsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [existing] = await db
      .select({ id: customRolesTable.id })
      .from(customRolesTable)
      .where(eq(customRolesTable.id, idParsed.data))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    await db
      .delete(customRolesTable)
      .where(eq(customRolesTable.id, idParsed.data));
    res.json({ message: "Gelöscht" });
  },
);

export default router;
