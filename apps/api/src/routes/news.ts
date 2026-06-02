import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { newsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

router.get("/news", requireAuth, async (_req, res) => {
  const posts = await db
    .select({ post: newsTable, authorName: usersTable.displayName })
    .from(newsTable)
    .leftJoin(usersTable, eq(newsTable.authorId, usersTable.id))
    .orderBy(desc(newsTable.createdAt));

  res.json(
    posts.map((p) => ({
      id: p.post.id,
      authorId: p.post.authorId,
      authorName: p.authorName ?? "Unknown",
      title: p.post.title,
      content: p.post.content,
      isPinned: p.post.isPinned,
      createdAt: p.post.createdAt.toISOString(),
    })),
  );
});

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  isPinned: z.boolean().optional(),
});

router.post(
  "/news",
  requireAuth,
  requireRole("owner", "admin", "sanitaeter_leitung_admin", "sanitaeter_leitung", "teacher"),
  async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const [created] = await db
      .insert(newsTable)
      .values({ ...parsed.data, authorId: req.user!.id })
      .returning();

    res.status(201).json({
      id: created!.id,
      authorId: created!.authorId,
      authorName: req.user!.displayName,
      title: created!.title,
      content: created!.content,
      isPinned: created!.isPinned,
      createdAt: created!.createdAt.toISOString(),
    });
  },
);

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  isPinned: z.boolean().optional(),
});

router.patch(
  "/news/:id",
  requireAuth,
  requireRole("owner", "admin", "teacher"),
  async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    await db
      .update(newsTable)
      .set(parsed.data)
      .where(eq(newsTable.id, req.params["id"] as string));

    const [result] = await db
      .select({ post: newsTable, authorName: usersTable.displayName })
      .from(newsTable)
      .leftJoin(usersTable, eq(newsTable.authorId, usersTable.id))
      .where(eq(newsTable.id, req.params["id"] as string))
      .limit(1);

    if (!result) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      id: result.post.id,
      authorId: result.post.authorId,
      authorName: result.authorName ?? "Unknown",
      title: result.post.title,
      content: result.post.content,
      isPinned: result.post.isPinned,
      createdAt: result.post.createdAt.toISOString(),
    });
  },
);

router.delete(
  "/news/:id",
  requireAuth,
  requireRole("owner", "admin", "sanitaeter_leitung_admin", "sanitaeter_leitung", "teacher"),
  async (req, res) => {
    await db.delete(newsTable).where(eq(newsTable.id, req.params["id"] as string));
    res.json({ message: "Gelöscht" });
  },
);

export default router;
