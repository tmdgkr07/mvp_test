"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Feedback, Project } from "@/lib/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  IDEA: { label: "아이디어", color: "bg-gray-100 text-gray-700" },
  VALIDATING: { label: "검증 중", color: "bg-blue-50 text-blue-700" },
  DEVELOPING: { label: "개발 중", color: "bg-orange-50 text-orange-700" },
  RELEASED: { label: "출시 완료", color: "bg-emerald-50 text-emerald-700" },
  GROWING: { label: "성장 중", color: "bg-indigo-50 text-indigo-700" },
  PAUSED: { label: "일시 중단", color: "bg-red-50 text-red-700" },
  PIVOTED: { label: "피봇", color: "bg-yellow-50 text-yellow-800" }
};

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
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        const payload = (await response.json()) as ApiResult<{ projects: Project[]; waitlistCount: number; dashboard: DashboardPayload }>;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "대시보드를 불러오지 못했습니다.");
        }

        setProjects(payload.data.projects);
        setWaitlistCount(payload.data.waitlistCount ?? 0);
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
          <h1 className="text-3xl font-black text-slate-900">마이페이지</h1>
          <p className="mt-2 text-sm text-slate-500">내 MVP 목록과 데이터를 확인하세요.</p>
        </div>
        <Link href="/register" className="rounded-2xl bg-yellow-400 hover:bg-yellow-500 px-5 py-2.5 text-sm font-bold text-slate-900 transition-all">
          + 서비스 등록
        </Link>
      </div>

      {/* 요약 통계 카드 */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { emoji: "📦", value: projects.length, label: "등록 아이템" },
          { emoji: "🔥", value: projects.reduce((s, p) => s + p.voteCount, 0), label: "총 응원" },
          { emoji: "💬", value: projects.reduce((s, p) => s + p.commentCount, 0), label: "총 댓글" },
          { emoji: "🔔", value: waitlistCount, label: "알림 신청" },
        ].map(({ emoji, value, label }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <span className="text-2xl">{emoji}</span>
            <div>
              <p className="text-xl font-black text-slate-900">{loading ? "…" : value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">불러오는 중...</p>}
      {error && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!loading && !error && (
        <>
          {/* 내 MVP 목록 */}
          <section className="mt-8">
            <h2 className="text-lg font-black text-slate-900 mb-4">내 MVP 목록</h2>

            {projects.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
                <p className="text-slate-400 font-semibold">아직 등록한 서비스가 없습니다.</p>
                <Link href="/register" className="mt-4 inline-block rounded-2xl bg-yellow-400 px-6 py-2.5 text-sm font-bold text-slate-900">
                  첫 서비스 등록하기
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`cursor-pointer rounded-2xl border-2 bg-white overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg ${
                      selectedProjectId === project.id ? "border-yellow-400 shadow-md" : "border-slate-200"
                    }`}
                  >
                    <div className="relative h-40 w-full bg-slate-100">
                      <Image
                        src={project.thumbnailUrl}
                        alt={project.name}
                        fill
                        className="object-cover"
                      />
                      {selectedProjectId === project.id && (
                        <div className="absolute top-3 right-3 bg-yellow-400 text-slate-900 text-xs font-black px-2.5 py-1 rounded-full">
                          선택됨
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        {project.status && STATUS_LABELS[project.status] && (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_LABELS[project.status].color}`}>
                            {STATUS_LABELS[project.status].label}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">🔥 {project.voteCount}</span>
                      </div>
                      <p className="font-black text-slate-900 line-clamp-1">{project.name}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{project.tagline}</p>
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={`/project/${project.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 text-center rounded-xl border border-slate-200 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          상세 보기
                        </Link>
                        <a
                          href={project.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 text-center rounded-xl bg-slate-900 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                        >
                          사이트 열기
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 선택된 프로젝트 분석 */}
          {selectedProjectId && (
            <section className="mt-12">
              <h2 className="text-lg font-black text-slate-900 mb-1">
                {selectedProject?.name} 분석
              </h2>
              <p className="text-sm text-slate-400 mb-6">카드를 클릭하면 해당 서비스 데이터로 전환됩니다.</p>
            </section>
          )}

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
            <div className="flex flex-col rounded-3xl bg-indigo-50 p-6 shadow-sm border border-indigo-100">
              <span className="text-sm font-bold text-indigo-800">🔥 최종 퍼널</span>
              <span className="mt-3 text-2xl font-black text-indigo-900 break-words">{dashboard.funnel.at(-1)?.stage || "-"}</span>
              <p className="mt-2 text-xs font-semibold text-indigo-600/70">전환이 가장 많이 일어난 곳</p>
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
