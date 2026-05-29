import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  missionsTable,
  missionRespondersTable,
  usersTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

async function getMissionWithResponders(missionId: string) {
  const [mission] = await db
    .select({
      mission: missionsTable,
      creator: { displayName: usersTable.displayName },
    })
    .from(missionsTable)
    .leftJoin(usersTable, eq(missionsTable.createdBy, usersTable.id))
    .where(eq(missionsTable.id, missionId))
    .limit(1);

  if (!mission) return null;

  const responders = await db
    .select({
      id: missionRespondersTable.id,
      userId: missionRespondersTable.userId,
      displayName: usersTable.displayName,
      respondedAt: missionRespondersTable.respondedAt,
    })
    .from(missionRespondersTable)
    .leftJoin(usersTable, eq(missionRespondersTable.userId, usersTable.id))
    .where(eq(missionRespondersTable.missionId, missionId));

  return {
    id: mission.mission.id,
    title: mission.mission.title,
    location: mission.mission.location,
    patientInitials: mission.mission.patientInitials,
    treatmentNotes: mission.mission.treatmentNotes,
    status: mission.mission.status,
    createdBy: mission.mission.createdBy,
    createdByName: mission.creator?.displayName ?? "Unknown",
    createdAt: mission.mission.createdAt.toISOString(),
    closedAt: mission.mission.closedAt?.toISOString() ?? null,
    responders: responders.map((r) => ({
      id: r.id,
      userId: r.userId,
      displayName: r.displayName ?? "Unknown",
      respondedAt: r.respondedAt.toISOString(),
    })),
  };
}

router.get("/missions", requireAuth, async (_req, res) => {
  const missions = await db
    .select({ mission: missionsTable })
    .from(missionsTable)
    .orderBy(desc(missionsTable.createdAt));

  const result = await Promise.all(
    missions.map((m) => getMissionWithResponders(m.mission.id)),
  );
  res.json(result.filter(Boolean));
});

router.get("/missions/:id", requireAuth, async (req, res) => {
  const mission = await getMissionWithResponders(req.params["id"]!);
  if (!mission) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }
  res.json(mission);
});

const createSchema = z.object({
  title: z.string().min(1),
  location: z.string().min(1),
  patientInitials: z.string().min(1),
  treatmentNotes: z.string().optional(),
});

router.post("/missions", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [created] = await db
    .insert(missionsTable)
    .values({
      ...parsed.data,
      treatmentNotes: parsed.data.treatmentNotes ?? "",
      createdBy: req.user!.id,
    })
    .returning();

  const mission = await getMissionWithResponders(created!.id);
  res.status(201).json(mission);
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  patientInitials: z.string().min(1).optional(),
  treatmentNotes: z.string().optional(),
});

router.patch("/missions/:id", requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  await db
    .update(missionsTable)
    .set(parsed.data)
    .where(eq(missionsTable.id, req.params["id"]!));

  const mission = await getMissionWithResponders(req.params["id"]!);
  if (!mission) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }
  res.json(mission);
});

router.post(
  "/missions/:id/close",
  requireAuth,
  requireRole("owner", "admin", "wachleiter"),
  async (req, res) => {
    await db
      .update(missionsTable)
      .set({ status: "closed", closedAt: new Date() })
      .where(eq(missionsTable.id, req.params["id"]!));

    const mission = await getMissionWithResponders(req.params["id"]!);
    if (!mission) {
      res.status(404).json({ error: "Mission not found" });
      return;
    }
    res.json(mission);
  },
);

router.post("/missions/:id/respond", requireAuth, async (req, res) => {
  const missionId = req.params["id"]!;
  const existing = await db
    .select()
    .from(missionRespondersTable)
    .where(eq(missionRespondersTable.missionId, missionId))
    .limit(1);

  if (!existing.find((r) => r.userId === req.user!.id)) {
    await db.insert(missionRespondersTable).values({
      missionId,
      userId: req.user!.id,
    });
  }

  const mission = await getMissionWithResponders(missionId);
  if (!mission) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }
  res.json(mission);
});

export default router;
