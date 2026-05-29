import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { customRolesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

router.get(
  "/custom-roles",
  requireAuth,
  requireRole("owner", "admin"),
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
  name: z.string().min(1),
  color: z.string().optional(),
  permissions: z.array(z.string()),
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
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

router.patch(
  "/custom-roles/:id",
  requireAuth,
  requireRole("owner"),
  async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    await db
      .update(customRolesTable)
      .set(parsed.data)
      .where(eq(customRolesTable.id, req.params["id"]!));

    const [updated] = await db
      .select()
      .from(customRolesTable)
      .where(eq(customRolesTable.id, req.params["id"]!))
      .limit(1);

    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      id: updated.id,
      name: updated.name,
      color: updated.color,
      permissions: updated.permissions as string[],
      createdBy: updated.createdBy,
      createdAt: updated.createdAt.toISOString(),
    });
  },
);

router.delete(
  "/custom-roles/:id",
  requireAuth,
  requireRole("owner"),
  async (req, res) => {
    await db
      .delete(customRolesTable)
      .where(eq(customRolesTable.id, req.params["id"]!));
    res.json({ message: "Gelöscht" });
  },
);

export default router;
