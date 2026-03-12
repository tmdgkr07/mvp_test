import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { getProjectById, listOwnedProjects } from "@/lib/data-store";
import { canManageProject } from "@/lib/permissions";
import { getEmbedMetricsSummary } from "@/lib/embed-store";
import { isOfficiallyLaunched } from "@/lib/project-status";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();
  const userProjects = await listOwnedProjects(session);
  const launchedProjects = userProjects.filter((project) => isOfficiallyLaunched(project.status));
  const userProjectIds = launchedProjects.map((project) => project.id);

  if (!projectId) {
    const summary = await getEmbedMetricsSummary(userProjectIds);
    return ok({
      projectIds: userProjectIds,
      summary
    });
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404);
  }

  if (!canManageProject(session, project.ownerId)) {
    return fail("FORBIDDEN", "접근 권한이 없습니다.", 403);
  }

  const summary = await getEmbedMetricsSummary([project.id]);
  return ok({
    projectIds: [project.id],
    summary
  });
}
