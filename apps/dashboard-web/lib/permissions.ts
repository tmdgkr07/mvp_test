import type { Session } from "next-auth";

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "";
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const target = normalizeEmail(email);
  if (!target) return false;

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

  return adminEmails.includes(target);
}

export function canManageProject(session: Session | null, ownerId: string | null | undefined): boolean {
  if (!session?.user?.id) {
    return false;
  }

  if (ownerId && session.user.id === ownerId) {
    return true;
  }

  return isAdminEmail(session.user.email);
}
