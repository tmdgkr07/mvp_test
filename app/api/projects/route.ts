import { auth } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";
import { createProject, listProjects } from "@/lib/data-store";
import { isValidUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

export async function GET() {
  const projects = await listProjects();
  return ok({ projects });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  const body = (await request.json()) as {
    name?: string;
    tagline?: string;
    detailContent?: string;
    websiteUrl?: string;
    supportUrl?: string;
    thumbnailUrl?: string;
    status?: "IDEA" | "VALIDATING" | "DEVELOPING" | "RELEASED" | "GROWING" | "PAUSED" | "PIVOTED";
  };

  if (!body.name?.trim()) {
    return fail("INVALID_INPUT", "프로젝트명을 입력해주세요.");
  }

  if (!body.websiteUrl?.trim() || !isValidUrl(body.websiteUrl)) {
    return fail("INVALID_INPUT", "잘못 입력했습니다. 올바른 프로젝트 URL (https://...) 을 입력해주세요.");
  }

  if (!body.supportUrl?.trim() || !isValidUrl(body.supportUrl)) {
    return fail("INVALID_INPUT", "잘못 입력했습니다. 올바른 후원 URL (https://...) 을 입력해주세요.");
  }

  if (body.thumbnailUrl?.trim() && !isValidUrl(body.thumbnailUrl)) {
    return fail("INVALID_INPUT", "잘못 입력했습니다. 올바른 썸네일 URL (https://...) 을 입력해주세요.");
  }

  const project = await createProject(
    {
      name: body.name.trim(),
      tagline: body.tagline,
      detailContent: body.detailContent,
      websiteUrl: body.websiteUrl.trim(),
      supportUrl: body.supportUrl.trim(),
      thumbnailUrl: body.thumbnailUrl?.trim(),
      status: body.status || "IDEA"
    },
    session.user.id
  );

  return ok({ project }, { status: 201 });
}
