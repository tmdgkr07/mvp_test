import { fail, ok } from "@/lib/api-response";
import { buildDashboard } from "@/lib/analytics";
import { auth } from "@/lib/auth";
import { getProjectById, listEvents, listFeedback, listOwnedProjects } from "@/lib/data-store";
import { canManageProject } from "@/lib/permissions";
import { getPlatformHubBootstrap } from "@/lib/platform-hub";
import { prisma } from "@/lib/prisma";

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
  const userProjectIds = userProjects.map((project) => project.id);

  if (!projectId) {
    return ok(await getPlatformHubBootstrap(session));
  }

  const waitlistCount = userProjectIds.length > 0 ? await prisma.waitlist.count({ where: { projectId: { in: userProjectIds } } }) : 0;

  const project = await getProjectById(projectId);
  if (!project) {
    return fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404);
  }

  if (!canManageProject(session, project.ownerId)) {
    return fail("FORBIDDEN", "접근 권한이 없습니다.", 403);
  }

  const [events, feedback, waitlist] = await Promise.all([
    listEvents(projectId),
    listFeedback(projectId),
    prisma.waitlist.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: { email: true, createdAt: true, projectId: true }
    })
  ]);

  return ok({
    project,
    projects: userProjects,
    waitlistCount,
    waitlist: waitlist.map((entry) => ({
      email: entry.email,
      createdAt: entry.createdAt.toISOString(),
      projectId: entry.projectId
    })),
    dashboard: buildDashboard(events, feedback)
  });
}
