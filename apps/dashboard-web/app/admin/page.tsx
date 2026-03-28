import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminRoleManager from "@/components/AdminRoleManager";
import { auth } from "@/lib/auth";
import { buildLoginHref } from "@/lib/auth-routing";
import { listAdminUsers, listProjects, listRecentAdminAuditLogs } from "@/lib/data-store";
import { getProjectStatusMeta, isOfficiallyLaunched } from "@/lib/project-status";
import { getUserRole, isAdminSession, isSuperAdminSession } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "관리자 콘솔 | 밥주세요",
  description: "전체 서비스 운영 현황과 권한 변경 내역을 확인합니다."
};

export const preferredRegion = "icn1";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function roleLabel(role: ReturnType<typeof getUserRole>) {
  if (role === "super_admin") {
    return "Super Admin";
  }

  if (role === "admin") {
    return "Admin";
  }

  return "Creator";
}

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(buildLoginHref("/admin") as Route);
  }

  if (!isAdminSession(session)) {
    redirect("/dashboard" as Route);
  }

  const [projects, adminUsers, auditLogs] = await Promise.all([listProjects(), listAdminUsers(), listRecentAdminAuditLogs(20)]);
  const launchedCount = projects.filter((project) => isOfficiallyLaunched(project.status)).length;
  const currentRole = getUserRole(session);
  const canManageRoles = isSuperAdminSession(session);

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-[#E8DCF8] bg-[linear-gradient(135deg,#FBF8FF_0%,#FFFFFF_52%,#FFF8EC_100%)] p-8 shadow-[0_24px_50px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#F3E8FF] px-3 py-1 text-xs font-black text-[#6E3CBC]">관리자 전용</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-gray-500">{roleLabel(currentRole)}</span>
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.28em] text-[#8A63D2]">Admin Console</p>
              <h1 className="mt-3 text-3xl font-black text-gray-900">전체 서비스 운영과 권한 관리</h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                운영 현황은 관리자 전체가 볼 수 있고, 권한 변경은 super admin만 수행할 수 있습니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-center shadow-sm">
                <p className="text-lg font-black text-gray-900">{projects.length}</p>
                <p className="text-xs text-gray-400">전체 서비스</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-center shadow-sm">
                <p className="text-lg font-black text-gray-900">{launchedCount}</p>
                <p className="text-xs text-gray-400">공식 배포중</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-center shadow-sm">
                <p className="text-lg font-black text-gray-900">{adminUsers.length}</p>
                <p className="text-xs text-gray-400">권한 계정</p>
              </div>
              <Link
                href="/dashboard?hub=service"
                className="inline-flex rounded-full border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
              >
                워크스페이스로 이동
              </Link>
            </div>
          </div>
        </section>

        {canManageRoles ? (
          <AdminRoleManager currentUserId={session.user.id} initialAdmins={adminUsers} />
        ) : (
          <section className="rounded-3xl border border-[#EBEBEB] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">권한 변경은 super admin만 수행할 수 있습니다.</p>
            <p className="mt-2 text-sm text-gray-500">현재 계정은 운영 조회 권한만 갖고 있습니다.</p>
          </section>
        )}

        <section className="overflow-hidden rounded-3xl border border-[#EBEBEB] bg-white shadow-sm">
          <div className="border-b border-[#F1F1F1] px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Role Audit Log</p>
          </div>
          <div className="divide-y divide-[#F3F3F3]">
            {auditLogs.length === 0 ? (
              <div className="px-6 py-8 text-sm text-gray-500">아직 기록된 권한 변경 내역이 없습니다.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex flex-col gap-2 px-6 py-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {log.targetEmail} : {log.previousRole || "none"} → {log.nextRole}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">수행자 {log.actorEmail || "-"} / {formatDateTime(log.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#EBEBEB] bg-white shadow-sm">
          <div className="border-b border-[#F1F1F1] px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">All Services</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#FFFCF3] text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-6 py-3">서비스</th>
                  <th className="px-6 py-3">상태</th>
                  <th className="px-6 py-3">소유자 ID</th>
                  <th className="px-6 py-3">웹사이트</th>
                  <th className="px-6 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F3F3]">
                {projects.map((project) => {
                  const statusMeta = getProjectStatusMeta(project.status);

                  return (
                    <tr key={project.id} className="align-top">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{project.name}</p>
                        <p className="mt-1 text-xs text-gray-400">{project.tagline || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            statusMeta.tone === "released"
                              ? "bg-emerald-50 text-emerald-700"
                              : statusMeta.tone === "developing"
                                ? "bg-orange-50 text-orange-600"
                                : statusMeta.tone === "paused"
                                  ? "bg-red-50 text-red-600"
                                  : statusMeta.tone === "pivoted"
                                    ? "bg-yellow-50 text-yellow-700"
                                    : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{project.ownerId || "-"}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {project.websiteUrl ? (
                          <a href={project.websiteUrl} target="_blank" rel="noreferrer" className="hover:text-gray-900 hover:underline">
                            {project.websiteUrl}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/register?edit=${project.id}`}
                            className="rounded-full border border-[#EBEBEB] px-3 py-1.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            수정
                          </Link>
                          <Link
                            href={`/embed-dashboard?projectId=${project.id}`}
                            className="rounded-full border border-[#EBEBEB] px-3 py-1.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            상세 대시보드
                          </Link>
                          <Link
                            href={`/messages?projectId=${project.id}`}
                            className="rounded-full border border-[#EBEBEB] px-3 py-1.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            피드백
                          </Link>
                          <Link
                            href={`/project/${project.id}`}
                            className="rounded-full border border-[#EBEBEB] px-3 py-1.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            공개 페이지
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
