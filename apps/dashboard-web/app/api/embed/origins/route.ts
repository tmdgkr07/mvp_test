import { auth } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";
import { getProjectById } from "@/lib/data-store";
import { addAllowedOrigin, getProjectEmbedState, removeAllowedOrigin } from "@/lib/embed-store";
import { canManageProject } from "@/lib/permissions";
import { sanitizeText } from "@/lib/embed-utils";

export const runtime = "nodejs";

async function resolveManagedProject(projectId: string, userId?: string | null, email?: string | null) {
  if (!userId) {
    return { error: fail("UNAUTHORIZED", "로그인이 필요합니다.", 401) };
  }

  if (!projectId) {
    return { error: fail("INVALID_PROJECT", "projectId가 필요합니다.", 400) };
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return { error: fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404) };
  }

  if (!canManageProject({ user: { id: userId, email } } as any, project.ownerId)) {
    return { error: fail("FORBIDDEN", "origin을 관리할 권한이 없습니다.", 403) };
  }

  return { project };
}

export async function GET(request: Request) {
  const session = await auth();
  const projectId = sanitizeText(new URL(request.url).searchParams.get("projectId"), 80);
  const access = await resolveManagedProject(projectId, session?.user?.id, session?.user?.email);
  if ("error" in access) {
    return access.error;
  }

  const state = await getProjectEmbedState(access.project.id);
  if (!state) {
    return fail("NOT_FOUND", "프로젝트 origin 설정을 찾을 수 없습니다.", 404);
  }

  return ok({
    origins: state.allowedOrigins,
    autoRegisterReady: false
  });
}

export async function POST(request: Request) {
  const session = await auth();
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch (error) {
    return fail("INVALID_JSON", "JSON 요청 본문이 필요합니다.", 400);
  }

  const projectId = sanitizeText(body.projectId, 80);
  const origin = sanitizeText(body.origin, 1000);
  const access = await resolveManagedProject(projectId, session?.user?.id, session?.user?.email);
  if ("error" in access) {
    return access.error;
  }

  if (!origin) {
    return fail("INVALID_ORIGIN", "등록할 origin을 입력해주세요.", 400);
  }

  try {
    const state = await addAllowedOrigin(access.project.id, origin);
    if (!state) {
      return fail("NOT_FOUND", "프로젝트 origin 설정을 찾을 수 없습니다.", 404);
    }

    return ok({
      origins: state.allowedOrigins,
      autoRegisterReady: false
    });
  } catch (error) {
    return fail("INVALID_ORIGIN", error instanceof Error ? error.message : "origin 값이 올바르지 않습니다.", 400);
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch (error) {
    return fail("INVALID_JSON", "JSON 요청 본문이 필요합니다.", 400);
  }

  const projectId = sanitizeText(body.projectId, 80);
  const origin = sanitizeText(body.origin, 1000);
  const access = await resolveManagedProject(projectId, session?.user?.id, session?.user?.email);
  if ("error" in access) {
    return access.error;
  }

  if (!origin) {
    return fail("INVALID_ORIGIN", "삭제할 origin을 입력해주세요.", 400);
  }

  try {
    const state = await removeAllowedOrigin(access.project.id, origin);
    if (!state) {
      return fail("NOT_FOUND", "프로젝트 origin 설정을 찾을 수 없습니다.", 404);
    }

    return ok({
      origins: state.allowedOrigins,
      autoRegisterReady: false
    });
  } catch (error) {
    return fail("INVALID_ORIGIN", error instanceof Error ? error.message : "origin 값이 올바르지 않습니다.", 400);
  }
}
