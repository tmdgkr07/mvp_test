import { fail, ok } from "@/lib/api-response";
import { buildDashboard } from "@/lib/analytics";
import { getProjectById, listEvents, listFeedback, listProjects } from "@/lib/data-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();

  const projects = await listProjects();

  if (!projectId) {
    return ok({
      projects,
      dashboard: buildDashboard([], [])
    });
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404);
  }

  const [events, feedback] = await Promise.all([listEvents(projectId), listFeedback(projectId)]);
  const dashboard = buildDashboard(events, feedback);

  return ok({ project, projects, dashboard });
}
