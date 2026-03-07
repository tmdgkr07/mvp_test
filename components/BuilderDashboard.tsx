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

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col rounded-3xl bg-blue-50 p-6 shadow-sm border border-blue-100">
              <span className="text-sm font-bold text-blue-800">👥 총 세션 (방문자)</span>
              <span className="mt-3 text-4xl font-black text-blue-900">{dashboard.totalSessions}</span>
              <p className="mt-2 text-xs font-semibold text-blue-600/70">프로젝트에 관심 보인 유저</p>
            </div>
            <div className="flex flex-col rounded-3xl bg-emerald-50 p-6 shadow-sm border border-emerald-100">
              <span className="text-sm font-bold text-emerald-800">⏱️ 평균 체류(초)</span>
              <span className="mt-3 text-4xl font-black text-emerald-900">{dashboard.avgSessionSeconds}</span>
              <p className="mt-2 text-xs font-semibold text-emerald-600/70">콘텐츠 흡수 시간</p>
            </div>
            <div className="flex flex-col rounded-3xl bg-orange-50 p-6 shadow-sm border border-orange-100">
              <span className="text-sm font-bold text-orange-800">💬 피드백 수</span>
              <span className="mt-3 text-4xl font-black text-orange-900">{dashboard.feedback.length}</span>
              <p className="mt-2 text-xs font-semibold text-orange-600/70">유저의 소중한 의견</p>
            </div>
            <div className="flex flex-col rounded-3xl bg-purple-50 p-6 shadow-sm border border-purple-100">
              <span className="text-sm font-bold text-purple-800">🔥 최종 퍼널</span>
              <span className="mt-3 text-2xl font-black text-purple-900 break-words">{dashboard.funnel.at(-1)?.stage || "-"}</span>
              <p className="mt-2 text-xs font-semibold text-purple-600/70">전환이 가장 많이 일어난 곳</p>
            </div>
          </div>

          <section className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-7 shadow-sm border border-ink/5">
              <h2 className="text-xl font-bold flex items-center gap-2"><span className="text-2xl">📊</span> 퍼널 전환율</h2>
              <ul className="mt-5 space-y-3 text-sm">
                {dashboard.funnel.map((step) => (
                  <li key={step.key} className="flex items-center justify-between rounded-xl bg-ink/5 px-4 py-3 font-medium">
                    <span className="text-ink/80">{step.stage}</span>
                    <strong className="text-ink text-lg">{step.count}건</strong>
                  </li>
                ))}
                {dashboard.funnel.length === 0 && <p className="text-ink/50 py-4">퍼널 데이터가 없습니다.</p>}
              </ul>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-sm border border-ink/5">
              <h2 className="text-xl font-bold flex items-center gap-2"><span className="text-2xl">📉</span> 이탈 분석</h2>
              <ul className="mt-5 space-y-3 text-sm">
                {dashboard.dropOff.map((item, index) => (
                  <li key={`${item.from}-${index}`} className="flex flex-col gap-1 rounded-xl bg-red-50 px-4 py-3">
                    <span className="font-bold text-red-900">{item.from} <span className="text-red-400">→</span> {item.to}</span>
                    <span className="text-red-700">이탈: {item.lostUsers}명 ({item.rate}%)</span>
                  </li>
                ))}
                {dashboard.dropOff.length === 0 && <p className="text-ink/50 py-4">이탈 데이터가 없습니다.</p>}
              </ul>
            </div>
          </section>

          <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm border border-ink/5">
            <h2 className="text-xl font-bold flex items-center gap-2"><span className="text-2xl">💌</span> 실시간 피드백 (VOC)</h2>
            {dashboard.feedback.length === 0 ? (
              <p className="mt-4 rounded-xl bg-ink/5 px-4 py-6 text-center text-sm font-semibold text-ink/50">아직 남겨진 피드백이 없습니다.</p>
            ) : (
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {dashboard.feedback.map((item) => (
                  <li key={item.id} className="flex flex-col justify-between rounded-2xl border border-ink/10 bg-canvas/30 p-5 transition-transform hover:-translate-y-1 hover:shadow-md">
                    <div>
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${item.sentiment === "positive" ? "bg-emerald-100 text-emerald-800" :
                          item.sentiment === "negative" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                        }`}>
                        {item.sentiment === "positive" ? "긍정적" : item.sentiment === "negative" ? "아쉬움" : "중립적"}
                      </span>
                      <p className="mt-3 text-sm font-medium leading-relaxed text-ink">{item.comment}</p>
                    </div>
                    <time className="mt-4 text-xs font-semibold text-ink/40">{new Date(item.createdAt).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</time>
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
