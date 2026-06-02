import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { dutySlotsTable, dutyEntriesTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logActivity, ActivityAction } from "../lib/activity";

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
  requireRole("owner", "admin", "sanitaeter_leitung_admin", "sanitaeter_leitung", "teacher"),
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

    logActivity(req.user!.id, ActivityAction.DUTY_SLOT_CREATED, {
      slotId: created!.id,
      date: parsed.data.date,
      assignedTo: parsed.data.userId,
    });

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
  requireRole("owner", "admin", "sanitaeter_leitung_admin", "sanitaeter_leitung", "teacher"),
  async (req, res) => {
    const slotId = req.params["id"] as string;
    await db.delete(dutySlotsTable).where(eq(dutySlotsTable.id, slotId));
    logActivity(req.user!.id, ActivityAction.DUTY_SLOT_DELETED, { slotId });
    res.json({ message: "Gelöscht" });
  },
);

// ─── GET /duty/today ─────────────────────────────────────────────────────────

router.get("/duty/today", requireAuth, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const userId = req.user!.id;

  const [slotRow] = await db
    .select({ slot: dutySlotsTable, displayName: usersTable.displayName })
    .from(dutySlotsTable)
    .leftJoin(usersTable, eq(dutySlotsTable.userId, usersTable.id))
    .where(and(eq(dutySlotsTable.userId, userId), eq(dutySlotsTable.date, today)))
    .limit(1);

  if (!slotRow) {
    res.json({ slot: null, entry: null });
    return;
  }

  const slot = {
    id: slotRow.slot.id,
    userId: slotRow.slot.userId,
    displayName: slotRow.displayName ?? "Unknown",
    date: slotRow.slot.date,
    startTime: slotRow.slot.startTime,
    endTime: slotRow.slot.endTime,
    notes: slotRow.slot.notes ?? null,
    createdAt: slotRow.slot.createdAt.toISOString(),
  };

  const [entryRow] = await db
    .select()
    .from(dutyEntriesTable)
    .where(and(eq(dutyEntriesTable.userId, userId), eq(dutyEntriesTable.date, today)))
    .limit(1);

  const entry = entryRow
    ? {
        id: entryRow.id,
        userId: entryRow.userId,
        dutySlotId: entryRow.dutySlotId,
        date: entryRow.date,
        enteredAt: entryRow.enteredAt.toISOString(),
        confirmedAt: entryRow.confirmedAt?.toISOString() ?? null,
      }
    : null;

  res.json({ slot, entry });
});

// ─── POST /duty/enter ─────────────────────────────────────────────────────────

router.post("/duty/enter", requireAuth, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const userId = req.user!.id;

  const [slot] = await db
    .select()
    .from(dutySlotsTable)
    .where(and(eq(dutySlotsTable.userId, userId), eq(dutySlotsTable.date, today)))
    .limit(1);

  if (!slot) {
    res.status(403).json({ error: "no_duty_today" });
    return;
  }

  const [existing] = await db
    .select()
    .from(dutyEntriesTable)
    .where(and(eq(dutyEntriesTable.userId, userId), eq(dutyEntriesTable.date, today)))
    .limit(1);

  if (existing) {
    res.status(409).json({
      error: "already_entered",
      entry: {
        id: existing.id,
        userId: existing.userId,
        dutySlotId: existing.dutySlotId,
        date: existing.date,
        enteredAt: existing.enteredAt.toISOString(),
        confirmedAt: existing.confirmedAt?.toISOString() ?? null,
      },
    });
    return;
  }

  const [created] = await db
    .insert(dutyEntriesTable)
    .values({ userId, dutySlotId: slot.id, date: today })
    .returning();

  logActivity(userId, ActivityAction.DUTY_ENTERED, { slotId: slot.id, date: today });

  res.status(201).json({
    id: created!.id,
    userId: created!.userId,
    dutySlotId: created!.dutySlotId,
    date: created!.date,
    enteredAt: created!.enteredAt.toISOString(),
    confirmedAt: null,
  });
});

// ─── POST /duty/confirm ───────────────────────────────────────────────────────

router.post("/duty/confirm", requireAuth, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const userId = req.user!.id;

  const [entry] = await db
    .select()
    .from(dutyEntriesTable)
    .where(and(eq(dutyEntriesTable.userId, userId), eq(dutyEntriesTable.date, today)))
    .limit(1);

  if (!entry) {
    res.status(404).json({ error: "no_entry_today" });
    return;
  }

  if (entry.confirmedAt) {
    res.status(409).json({ error: "already_confirmed" });
    return;
  }

  const now = new Date();
  await db
    .update(dutyEntriesTable)
    .set({ confirmedAt: now })
    .where(eq(dutyEntriesTable.id, entry.id));

  logActivity(userId, ActivityAction.DUTY_CONFIRMED, { entryId: entry.id, date: today });

  res.json({
    id: entry.id,
    userId: entry.userId,
    dutySlotId: entry.dutySlotId,
    date: entry.date,
    enteredAt: entry.enteredAt.toISOString(),
    confirmedAt: now.toISOString(),
  });
});

// ─── GET /duty/entries ────────────────────────────────────────────────────────

router.get(
  "/duty/entries",
  requireAuth,
  requireRole("owner", "admin", "sanitaeter_leitung_admin", "sanitaeter_leitung", "teacher"),
  async (_req, res) => {
    const entries = await db
      .select({ entry: dutyEntriesTable, displayName: usersTable.displayName })
      .from(dutyEntriesTable)
      .leftJoin(usersTable, eq(dutyEntriesTable.userId, usersTable.id))
      .orderBy(desc(dutyEntriesTable.date));

    res.json(
      entries.map((e) => ({
        id: e.entry.id,
        userId: e.entry.userId,
        displayName: e.displayName ?? "Unknown",
        dutySlotId: e.entry.dutySlotId,
        date: e.entry.date,
        enteredAt: e.entry.enteredAt.toISOString(),
        confirmedAt: e.entry.confirmedAt?.toISOString() ?? null,
      })),
    );
  },
);

export default router;
