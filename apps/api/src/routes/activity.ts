import { Router } from "express";
import { db } from "@workspace/db";
import { activityLogTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

router.get(
  "/activity",
  requireAuth,
  requireRole("owner", "admin", "sanitaeter_leitung_admin", "sanitaeter_leitung", "teacher"),
  async (req, res) => {
    const { userId, action } = req.query as Record<string, string | undefined>;

    const rows = await db
      .select({
        log: activityLogTable,
        displayName: usersTable.displayName,
      })
      .from(activityLogTable)
      .leftJoin(usersTable, eq(activityLogTable.userId, usersTable.id))
      .orderBy(desc(activityLogTable.createdAt))
      .limit(200);

    const filtered = rows.filter((r) => {
      if (userId && r.log.userId !== userId) return false;
      if (action && r.log.action !== action) return false;
      return true;
    });

    res.json(
      filtered.map((r) => ({
        id: r.log.id,
        userId: r.log.userId ?? null,
        displayName: r.displayName ?? null,
        action: r.log.action,
        metadata: r.log.metadata ?? null,
        createdAt: r.log.createdAt.toISOString(),
      })),
    );
  },
);

export default router;
