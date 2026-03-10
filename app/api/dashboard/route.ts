import { fail, ok } from "@/lib/api-response";
import { buildDashboard } from "@/lib/analytics";
import { auth } from "@/lib/auth";
import { getProjectById, listEvents, listFeedback, listProjects } from "@/lib/data-store";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();

  const allProjects = await listProjects();
  const userProjects = allProjects.filter(project => project.ownerId === session.user.id);
  const userProjectIds = userProjects.map(p => p.id);

  const waitlistCount = userProjectIds.length > 0
    ? await prisma.waitlist.count({ where: { projectId: { in: userProjectIds } } })
    : 0;

  if (!projectId) {
    return ok({
      projects: userProjects,
      waitlistCount,
      dashboard: buildDashboard([], [])
    });
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404);
  }

  if (project.ownerId !== session.user.id) {
    return fail("FORBIDDEN", "접근 권한이 없습니다.", 403);
  }

  const [events, feedback] = await Promise.all([listEvents(projectId), listFeedback(projectId)]);
  const dashboard = buildDashboard(events, feedback);

  return ok({ project, projects: userProjects, waitlistCount, dashboard });
}
