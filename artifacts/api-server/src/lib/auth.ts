import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, customRolesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthUser {
  id: string;
  iservUsername: string;
  displayName: string;
  email: string;
  role: "owner" | "admin" | "wachleiter" | "sanitaeter";
  customRoleId: string | null;
  customRolePermissions: string[] | null;
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env["JWT_SECRET"];
if (!JWT_SECRET) throw new Error("JWT_SECRET is required");

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET!, { expiresIn: "7d" });
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as { sub: string };
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const result = await db
    .select({
      user: usersTable,
      customRole: customRolesTable,
    })
    .from(usersTable)
    .leftJoin(
      customRolesTable,
      eq(usersTable.customRoleId, customRolesTable.id),
    )
    .where(eq(usersTable.id, payload.sub))
    .limit(1);

  if (!result[0]) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const { user, customRole } = result[0];
  req.user = {
    id: user.id,
    iservUsername: user.iservUsername,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    customRoleId: user.customRoleId,
    customRolePermissions: customRole ? (customRole.permissions as string[]) : null,
    isActive: user.isActive,
  };

  if (!user.isActive) {
    res.status(403).json({ error: "account_pending" });
    return;
  }

  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
