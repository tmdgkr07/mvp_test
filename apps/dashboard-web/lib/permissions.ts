import type { Session } from "next-auth";

export type UserRole = "guest" | "creator" | "admin" | "super_admin";

function normalizeRole(role: string | null | undefined): UserRole {
  if (role === "super_admin" || role === "SUPER_ADMIN") {
    return "super_admin";
  }

  if (role === "admin" || role === "ADMIN") {
    return "admin";
  }

  if (role === "creator" || role === "CREATOR") {
    return "creator";
  }

  return "guest";
}

export function getUserRole(session: Session | null | undefined): UserRole {
  if (!session?.user?.id) {
    return "guest";
  }

  if (session.user.isSuperAdmin) {
    return "super_admin";
  }

  if (session.user.isAdmin) {
    return "admin";
  }

  const normalized = normalizeRole(session.user.role);
  return normalized === "guest" ? "creator" : normalized;
}

export function isAdminSession(session: Session | null | undefined): boolean {
  const role = getUserRole(session);
  return role === "admin" || role === "super_admin";
}

export function isSuperAdminSession(session: Session | null | undefined): boolean {
  return getUserRole(session) === "super_admin";
}

export function canManageProject(session: Session | null, ownerId: string | null | undefined): boolean {
  if (!session?.user?.id) {
    return false;
  }

  if (ownerId && session.user.id === ownerId) {
    return true;
  }

  return isAdminSession(session);
}
