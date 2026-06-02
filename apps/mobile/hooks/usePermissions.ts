import { useAuth } from "@/context/AuthContext";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    "missions.view",
    "missions.create",
    "missions.close",
    "missions.respond",
    "duty.view",
    "duty.manage",
    "loa.view",
    "loa.submit",
    "loa.manage",
    "news.view",
    "news.post",
    "news.manage",
    "users.view",
    "users.manage",
    "roles.assign",
    "roles.create",
  ],
  admin: [
    "missions.view",
    "missions.create",
    "missions.close",
    "missions.respond",
    "duty.view",
    "duty.manage",
    "loa.view",
    "loa.submit",
    "loa.manage",
    "news.view",
    "news.post",
    "news.manage",
    "users.view",
    "users.manage",
    "roles.assign",
  ],
  sanitaeter_leitung_admin: [
    "missions.view",
    "missions.create",
    "missions.close",
    "missions.respond",
    "duty.view",
    "duty.manage",
    "loa.view",
    "loa.submit",
    "loa.manage",
    "news.view",
    "news.post",
    "users.view",
    "users.manage",
    "roles.assign",
  ],
  sanitaeter_leitung: [
    "missions.view",
    "missions.create",
    "missions.close",
    "missions.respond",
    "duty.view",
    "duty.manage",
    "loa.view",
    "loa.submit",
    "loa.manage",
    "news.view",
    "news.post",
  ],
  teacher: [
    "missions.view",
    "missions.create",
    "missions.close",
    "missions.respond",
    "duty.view",
    "duty.manage",
    "loa.view",
    "loa.submit",
    "loa.manage",
    "news.view",
    "news.post",
    "news.manage",
    "users.view",
  ],
  sanitaeter: [
    "missions.view",
    "missions.respond",
    "duty.view",
    "loa.view",
    "loa.submit",
    "news.view",
  ],
};

type Role = "sanitaeter" | "sanitaeter_leitung" | "sanitaeter_leitung_admin" | "admin" | "owner";
const HIERARCHY: Role[] = ["sanitaeter", "sanitaeter_leitung", "sanitaeter_leitung_admin", "admin", "owner"];

export function usePermissions() {
  const { user } = useAuth();

  const can = (permission: string): boolean => {
    if (!user) return false;
    if (user.customRole?.permissions) {
      return user.customRole.permissions.includes(permission);
    }
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
  };

  const isAtLeast = (role: Role): boolean => {
    if (!user) return false;
    const userLevel = HIERARCHY.indexOf(user.role as Role);
    const requiredLevel = HIERARCHY.indexOf(role);
    if (userLevel === -1) return false;
    return userLevel >= requiredLevel;
  };

  const isOwner = user?.role === "owner";
  const isAdmin = user?.role === "admin" || isOwner;
  const isSanitaeterLeitungAdmin = user?.role === "sanitaeter_leitung_admin" || isAdmin;
  const isSanitaeterLeitung = user?.role === "sanitaeter_leitung" || isSanitaeterLeitungAdmin;
  const isTeacher = user?.role === "teacher";
  const isWachleiter = isSanitaeterLeitung;

  return { can, isAtLeast, isOwner, isAdmin, isSanitaeterLeitungAdmin, isSanitaeterLeitung, isTeacher, isWachleiter };
}
