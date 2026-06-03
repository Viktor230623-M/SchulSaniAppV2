import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { usersTable, customRolesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

router.get(
  "/users",
  requireAuth,
  requireRole("owner", "admin", "sanitaeter_leitung_admin", "teacher"),
  async (_req, res) => {
    const users = await db
      .select({ user: usersTable, customRole: customRolesTable })
      .from(usersTable)
      .leftJoin(
        customRolesTable,
        eq(usersTable.customRoleId, customRolesTable.id),
      );

    res.json(
      users.map((u) => ({
        id: u.user.id,
        iservUsername: u.user.iservUsername,
        displayName: u.user.displayName,
        email: u.user.email,
        role: u.user.role,
        customRoleId: u.user.customRoleId,
        customRole: u.customRole ?? null,
        isActive: u.user.isActive,
        createdAt: u.user.createdAt.toISOString(),
      })),
    );
  },
);

const updateSchema = z.object({
  role: z.enum(["admin", "sanitaeter_leitung_admin", "sanitaeter_leitung", "teacher", "sanitaeter"]).optional(),
  isActive: z.boolean().optional(),
  customRoleId: z.string().uuid().nullable().optional(),
});

const uuidSchema = z.string().uuid();

router.patch(
  "/users/:id",
  requireAuth,
  requireRole("owner", "admin", "sanitaeter_leitung_admin"),
  async (req, res) => {
    const idParsed = uuidSchema.safeParse(req.params["id"]);
    if (!idParsed.success) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const targetId = idParsed.data;
    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, targetId))
      .limit(1);

    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (target.role === "owner") {
      res.status(403).json({ error: "Cannot modify owner" });
      return;
    }

    const actorRole = req.user!.role;
    const targetNewRole = parsed.data.role;
    const adminOnlyRoles = ["owner", "admin"];
    if (
      actorRole !== "owner" &&
      targetNewRole !== undefined &&
      adminOnlyRoles.includes(targetNewRole)
    ) {
      res.status(403).json({ error: "Only owner can promote to admin" });
      return;
    }

    await db
      .update(usersTable)
      .set({
        ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
        ...(parsed.data.isActive !== undefined
          ? { isActive: parsed.data.isActive }
          : {}),
        ...(parsed.data.customRoleId !== undefined
          ? { customRoleId: parsed.data.customRoleId }
          : {}),
      })
      .where(eq(usersTable.id, targetId));

    const [updated] = await db
      .select({ user: usersTable, customRole: customRolesTable })
      .from(usersTable)
      .leftJoin(
        customRolesTable,
        eq(usersTable.customRoleId, customRolesTable.id),
      )
      .where(eq(usersTable.id, targetId))
      .limit(1);

    res.json({
      id: updated!.user.id,
      iservUsername: updated!.user.iservUsername,
      displayName: updated!.user.displayName,
      email: updated!.user.email,
      role: updated!.user.role,
      customRoleId: updated!.user.customRoleId,
      customRole: updated!.customRole ?? null,
      isActive: updated!.user.isActive,
      createdAt: updated!.user.createdAt.toISOString(),
    });
  },
);

export default router;
