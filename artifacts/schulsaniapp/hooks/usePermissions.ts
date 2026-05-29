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
  wachleiter: [
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
    "missions.create",
    "missions.respond",
    "duty.view",
    "loa.view",
    "loa.submit",
    "news.view",
  ],
};

export function usePermissions() {
  const { user } = useAuth();

  const can = (permission: string): boolean => {
    if (!user) return false;
    if (user.customRole?.permissions) {
      return user.customRole.permissions.includes(permission);
    }
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
  };

  const isAtLeast = (
    role: "sanitaeter" | "wachleiter" | "admin" | "owner",
  ): boolean => {
    if (!user) return false;
    const hierarchy = ["sanitaeter", "wachleiter", "admin", "owner"];
    const userLevel = hierarchy.indexOf(user.role);
    const requiredLevel = hierarchy.indexOf(role);
    return userLevel >= requiredLevel;
  };

  const isOwner = user?.role === "owner";
  const isAdmin = user?.role === "admin" || isOwner;
  const isWachleiter = user?.role === "wachleiter" || isAdmin;

  return { can, isAtLeast, isOwner, isAdmin, isWachleiter };
}
