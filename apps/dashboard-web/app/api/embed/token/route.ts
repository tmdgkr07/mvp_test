import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { getProjectById } from "@/lib/data-store";
import { issueEmbedSnippet } from "@/lib/embed-store";
import { normalizeOrigin, sanitizeText } from "@/lib/embed-utils";
import { canManageProject } from "@/lib/permissions";
import { validateTrustedAppMutation } from "@/lib/request-guards";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "Login is required.", 401);
  }

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
  if (!projectId) {
    return fail("INVALID_PROJECT", "projectId is required.", 400);
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return fail("NOT_FOUND", "Project not found.", 404);
  }

  if (!canManageProject(session, project.ownerId)) {
    return fail("FORBIDDEN", "You cannot issue embed code for this project.", 403);
  }

  const originValue = sanitizeText(body.origin, 1000, project.websiteUrl || "");

  try {
    if (!originValue) {
      return fail("INVALID_ORIGIN", "An origin is required to issue an embed snippet.", 400);
    }

    const origin = normalizeOrigin(originValue);
    const payload = await issueEmbedSnippet({
      projectId: project.id,
      origin,
      request
    });

    return ok(payload);
  } catch (error) {
    return fail("INVALID_ORIGIN", error instanceof Error ? error.message : "The origin is invalid.", 400);
  }
}
