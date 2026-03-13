import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";
import { getProjectById } from "@/lib/data-store";
import { addAllowedOrigin, getProjectEmbedState, removeAllowedOrigin } from "@/lib/embed-store";
import { canManageProject } from "@/lib/permissions";
import { validateTrustedAppMutation } from "@/lib/request-guards";
import { sanitizeText } from "@/lib/embed-utils";

export const runtime = "nodejs";

async function resolveManagedProject(projectId: string, session: Session | null) {
  if (!session?.user?.id) {
    return { error: fail("UNAUTHORIZED", "Login is required.", 401) };
  }

  if (!projectId) {
    return { error: fail("INVALID_PROJECT", "projectId is required.", 400) };
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return { error: fail("NOT_FOUND", "Project not found.", 404) };
  }

  if (!canManageProject(session, project.ownerId)) {
    return { error: fail("FORBIDDEN", "You cannot manage origins for this project.", 403) };
  }

  return { project };
}

export async function GET(request: Request) {
  const session = await auth();
  const projectId = sanitizeText(new URL(request.url).searchParams.get("projectId"), 80);
  const access = await resolveManagedProject(projectId, session);
  if ("error" in access) {
    return access.error;
  }

  const state = await getProjectEmbedState(access.project.id);
  if (!state) {
    return fail("NOT_FOUND", "Embed origin settings not found.", 404);
  }

  return ok({
    origins: state.allowedOrigins,
    autoRegisterReady: false
  });
}

export async function POST(request: Request) {
  const session = await auth();
  const trust = validateTrustedAppMutation(request);
  if (!trust.ok) {
    return fail("FORBIDDEN", trust.error, 403);
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail("INVALID_JSON", "A valid JSON body is required.", 400);
  }

  const projectId = sanitizeText(body.projectId, 80);
  const origin = sanitizeText(body.origin, 1000);
  const access = await resolveManagedProject(projectId, session);
  if ("error" in access) {
    return access.error;
  }

  if (!origin) {
    return fail("INVALID_ORIGIN", "An origin is required.", 400);
  }

  try {
    const state = await addAllowedOrigin(access.project.id, origin);
    if (!state) {
      return fail("NOT_FOUND", "Embed origin settings not found.", 404);
    }

    return ok({
      origins: state.allowedOrigins,
      autoRegisterReady: false
    });
  } catch (error) {
    return fail("INVALID_ORIGIN", error instanceof Error ? error.message : "The origin is invalid.", 400);
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  const trust = validateTrustedAppMutation(request);
  if (!trust.ok) {
    return fail("FORBIDDEN", trust.error, 403);
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail("INVALID_JSON", "A valid JSON body is required.", 400);
  }

  const projectId = sanitizeText(body.projectId, 80);
  const origin = sanitizeText(body.origin, 1000);
  const access = await resolveManagedProject(projectId, session);
  if ("error" in access) {
    return access.error;
  }

  if (!origin) {
    return fail("INVALID_ORIGIN", "An origin is required.", 400);
  }

  try {
    const state = await removeAllowedOrigin(access.project.id, origin);
    if (!state) {
      return fail("NOT_FOUND", "Embed origin settings not found.", 404);
    }

    return ok({
      origins: state.allowedOrigins,
      autoRegisterReady: false
    });
  } catch (error) {
    return fail("INVALID_ORIGIN", error instanceof Error ? error.message : "The origin is invalid.", 400);
  }
}
