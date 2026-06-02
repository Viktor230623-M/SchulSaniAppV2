import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { pushTokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

const schema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

router.post("/push-tokens", requireAuth, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const existing = await db
    .select()
    .from(pushTokensTable)
    .where(eq(pushTokensTable.token, parsed.data.token))
    .limit(1);

  if (!existing[0]) {
    await db.insert(pushTokensTable).values({
      userId: req.user!.id,
      token: parsed.data.token,
      platform: parsed.data.platform,
    });
  }

  res.json({ message: "Token registered" });
});

export default router;
