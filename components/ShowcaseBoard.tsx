"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FunnelStage, Project } from "@/lib/types";
import VoteButton from "@/components/VoteButton";

type SupportTierKey = "mini_tip" | "coffee" | "meal";

type ApiResult<T> = {
  data?: T;
  error?: { code: string; message: string };
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  IDEA: { label: "아이디어", color: "bg-gray-100 text-gray-700 border-gray-200" },
  VALIDATING: { label: "검증 중", color: "bg-blue-50 text-blue-700 border-blue-200" },
  DEVELOPING: { label: "개발 중", color: "bg-orange-50 text-orange-700 border-orange-200" },
  RELEASED: { label: "출시 완료", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  GROWING: { label: "성장 중", color: "bg-purple-50 text-purple-700 border-purple-200" },
  PAUSED: { label: "일시 중단", color: "bg-red-50 text-red-700 border-red-200" },
  PIVOTED: { label: "피봇", color: "bg-yellow-50 text-yellow-800 border-yellow-200" }
};

const SUPPORT_TIERS: Array<{ key: SupportTierKey; label: string; amount: number }> = [
  { key: "mini_tip", label: "미니팁", amount: 3000 },
  { key: "coffee", label: "커피", amount: 5000 },
  { key: "meal", label: "식사", amount: 10000 }
];

type PendingFeedback = {
  projectId: string;
  projectName: string;
  tierLabel: string;
};

function ensureSessionId(): string {
  const key = "mvp_showcase_session_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const sessionId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
  localStorage.setItem(key, sessionId);
  return sessionId;
}

function appendAmountToUrl(urlValue: string, amount: number): string {
  try {
    const url = new URL(urlValue);
    url.searchParams.set("amount", String(amount));
    return url.toString();
  } catch {
    return urlValue;
  }
}

export default function ShowcaseBoard({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [loading, setLoading] = useState(initialProjects.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<PendingFeedback | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"LATEST" | "POPULAR">("LATEST");
  const [searchQuery, setSearchQuery] = useState("");

  const sessionStartedAtRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>("");
  const stageByProjectRef = useRef<Record<string, FunnelStage>>({});
  const lastActiveProjectRef = useRef<string | undefined>(undefined);
  const pendingFeedbackRef = useRef<PendingFeedback | null>(null);
  const loggedImpressionRef = useRef<Set<string>>(new Set());

  async function logEvent(input: {
    type: "project_impression" | "website_click" | "support_button_click" | "session_end";
    projectId?: string;
    metadata?: Record<string, string | number | boolean | null>;
  }) {
    try {
      const sessionId = sessionIdRef.current || ensureSessionId();
      sessionIdRef.current = sessionId;
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: input.type,
          sessionId,
          projectId: input.projectId,
          metadata: input.metadata
        })
      });
    } catch {
      // ignore analytics failure
    }
  }

  function markStage(projectId: string, stage: FunnelStage) {
    stageByProjectRef.current[projectId] = stage;
    lastActiveProjectRef.current = projectId;
  }

  useEffect(() => {
    const sessionId = ensureSessionId();
    sessionIdRef.current = sessionId;
    sessionStartedAtRef.current = Date.now();

    const onBeforeUnload = () => {
      const projectId = lastActiveProjectRef.current;
      const lastStage = projectId ? stageByProjectRef.current[projectId] || "main_exposure" : "main_exposure";
      const payload = JSON.stringify({
        type: "session_end",
        sessionId,
        projectId,
        metadata: {
          durationMs: Date.now() - sessionStartedAtRef.current,
          lastStage
        }
      });

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/events", blob);
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    const onFocus = () => {
      if (!pendingFeedbackRef.current) return;
      setFeedbackTarget(pendingFeedbackRef.current);
      setFeedbackStatus(null);
      pendingFeedbackRef.current = null;
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    async function refreshProjects() {
      try {
        const response = await fetch("/api/projects", { cache: "no-store" });
        const payload = (await response.json()) as ApiResult<{ projects: Project[] }>;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "프로젝트 목록을 불러오지 못했습니다.");
        }
        setProjects(payload.data.projects);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    void refreshProjects();
  }, []);

  useEffect(() => {
    if (!projects.length) return;

    for (const project of projects) {
      if (loggedImpressionRef.current.has(project.id)) continue;
      loggedImpressionRef.current.add(project.id);
      markStage(project.id, "main_exposure");
      void logEvent({
        type: "project_impression",
        projectId: project.id,
        metadata: { stage: "main_exposure" }
      });
    }
  }, [projects]);

  async function submitFeedback() {
    if (!feedbackTarget || !feedbackText.trim()) return;

    setSubmittingFeedback(true);
    setFeedbackStatus(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: feedbackTarget.projectId,
          sessionId: sessionIdRef.current || ensureSessionId(),
          comment: feedbackText.trim()
        })
      });

      const payload = (await response.json()) as ApiResult<{ feedback: { id: string } }>;
      if (!response.ok) {
        throw new Error(payload.error?.message || "피드백 제출에 실패했습니다.");
      }

      markStage(feedbackTarget.projectId, "feedback_submit");
      setFeedbackStatus("피드백이 저장되었습니다. 감사합니다.");
      setFeedbackText("");
      setFeedbackTarget(null);
    } catch (submitError) {
      setFeedbackStatus(submitError instanceof Error ? submitError.message : "오류가 발생했습니다.");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  function handleSupportClick(project: Project, tier: { key: SupportTierKey; label: string; amount: number }) {
    markStage(project.id, "support_click");
    void logEvent({
      type: "support_button_click",
      projectId: project.id,
      metadata: { tier: tier.key, amount: tier.amount }
    });

    pendingFeedbackRef.current = {
      projectId: project.id,
      projectName: project.name,
      tierLabel: tier.label
    };

    window.open(appendAmountToUrl(project.supportUrl, tier.amount), "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <header className="rounded-3xl bg-ink px-6 py-8 text-paper shadow-card sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">MVP Showcase Web</p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">URL 기반 빌더 홍보 보드 + 후원 루프</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-paper/80 sm:text-base">
          실제로 동작하는 URL로 프로젝트를 소개하고, 별도 앱 없이 브라우저 안에서 후원과 피드백 루프를 완료합니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/register" className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent/90">
            MVP 등록하기
          </Link>
          <Link href="/dashboard" className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
            빌더 대시보드
          </Link>
        </div>
      </header>

      {/* Project of the Week Banner */}
      {projects.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-r from-support/10 via-support/5 to-canvas border border-support/20 p-1">
          <div className="flex flex-col md:flex-row items-center gap-6 p-6 sm:p-8">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-support/20 text-lg">🏆</span>
                <span className="text-sm font-black tracking-widest text-support uppercase">Project of the Week</span>
              </div>
              <div>
                <h2 className="text-3xl font-black text-ink">{[...projects].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))[0].name}</h2>
                <p className="mt-2 text-lg font-medium text-ink/70 leading-relaxed">
                  {[...projects].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))[0].tagline}
                </p>
              </div>
              <Link
                href={`/project/${[...projects].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))[0].id}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-support px-6 py-3 text-lg font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-support/90"
              >
                이번 주 1위 프로젝트 보러가기 🚀
              </Link>
            </div>
            <div className="relative h-48 w-full md:w-80 overflow-hidden rounded-2xl shadow-xl border border-ink/10">
              <Image
                src={[...projects].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))[0].thumbnailUrl}
                alt="Weekly Top Project"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      )}

      <section className="mt-7">
        {loading && <p className="rounded-xl bg-paper px-4 py-3 text-sm text-ink/70">프로젝트를 불러오는 중입니다...</p>}
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {!loading && !error && projects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-paper px-6 py-10 text-center">
            <p className="text-lg font-semibold">등록된 MVP가 아직 없습니다.</p>
            <p className="mt-2 text-sm text-ink/70">첫 번째 빌더로 프로젝트를 등록해보세요.</p>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <>
            <div className="mb-8 flex flex-col gap-6">
              {/* Search Bar */}
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                <input
                  type="text"
                  placeholder="프로젝트 명, 태그, 키워드로 검색해보세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-ink/10 bg-white py-4 pl-14 pr-6 text-lg font-medium shadow-sm transition-all focus:border-ink/30 focus:outline-none focus:ring-4 focus:ring-ink/5"
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveFilter("ALL")}
                    className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${activeFilter === "ALL" ? "bg-ink text-white shadow-md" : "bg-white border border-ink/10 text-ink/70 hover:bg-ink/5"}`}
                  >
                    전체
                  </button>
                  {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                    <button
                      key={key}
                      onClick={() => setActiveFilter(key)}
                      className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${activeFilter === key ? "bg-ink text-white shadow-md" : "bg-white border border-ink/10 text-ink/70 hover:bg-ink/5"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 rounded-xl bg-ink/5 p-1 border border-ink/5">
                  <button
                    onClick={() => setSortOrder("LATEST")}
                    className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-all ${sortOrder === "LATEST" ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"}`}
                  >
                    최신순
                  </button>
                  <button
                    onClick={() => setSortOrder("POPULAR")}
                    className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-all ${sortOrder === "POPULAR" ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"}`}
                  >
                    🔥 인기순
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {projects
                .filter((project) => {
                  const matchesFilter = activeFilter === "ALL" || project.status === activeFilter;
                  const matchesSearch =
                    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    project.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (project.tags && project.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
                  return matchesFilter && matchesSearch;
                })
                .sort((a, b) => {
                  if (sortOrder === "POPULAR") {
                    return b.voteCount - a.voteCount || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  }
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .map((project, index) => (
                  <article key={project.id} className="group overflow-hidden rounded-[24px] border border-ink/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                    <div className="relative h-56 w-full">
                      <div className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-black text-ink shadow-sm backdrop-blur-sm">
                        {index + 1}
                      </div>
                      <Image src={project.thumbnailUrl} alt={`${project.name} 썸네일`} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                    </div>

                    <div className="space-y-5 p-7">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          {project.status && STATUS_LABELS[project.status] && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_LABELS[project.status].color}`}>
                              {STATUS_LABELS[project.status].label}
                            </span>
                          )}
                          <div className="flex items-center gap-3 text-sm font-medium text-ink/60">
                            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex">
                              <VoteButton projectId={project.id} initialVotes={project.voteCount || 0} />
                            </div>
                            <span className="flex items-center gap-1.5" title="댓글/피드백 수">
                              💬 {project.commentCount || 0}
                            </span>
                          </div>
                        </div>
                        <h2 className="text-xl font-extrabold text-ink">{project.name}</h2>
                        <p className="mt-1 text-sm leading-relaxed text-ink/75">{project.tagline}</p>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={project.websiteUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={() => {
                            markStage(project.id, "website_click");
                            void logEvent({ type: "website_click", projectId: project.id, metadata: { from: "main_card" } });
                          }}
                          className="flex-1 rounded-xl bg-support px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-support/90"
                        >
                          웹사이트 바로가기
                        </a>
                        <Link href={`/project/${project.id}`} className="rounded-xl border border-ink/15 px-4 py-3 text-center text-sm font-bold text-ink transition hover:bg-ink hover:text-white">
                          상세보기
                        </Link>
                      </div>

                      <div className="pt-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-ink/45">후원하기</p>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {SUPPORT_TIERS.map((tier) => (
                            <button
                              key={tier.key}
                              type="button"
                              onClick={() => handleSupportClick(project, tier)}
                              className="rounded-lg bg-accent/10 px-2 py-2 text-xs font-bold text-accent hover:bg-accent hover:text-white"
                            >
                              {tier.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </>
        )}
      </section>

      {feedbackTarget && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-paper p-6 shadow-card">
            <h3 className="text-xl font-extrabold">후원 후 피드백</h3>
            <p className="mt-2 text-sm text-ink/75">
              <strong>{feedbackTarget.projectName}</strong>에 <strong>{feedbackTarget.tierLabel}</strong> 후원을 시도하셨네요.
              짧은 의견을 남겨주시면 빌더에게 큰 도움이 됩니다.
            </p>

            <input
              value={feedbackText}
              onChange={(event) => setFeedbackText(event.target.value)}
              placeholder="한 줄 피드백을 입력해주세요"
              className="mt-4 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
            />

            {feedbackStatus && <p className="mt-3 text-sm text-support">{feedbackStatus}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setFeedbackTarget(null)} className="rounded-xl border border-ink/20 px-4 py-2 text-sm font-semibold hover:bg-ink/5">
                닫기
              </button>
              <button
                type="button"
                disabled={submittingFeedback || !feedbackText.trim()}
                onClick={submitFeedback}
                className="rounded-xl bg-support px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-support/60"
              >
                {submittingFeedback ? "저장 중..." : "피드백 제출"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
