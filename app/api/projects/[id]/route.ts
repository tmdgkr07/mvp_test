import { auth } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";
import { getProjectById, getProjectMetaById, restoreProject, softDeleteProject, updateProject } from "@/lib/data-store";
import { canManageProject } from "@/lib/permissions";
import { isValidUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Props) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) {
    return fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404);
  }

  return ok({ project });
}

export async function PATCH(request: Request, { params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  const meta = await getProjectMetaById(id);
  if (!meta || meta.deletedAt) {
    return fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404);
  }

  if (!canManageProject(session, meta.ownerId)) {
    return fail("FORBIDDEN", "수정 권한이 없습니다.", 403);
  }

  const body = (await request.json()) as {
    name?: string;
    tagline?: string;
    detailContent?: string;
    websiteUrl?: string;
    supportUrl?: string;
    thumbnailUrl?: string;
  };

  if (body.websiteUrl?.trim() && !isValidUrl(body.websiteUrl)) {
    return fail("INVALID_INPUT", "올바른 프로젝트 URL을 입력해주세요.");
  }

  if (body.supportUrl?.trim() && !isValidUrl(body.supportUrl)) {
    return fail("INVALID_INPUT", "올바른 후원 URL을 입력해주세요.");
  }

  if (body.thumbnailUrl?.trim() && !isValidUrl(body.thumbnailUrl)) {
    return fail("INVALID_INPUT", "올바른 썸네일 URL을 입력해주세요.");
  }

  const project = await updateProject(id, body);
  if (!project) {
    return fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404);
  }

  return ok({ project });
}

export async function DELETE(_: Request, { params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  const meta = await getProjectMetaById(id);
  if (!meta || meta.deletedAt) {
    return fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404);
  }

  if (!canManageProject(session, meta.ownerId)) {
    return fail("FORBIDDEN", "삭제 권한이 없습니다.", 403);
  }

  const project = await softDeleteProject(id, session.user.id);
  if (!project) {
    return fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404);
  }

  return ok({ project });
}

export async function POST(request: Request, { params }: Props) {
  const { id } = await params;
  const url = new URL(request.url);
  if (url.searchParams.get("action") !== "restore") {
    return fail("INVALID_INPUT", "지원하지 않는 요청입니다.", 400);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  const meta = await getProjectMetaById(id);
  if (!meta) {
    return fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404);
  }

  if (!canManageProject(session, meta.ownerId)) {
    return fail("FORBIDDEN", "복구 권한이 없습니다.", 403);
  }

  const project = await restoreProject(id);
  if (!project) {
    return fail("NOT_FOUND", "복구할 프로젝트를 찾을 수 없습니다.", 404);
  }

  return ok({ project });
}
