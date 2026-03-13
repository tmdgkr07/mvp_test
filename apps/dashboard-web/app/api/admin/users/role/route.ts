import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listAdminUsers, updateUserAdminRole } from "@/lib/data-store";
import { isSuperAdminSession } from "@/lib/permissions";
import { buildRateLimitKey, checkRateLimit, getClientIp, validateTrustedAppMutation } from "@/lib/request-guards";

export const preferredRegion = "icn1";

type RoleRequestBody = {
  email?: string;
  action?: "grant" | "revoke";
  nextRole?: "CREATOR" | "ADMIN" | "SUPER_ADMIN";
};

function resolveNextRole(body: RoleRequestBody) {
  if (body.nextRole === "CREATOR" || body.nextRole === "ADMIN" || body.nextRole === "SUPER_ADMIN") {
    return body.nextRole;
  }

  if (body.action === "grant") {
    return "ADMIN" as const;
  }

  if (body.action === "revoke") {
    return "CREATOR" as const;
  }

  return null;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login is required." }, { status: 401 });
  }

  if (!isSuperAdminSession(session)) {
    return NextResponse.json({ error: "Only super admins can change privileged roles." }, { status: 403 });
  }

  const trust = validateTrustedAppMutation(request);
  if (!trust.ok) {
    return NextResponse.json({ error: trust.error }, { status: 403 });
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey("admin-role-change", session.user.id, getClientIp(request)),
    limit: 20,
    windowMs: 10 * 60 * 1000
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Too many privileged role changes. Please retry later." }, { status: 429 });
  }

  let body: RoleRequestBody;
  try {
    body = (await request.json()) as RoleRequestBody;
  } catch {
    return NextResponse.json({ error: "A valid JSON body is required." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const nextRole = resolveNextRole(body);

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!nextRole) {
    return NextResponse.json({ error: "Unsupported target role." }, { status: 400 });
  }

  try {
    await updateUserAdminRole({
      email,
      nextRole,
      actorUserId: session.user.id
    });

    const admins = await listAdminUsers();

    return NextResponse.json({
      ok: true,
      admins
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to change the privileged role." },
      { status: 400 }
    );
  }
}
