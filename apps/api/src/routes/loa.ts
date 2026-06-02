import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { loaRequestsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logActivity, ActivityAction } from "../lib/activity";

const router = Router();

async function formatLoa(loaId: string) {
  const [result] = await db
    .select({
      loa: loaRequestsTable,
      user: { displayName: usersTable.displayName },
    })
    .from(loaRequestsTable)
    .leftJoin(usersTable, eq(loaRequestsTable.userId, usersTable.id))
    .where(eq(loaRequestsTable.id, loaId))
    .limit(1);

  if (!result) return null;

  let reviewedByName: string | null = null;
  if (result.loa.reviewedBy) {
    const [reviewer] = await db
      .select({ displayName: usersTable.displayName })
      .from(usersTable)
      .where(eq(usersTable.id, result.loa.reviewedBy))
      .limit(1);
    reviewedByName = reviewer?.displayName ?? null;
  }

  return {
    id: result.loa.id,
    userId: result.loa.userId,
    displayName: result.user?.displayName ?? "Unknown",
    reason: result.loa.reason,
    fromDate: result.loa.fromDate,
    toDate: result.loa.toDate,
    status: result.loa.status,
    reviewedBy: result.loa.reviewedBy ?? null,
    reviewedByName,
    reviewedAt: result.loa.reviewedAt?.toISOString() ?? null,
    createdAt: result.loa.createdAt.toISOString(),
  };
}

router.get("/loa", requireAuth, async (req, res) => {
  const user = req.user!;
  const isManager = ["owner", "admin", "sanitaeter_leitung_admin", "sanitaeter_leitung", "teacher"].includes(user.role);

  const query = db
    .select({ loa: loaRequestsTable })
    .from(loaRequestsTable)
    .orderBy(desc(loaRequestsTable.createdAt));

  const allLoas = await query;
  const filtered = isManager
    ? allLoas
    : allLoas.filter((l) => l.loa.userId === user.id);

  const results = await Promise.all(filtered.map((l) => formatLoa(l.loa.id)));
  res.json(results.filter(Boolean));
});

const createSchema = z.object({
  reason: z.string().min(1),
  fromDate: z.string(),
  toDate: z.string(),
}).refine(d => d.toDate >= d.fromDate, { message: 'toDate must be after fromDate', path: ['toDate'] });

router.post("/loa", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [created] = await db
    .insert(loaRequestsTable)
    .values({ ...parsed.data, userId: req.user!.id })
    .returning();

  logActivity(req.user!.id, ActivityAction.LOA_REQUESTED, { loaId: created!.id });
  const result = await formatLoa(created!.id);
  res.status(201).json(result);
});

const updateSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

router.patch(
  "/loa/:id",
  requireAuth,
  requireRole("owner", "admin", "sanitaeter_leitung_admin", "sanitaeter_leitung", "teacher"),
  async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const loaId = req.params["id"] as string;
    await db
      .update(loaRequestsTable)
      .set({
        status: parsed.data.status,
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
      })
      .where(eq(loaRequestsTable.id, loaId));

    const action = parsed.data.status === "approved"
      ? ActivityAction.LOA_APPROVED
      : ActivityAction.LOA_REJECTED;
    logActivity(req.user!.id, action, { loaId });
    const result = await formatLoa(loaId);
    if (!result) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(result);
  },
);

export default router;
