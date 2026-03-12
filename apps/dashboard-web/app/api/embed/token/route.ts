import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { getProjectById } from "@/lib/data-store";
import { issueEmbedSnippet } from "@/lib/embed-store";
import { normalizeOrigin, sanitizeText } from "@/lib/embed-utils";
import { canManageProject } from "@/lib/permissions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch (error) {
    return fail("INVALID_JSON", "JSON 요청 본문이 필요합니다.", 400);
  }

  const projectId = sanitizeText(body.projectId, 80);
  if (!projectId) {
    return fail("INVALID_PROJECT", "projectId가 필요합니다.", 400);
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404);
  }

  if (!canManageProject(session, project.ownerId)) {
    return fail("FORBIDDEN", "임베드 코드를 생성할 권한이 없습니다.", 403);
  }

  const originValue = sanitizeText(body.origin, 1000, project.websiteUrl || "");

  try {
    if (!originValue) {
      return fail("INVALID_ORIGIN", "임베드를 설치할 외부 사이트 origin이 필요합니다.", 400);
    }

    const origin = normalizeOrigin(originValue);
    const payload = await issueEmbedSnippet({
      projectId: project.id,
      origin,
      request
    });

    return ok(payload);
  } catch (error) {
    return fail("INVALID_ORIGIN", error instanceof Error ? error.message : "origin 값이 올바르지 않습니다.", 400);
  }
}
