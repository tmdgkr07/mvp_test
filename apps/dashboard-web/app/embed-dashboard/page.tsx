import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EmbedAnalyticsDashboard from "@/components/EmbedAnalyticsDashboard";
import { auth } from "@/lib/auth";
import { buildLoginHref, buildPathWithSearch } from "@/lib/auth-routing";
import { getProjectById, listOwnedProjects } from "@/lib/data-store";
import { canManageProject } from "@/lib/permissions";
import { getProjectStatusMeta, isOfficiallyLaunched } from "@/lib/project-status";

export const metadata: Metadata = {
  title: "임베드 상세 대시보드 | 밋업중",
  description: "임베드 위젯의 일별 트렌드와 상세 트래킹 데이터를 서비스별로 확인합니다."
};

type EmbedDashboardPageProps = {
  searchParams: Promise<{
    days?: string;
    endDate?: string;
    projectId?: string;
    startDate?: string;
  }>;
};

function normalizeDays(value?: string) {
  const parsed = Number.parseInt(String(value || "30"), 10);
  if (!Number.isFinite(parsed)) {
    return 30;
  }

  return Math.max(7, Math.min(365, parsed));
}

function normalizeDateInput(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
}

export default async function EmbedDashboardPage({ searchParams }: EmbedDashboardPageProps) {
  const params = await searchParams;
  const session = await auth();
  const query = new URLSearchParams();

  if (params.projectId) query.set("projectId", params.projectId);
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.days) query.set("days", params.days);

  const callbackUrl = buildPathWithSearch("/embed-dashboard", query);
  if (!session?.user?.id) {
    redirect(buildLoginHref(callbackUrl) as Route);
  }

  const ownedProjects = await listOwnedProjects(session);
  let selectedProject = params.projectId ? ownedProjects.find((project) => project.id === params.projectId) || null : null;
  if (params.projectId && !selectedProject) {
    const project = await getProjectById(params.projectId);
    if (!project || !canManageProject(session, project.ownerId)) {
      notFound();
    }

    selectedProject = project;
  }

  const initialStartDate = normalizeDateInput(params.startDate);
  const initialEndDate = normalizeDateInput(params.endDate);
  const initialDays = initialStartDate && initialEndDate ? null : normalizeDays(params.days);

  const projectOptions = Array.from(new Map([...ownedProjects, ...(selectedProject ? [selectedProject] : [])].map((project) => [project.id, project])).values())
    .map((project) => ({
      id: project.id,
      isLaunched: isOfficiallyLaunched(project.status),
      name: project.name,
      statusLabel: getProjectStatusMeta(project.status).label
    }))
    .sort((left, right) => {
      if (left.isLaunched !== right.isLaunched) {
        return left.isLaunched ? -1 : 1;
      }

      return left.name.localeCompare(right.name, "ko-KR");
    });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B79A18]">Embed Analytics</p>
          <h1 className="mt-2 text-3xl font-black text-gray-900">
            {selectedProject ? `${selectedProject.name} 상세 대시보드` : "임베드 상세 대시보드"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            서비스별 전환과 기간 변경을 이 페이지 안에서 바로 처리할 수 있습니다. 사용자 지정 기간은 최대 1년까지 조회됩니다.
          </p>
        </div>

        <Link
          href="/dashboard?hub=service"
          className="inline-flex rounded-full border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
        >
          서비스 허브로 돌아가기
        </Link>
      </div>

      <EmbedAnalyticsDashboard
        className="mt-0"
        initialDays={initialDays}
        initialEndDate={initialEndDate}
        initialProjectId={selectedProject?.id || null}
        initialStartDate={initialStartDate}
        projects={projectOptions}
      />
    </main>
  );
}
