import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { getProjectById, listOwnedProjects } from "@/lib/data-store";
import { getEmbedAnalyticsDashboardData } from "@/lib/embed-dashboard";
import { canManageProject } from "@/lib/permissions";
import { isOfficiallyLaunched } from "@/lib/project-status";

export const runtime = "nodejs";

function parseRangeDays(value: string | null) {
  const parsed = Number.parseInt(String(value || "30"), 10);
  if (!Number.isFinite(parsed)) {
    return 30;
  }

  return Math.max(7, Math.min(365, parsed));
}

function parseDateOnly(value: string | null, endOfDay = false) {
  const normalized = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  const timeSuffix = endOfDay ? "T23:59:59.999" : "T00:00:00.000";
  const parsed = new Date(`${normalized}${timeSuffix}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveRequestedRange(searchParams: URLSearchParams) {
  const startDateRaw = searchParams.get("startDate");
  const endDateRaw = searchParams.get("endDate");

  if (!startDateRaw && !endDateRaw) {
    return {
      days: parseRangeDays(searchParams.get("days"))
    };
  }

  if (!startDateRaw || !endDateRaw) {
    return {
      error: fail("INVALID_RANGE", "시작일과 종료일을 함께 입력해야 합니다.", 400)
    };
  }

  const startDate = parseDateOnly(startDateRaw, false);
  const endDate = parseDateOnly(endDateRaw, true);
  if (!startDate || !endDate) {
    return {
      error: fail("INVALID_RANGE", "날짜 형식이 올바르지 않습니다.", 400)
    };
  }

  if (endDate < startDate) {
    return {
      error: fail("INVALID_RANGE", "종료일은 시작일보다 빠를 수 없습니다.", 400)
    };
  }

  const rangeDays = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  if (rangeDays > 365) {
    return {
      error: fail("INVALID_RANGE", "사용자 지정 기간은 최대 1년까지만 조회할 수 있습니다.", 400)
    };
  }

  return {
    days: rangeDays,
    endDate,
    endDateInput: endDateRaw,
    startDate,
    startDateInput: startDateRaw
  };
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();
  const requestedRange = resolveRequestedRange(searchParams);

  if ("error" in requestedRange) {
    return requestedRange.error;
  }

  const ownedProjects = await listOwnedProjects(session);
  const launchedOwnedProjects = ownedProjects.filter((project) => isOfficiallyLaunched(project.status));
  const launchedProjectIds = launchedOwnedProjects.map((project) => project.id);

  if (!projectId) {
    const dashboard = await getEmbedAnalyticsDashboardData(launchedProjectIds, requestedRange);

    return ok({
      dashboard,
      endDate: requestedRange.endDateInput || null,
      projectIds: launchedProjectIds,
      rangeDays: requestedRange.days,
      startDate: requestedRange.startDateInput || null
    });
  }

  const project = ownedProjects.find((item) => item.id === projectId) || (await getProjectById(projectId));
  if (!project) {
    return fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404);
  }

  if (!canManageProject(session, project.ownerId)) {
    return fail("FORBIDDEN", "접근 권한이 없습니다.", 403);
  }

  const dashboard = await getEmbedAnalyticsDashboardData([project.id], requestedRange);
  return ok({
    dashboard,
    endDate: requestedRange.endDateInput || null,
    projectIds: [project.id],
    rangeDays: requestedRange.days,
    startDate: requestedRange.startDateInput || null
  });
}
