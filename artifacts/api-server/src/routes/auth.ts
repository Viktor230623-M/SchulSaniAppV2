import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { usersTable, customRolesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, signToken } from "../lib/auth";
import { authenticateWithIServ } from "../lib/iserv";
import { logger } from "../lib/logger";

const router = Router();

const FIRST_ADMIN_USERNAME = process.env["FIRST_ADMIN_USERNAME"];

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { username, password } = parsed.data;

  const iservUser = await authenticateWithIServ(username, password);
  if (!iservUser) {
    res.status(401).json({ error: "Anmeldung fehlgeschlagen." });
    return;
  }

  const isFirstAdmin =
    FIRST_ADMIN_USERNAME && username === FIRST_ADMIN_USERNAME;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.iservUsername, username))
    .limit(1);

  let userId: string;

  if (existing) {
    await db
      .update(usersTable)
      .set({
        displayName: iservUser.displayName,
        email: iservUser.email,
        ...(isFirstAdmin && existing.role !== "owner"
          ? { role: "owner" as const, isActive: true }
          : {}),
      })
      .where(eq(usersTable.id, existing.id));
    userId = existing.id;
  } else {
    const [created] = await db
      .insert(usersTable)
      .values({
        iservUsername: username,
        displayName: iservUser.displayName,
        email: iservUser.email,
        role: isFirstAdmin ? ("owner" as const) : ("sanitaeter" as const),
        isActive: !!isFirstAdmin,
      })
      .returning();
    userId = created!.id;
    logger.info({ username, isFirstAdmin }, "New user created");
  }

  const [user] = await db
    .select({ user: usersTable, customRole: customRolesTable })
    .from(usersTable)
    .leftJoin(customRolesTable, eq(usersTable.customRoleId, customRolesTable.id))
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(500).json({ error: "User creation failed" });
    return;
  }

  if (!user.user.isActive) {
    res.status(403).json({ error: "account_pending" });
    return;
  }

  const token = signToken(userId);

  res.json({
    token,
    user: {
      id: user.user.id,
      iservUsername: user.user.iservUsername,
      displayName: user.user.displayName,
      email: user.user.email,
      role: user.user.role,
      customRoleId: user.user.customRoleId,
      customRole: user.customRole ?? null,
      isActive: user.user.isActive,
      createdAt: user.user.createdAt.toISOString(),
    },
  });
});

router.post("/auth/logout", requireAuth, (_req, res) => {
  res.json({ message: "Abgemeldet" });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const user = req.user!;
  const [result] = await db
    .select({ user: usersTable, customRole: customRolesTable })
    .from(usersTable)
    .leftJoin(customRolesTable, eq(usersTable.customRoleId, customRolesTable.id))
    .where(eq(usersTable.id, user.id))
    .limit(1);

  if (!result) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: result.user.id,
    iservUsername: result.user.iservUsername,
    displayName: result.user.displayName,
    email: result.user.email,
    role: result.user.role,
    customRoleId: result.user.customRoleId,
    customRole: result.customRole ?? null,
    isActive: result.user.isActive,
    createdAt: result.user.createdAt.toISOString(),
  });
});

export default router;
