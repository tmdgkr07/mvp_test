"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Feedback, Project } from "@/lib/types";

type DashboardPayload = {
  funnel: Array<{ stage: string; key: string; count: number }>;
  dropOff: Array<{ from: string; to: string; lostUsers: number; rate: number }>;
  exitReport: Array<{ stage: string; exits: number; rate: number }>;
  avgSessionSeconds: number;
  totalSessions: number;
  feedback: Feedback[];
};

type ApiResult<T> = {
  data?: T;
  error?: { code: string; message: string };
};

const EMPTY_DASHBOARD: DashboardPayload = {
  funnel: [],
  dropOff: [],
  exitReport: [],
  avgSessionSeconds: 0,
  totalSessions: 0,
  feedback: []
};

export default function BuilderDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [dashboard, setDashboard] = useState<DashboardPayload>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        const payload = (await response.json()) as ApiResult<{ projects: Project[]; dashboard: DashboardPayload }>;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "대시보드를 불러오지 못했습니다.");
        }

        setProjects(payload.data.projects);
        setDashboard(payload.data.dashboard || EMPTY_DASHBOARD);

        if (payload.data.projects.length > 0) {
          setSelectedProjectId(payload.data.projects[0].id);
        }
      } catch (bootstrapError) {
        setError(bootstrapError instanceof Error ? bootstrapError.message : "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;

    async function fetchDashboard() {
      try {
        const response = await fetch(`/api/dashboard?projectId=${selectedProjectId}`, { cache: "no-store" });
        const payload = (await response.json()) as ApiResult<{ dashboard: DashboardPayload }>;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "데이터를 불러오지 못했습니다.");
        }

        setDashboard(payload.data.dashboard || EMPTY_DASHBOARD);
      } catch (dashboardError) {
        setError(dashboardError instanceof Error ? dashboardError.message : "오류가 발생했습니다.");
      }
    }

    void fetchDashboard();
  }, [selectedProjectId]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-ink">빌더 대시보드</h1>
          <p className="mt-2 text-sm text-ink/70">프로젝트별 유입, 전환, 피드백 지표를 확인하세요.</p>
        </div>
        <Link href="/" className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold hover:bg-ink/5">
          메인으로
        </Link>
      </div>

      {loading && <p className="mt-6 rounded-xl bg-paper px-4 py-3 text-sm text-ink/70">데이터를 불러오는 중입니다...</p>}
      {error && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mt-6 rounded-2xl bg-paper p-5 shadow-card">
            <label className="block text-sm font-semibold text-ink">프로젝트 선택</label>
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            {selectedProject && (
              <p className="mt-3 text-xs text-ink/70">
                상세 페이지: <Link className="underline" href={`/project/${selectedProject.id}`}>/project/{selectedProject.id}</Link>
              </p>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-paper p-5 shadow-card">
              <p className="text-sm text-ink/60">총 세션</p>
              <p className="mt-2 text-3xl font-black text-ink">{dashboard.totalSessions}</p>
            </div>
            <div className="rounded-2xl bg-paper p-5 shadow-card">
              <p className="text-sm text-ink/60">평균 체류(초)</p>
              <p className="mt-2 text-3xl font-black text-ink">{dashboard.avgSessionSeconds}</p>
            </div>
            <div className="rounded-2xl bg-paper p-5 shadow-card">
              <p className="text-sm text-ink/60">피드백 수</p>
              <p className="mt-2 text-3xl font-black text-ink">{dashboard.feedback.length}</p>
            </div>
            <div className="rounded-2xl bg-paper p-5 shadow-card">
              <p className="text-sm text-ink/60">최종 퍼널 단계</p>
              <p className="mt-2 text-lg font-black text-ink">{dashboard.funnel.at(-1)?.stage || "-"}</p>
            </div>
          </div>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-paper p-5 shadow-card">
              <h2 className="text-lg font-bold">퍼널</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {dashboard.funnel.map((step) => (
                  <li key={step.key} className="flex justify-between">
                    <span>{step.stage}</span>
                    <strong>{step.count}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-paper p-5 shadow-card">
              <h2 className="text-lg font-bold">이탈 분석</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {dashboard.dropOff.map((item, index) => (
                  <li key={`${item.from}-${index}`}>
                    {item.from} → {item.to}: {item.lostUsers}명 ({item.rate}%)
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-6 rounded-2xl bg-paper p-5 shadow-card">
            <h2 className="text-lg font-bold">피드백</h2>
            {dashboard.feedback.length === 0 ? (
              <p className="mt-3 text-sm text-ink/70">아직 피드백이 없습니다.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {dashboard.feedback.map((item) => (
                  <li key={item.id} className="rounded-xl border border-ink/10 bg-white p-3 text-sm">
                    <p className="font-semibold">{item.sentiment.toUpperCase()}</p>
                    <p className="mt-1">{item.comment}</p>
                    <p className="mt-1 text-xs text-ink/60">{new Date(item.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
