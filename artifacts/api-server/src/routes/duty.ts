import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { dutySlotsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

router.get("/duty", requireAuth, async (_req, res) => {
  const slots = await db
    .select({
      slot: dutySlotsTable,
      displayName: usersTable.displayName,
    })
    .from(dutySlotsTable)
    .leftJoin(usersTable, eq(dutySlotsTable.userId, usersTable.id))
    .orderBy(desc(dutySlotsTable.date));

  res.json(
    slots.map((s) => ({
      id: s.slot.id,
      userId: s.slot.userId,
      displayName: s.displayName ?? "Unknown",
      date: s.slot.date,
      startTime: s.slot.startTime,
      endTime: s.slot.endTime,
      notes: s.slot.notes ?? null,
      createdAt: s.slot.createdAt.toISOString(),
    })),
  );
});

const createSchema = z.object({
  userId: z.string().uuid(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  notes: z.string().optional(),
});

router.post(
  "/duty",
  requireAuth,
  requireRole("owner", "admin", "wachleiter"),
  async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const [created] = await db
      .insert(dutySlotsTable)
      .values(parsed.data)
      .returning();

    const [result] = await db
      .select({ slot: dutySlotsTable, displayName: usersTable.displayName })
      .from(dutySlotsTable)
      .leftJoin(usersTable, eq(dutySlotsTable.userId, usersTable.id))
      .where(eq(dutySlotsTable.id, created!.id))
      .limit(1);

    res.status(201).json({
      id: result!.slot.id,
      userId: result!.slot.userId,
      displayName: result!.displayName ?? "Unknown",
      date: result!.slot.date,
      startTime: result!.slot.startTime,
      endTime: result!.slot.endTime,
      notes: result!.slot.notes ?? null,
      createdAt: result!.slot.createdAt.toISOString(),
    });
  },
);

router.delete(
  "/duty/:id",
  requireAuth,
  requireRole("owner", "admin", "wachleiter"),
  async (req, res) => {
    await db
      .delete(dutySlotsTable)
      .where(eq(dutySlotsTable.id, req.params["id"]!));
    res.json({ message: "Gelöscht" });
  },
);

export default router;
