import { fail, ok } from "@/lib/api-response";
import { buildDashboard } from "@/lib/analytics";
import { auth } from "@/lib/auth";
import { getProjectById, listEvents, listFeedback, listProjects } from "@/lib/data-store";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function buildAggregateDashboard(projectIds: string[]) {
  if (projectIds.length === 0) {
    return buildDashboard([], []);
  }

  const [eventsByProject, feedbackByProject] = await Promise.all([
    Promise.all(projectIds.map((projectId) => listEvents(projectId))),
    Promise.all(projectIds.map((projectId) => listFeedback(projectId)))
  ]);

  return buildDashboard(eventsByProject.flat(), feedbackByProject.flat());
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();

  const allProjects = await listProjects();
  const userProjects = allProjects.filter((project) => project.ownerId === session.user.id);
  const userProjectIds = userProjects.map((project) => project.id);

  const [waitlistCount, aggregateWaitlist] = userProjectIds.length > 0
    ? await Promise.all([
        prisma.waitlist.count({ where: { projectId: { in: userProjectIds } } }),
        prisma.waitlist.findMany({
          where: { projectId: { in: userProjectIds } },
          orderBy: { createdAt: "desc" },
          select: { email: true, createdAt: true, projectId: true }
        })
      ])
    : [0, []];

  if (!projectId) {
    const dashboard = await buildAggregateDashboard(userProjectIds);

    return ok({
      projects: userProjects,
      waitlistCount,
      waitlist: aggregateWaitlist.map((entry) => ({
        email: entry.email,
        createdAt: entry.createdAt.toISOString(),
        projectId: entry.projectId
      })),
      dashboard
    });
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404);
  }

  if (project.ownerId !== session.user.id) {
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
