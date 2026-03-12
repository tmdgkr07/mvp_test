"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { FunnelStage, Project } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { RotateCcw, Search, MessageSquare, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";
import { getProjectStatusMeta, matchesDisplayStatusFilter, PROJECT_STATUS_OPTIONS, type ProjectStatusTone } from "@/lib/project-status";

type SupportTierKey = "starter" | "supporter" | "angel";

type ApiResult<T> = {
  data?: T;
  error?: { code: string; message: string };
};

const STATUS_TONE_STYLES: Record<ProjectStatusTone, string> = {
  idea: "bg-gray-100 text-gray-700 border-gray-200",
  developing: "bg-orange-50 text-orange-700 border-orange-200",
  released: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-red-50 text-red-700 border-red-200",
  pivoted: "bg-yellow-50 text-yellow-800 border-yellow-200"
};

const SUPPORT_TIERS: Array<{ key: SupportTierKey; label: string; amount: number }> = [
  { key: "starter", label: "5 밥알", amount: 5000 },
  { key: "supporter", label: "10 밥알", amount: 10000 },
  { key: "angel", label: "30 밥알", amount: 30000 }
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
  const { data: session } = useSession();
  const [projects, setProjects] = useState(initialProjects);
  const [votingProjectIds, setVotingProjectIds] = useState<string[]>([]);
  const [feedbackTarget, setFeedbackTarget] = useState<PendingFeedback | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"LATEST" | "POPULAR">("LATEST");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

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
    setProjects(initialProjects);
  }, [initialProjects]);

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

  async function handleVoteClick(event: MouseEvent<HTMLButtonElement>, projectId: string) {
    event.preventDefault();
    event.stopPropagation();

    if (votingProjectIds.includes(projectId)) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 40,
      spread: 70,
      origin: { x, y },
      colors: ["#FFB84D", "#FFE066", "#FFF3BF"]
    });

    setVotingProjectIds((current) => [...current, projectId]);
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId ? { ...project, voteCount: (project.voteCount || 0) + 1 } : project
      )
    );

    try {
      const response = await fetch(`/api/projects/${projectId}/vote`, { method: "POST" });
      const payload = (await response.json()) as ApiResult<{ project: Project }>;

      if (!response.ok) {
        throw new Error(payload.error?.message || "투표에 실패했습니다.");
      }

      if (payload.data?.project) {
        setProjects((current) =>
          current.map((project) => (project.id === projectId ? payload.data!.project : project))
        );
      }
    } catch {
      setProjects((current) =>
        current.map((project) =>
          project.id === projectId ? { ...project, voteCount: Math.max((project.voteCount || 1) - 1, 0) } : project
        )
      );
    } finally {
      setVotingProjectIds((current) => current.filter((id) => id !== projectId));
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

  const featuredProject = useMemo(
    () =>
      projects.length > 0
        ? projects.find((project) => project.ownerId && session?.user?.id && project.ownerId === session.user.id) ||
          [...projects].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))[0]
        : null,
    [projects, session?.user?.id]
  );
  const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();
  const hasActiveFilters = activeFilter !== "ALL" || sortOrder !== "LATEST" || normalizedSearchQuery.length > 0;
  const visibleProjects = useMemo(() => {
    const filteredProjects = projects.filter((project) => {
      const matchesFilter = matchesDisplayStatusFilter(project.status, activeFilter);
      const matchesSearch =
        normalizedSearchQuery.length === 0 ||
        project.name.toLowerCase().includes(normalizedSearchQuery) ||
        project.tagline.toLowerCase().includes(normalizedSearchQuery) ||
        (project.tags && project.tags.some((tag) => tag.toLowerCase().includes(normalizedSearchQuery)));

      return matchesFilter && matchesSearch;
    });

    return filteredProjects.sort((a, b) => {
      if (sortOrder === "POPULAR") {
        return b.voteCount - a.voteCount || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [activeFilter, normalizedSearchQuery, projects, sortOrder]);

  function resetFilters() {
    setActiveFilter("ALL");
    setSortOrder("LATEST");
    setSearchQuery("");
  }

  return (
    <>
      {/* Project of the Week Banner */}
      {featuredProject && (
        <div className="mt-8 overflow-hidden rounded-3xl bg-[#FFF9C4] border border-[#FFE066] shadow-card">
          <div className="flex flex-col md:flex-row items-center gap-6 p-8 sm:p-10">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <span className="text-xs font-black tracking-widest text-[#8B6914] uppercase">
                  {featuredProject.ownerId === session?.user?.id ? "My Featured Project" : "Project of the Week"}
                </span>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-ink">
                  {featuredProject.name}
                </h2>
                <p className="mt-2 text-base font-medium leading-relaxed text-ink-light">
                  {featuredProject.tagline}
                </p>
              </div>
              <Link
                href={`/project/${featuredProject.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-ink hover:bg-ink/90 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 shadow-btn"
              >
                {featuredProject.ownerId === session?.user?.id ? "내 프로젝트 보러가기" : "이번 주 1위 보러가기"}
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative h-48 w-full md:w-80 overflow-hidden rounded-2xl shadow-card border border-[#FFE066]/50">
              <Image
                src={featuredProject.thumbnailUrl}
                alt={`${featuredProject.name} Thumbnail`}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      )}

      <section className="mt-8">
        {projects.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-[#EBEBEB] bg-white px-6 py-16 text-center">
            <p className="text-lg font-black text-ink">등록된 MVP가 아직 없습니다.</p>
            <p className="mt-2 text-sm text-ink-light">첫 번째 빌더로 프로젝트를 등록해보세요.</p>
          </div>
        )}

        {projects.length > 0 && (
          <>
            <div className="mb-10 flex flex-col gap-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
                <input
                  type="text"
                  placeholder="프로젝트 명, 태그, 키워드로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-[#EBEBEB] bg-white py-3.5 pl-11 pr-5 text-sm font-medium shadow-card transition-all focus:border-ink/30 focus:outline-none placeholder:text-ink-light/60"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setActiveFilter("ALL")}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition-all whitespace-nowrap ${activeFilter === "ALL" ? "bg-ink text-white" : "bg-white border border-[#EBEBEB] text-ink-light hover:border-ink/20 hover:text-ink"}`}
                  >
                    전체
                  </button>
                  {PROJECT_STATUS_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setActiveFilter(value)}
                      className={`rounded-full px-4 py-2 text-sm font-bold transition-all whitespace-nowrap ${activeFilter === value ? "bg-ink text-white" : "bg-white border border-[#EBEBEB] text-ink-light hover:border-ink/20 hover:text-ink"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 rounded-full bg-[#F9F7F3] border border-[#EBEBEB] p-1 self-start sm:self-auto">
                  <button
                    onClick={() => setSortOrder("LATEST")}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition-all whitespace-nowrap ${sortOrder === "LATEST" ? "bg-white text-ink shadow-card" : "text-ink-light hover:text-ink"}`}
                  >
                    최신순
                  </button>
                  <button
                    onClick={() => setSortOrder("POPULAR")}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition-all whitespace-nowrap ${sortOrder === "POPULAR" ? "bg-white text-ink shadow-card" : "text-ink-light hover:text-ink"}`}
                  >
                    🔥 인기순
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-3xl border border-[#EBEBEB] bg-[#FFFCF3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-ink">
                    {visibleProjects.length}개 표시 중
                    <span className="ml-1 text-ink-light">전체 {projects.length}개 서비스</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-light">
                    상태, 검색어, 정렬 기준을 조합해 지금 보고 싶은 서비스만 빠르게 좁힐 수 있습니다.
                  </p>
                </div>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 rounded-full border border-[#EBEBEB] bg-white px-4 py-2 text-xs font-bold text-ink transition-colors hover:bg-ink/5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    필터 초기화
                  </button>
                ) : null}
              </div>
            </div>

            {visibleProjects.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E5D27A] bg-white px-6 py-16 text-center">
                <p className="text-lg font-black text-ink">조건에 맞는 서비스가 없습니다.</p>
                <p className="mt-2 text-sm text-ink-light">검색어를 줄이거나 상태 필터를 초기화해서 다시 찾아보세요.</p>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-accent-dark"
                  >
                    <RotateCcw className="h-4 w-4" />
                    전체 서비스 다시 보기
                  </button>
                ) : null}
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {visibleProjects.map((project, index) => (
                    <motion.article
                      key={project.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.2 }}
                      className="group h-full overflow-hidden rounded-3xl border border-[#EBEBEB] bg-white shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5"
                    >
                      <div className="relative h-52 w-full overflow-hidden bg-[#F9F7F3]">
                        <span className="absolute left-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-ink shadow-btn border border-[#EBEBEB]">
                          {index + 1}
                        </span>
                        <Image
                          src={project.thumbnailUrl}
                          alt={`${project.name} 썸네일`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={(event) => void handleVoteClick(event, project.id)}
                          disabled={votingProjectIds.includes(project.id)}
                          className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-[#FFD27A] bg-white/95 px-3.5 py-2 text-xs font-black text-[#8B6914] shadow-btn backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[#FFC44D] hover:bg-[#FFF8E1] disabled:cursor-not-allowed disabled:opacity-70"
                          aria-label={`${project.name} 인기 올리기, 현재 ${project.voteCount || 0}`}
                          title="클릭해서 인기 올리기"
                        >
                          <span aria-hidden="true">🔥</span>
                          <span>인기 {project.voteCount || 0}</span>
                        </motion.button>
                      </div>

                      <div className="p-5 space-y-4">
                        <div>
                          <div className="mb-3 flex items-center justify-between gap-2">
                            {project.status ? (
                              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${STATUS_TONE_STYLES[getProjectStatusMeta(project.status).tone]}`}>
                                {getProjectStatusMeta(project.status).label}
                              </span>
                            ) : null}
                            <span className="flex items-center gap-1 text-xs font-semibold text-ink-light">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {project.commentCount || 0}
                            </span>
                          </div>
                          <h2 className="text-lg font-black text-ink group-hover:text-[#8B6914] transition-colors line-clamp-1">
                            {project.name}
                          </h2>
                          <p className="mt-1 text-sm leading-relaxed text-ink-light line-clamp-2">
                            {project.tagline}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <a
                            href={project.websiteUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            onClick={() => {
                              markStage(project.id, "website_click");
                              void logEvent({ type: "website_click", projectId: project.id, metadata: { from: "main_card" } });
                            }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-4 text-base font-black text-white transition-all hover:-translate-y-0.5 hover:bg-ink/90"
                          >
                            방문하기
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <Link
                            href={`/project/${project.id}`}
                            className="flex h-[62px] min-w-[132px] shrink-0 items-center justify-center rounded-full border border-[#E3E3E3] bg-white px-5 text-sm font-bold text-[#666666] transition-all hover:-translate-y-0.5 hover:border-[#CFCFCF] hover:text-ink"
                          >
                            자세히 보기
                          </Link>
                        </div>

                        <div className="pt-4 border-t border-[#EBEBEB]">
                          <p className="text-xs font-bold text-ink-light mb-2.5">🍚 밥알로 응원하기</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {SUPPORT_TIERS.map((tier) => (
                              <button
                                key={tier.key}
                                type="button"
                                onClick={() => handleSupportClick(project, tier)}
                                className="rounded-full bg-[#FFF9C4] border border-[#FFE066] hover:bg-accent hover:border-accent px-2 py-2 text-xs font-bold text-[#8B6914] hover:text-ink transition-all hover:-translate-y-0.5"
                              >
                                {tier.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </section>

      {feedbackTarget && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/20 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-card-hover border border-[#EBEBEB]">
            <h3 className="text-xl font-black text-ink mb-1">후원 후 피드백</h3>
            <p className="text-sm text-ink-light">
              <strong className="text-ink">{feedbackTarget.projectName}</strong>에{" "}
              <strong className="text-ink">{feedbackTarget.tierLabel}</strong> 후원을 시도하셨네요.
              짧은 의견을 남겨주시면 빌더에게 큰 도움이 됩니다.
            </p>

            <input
              value={feedbackText}
              onChange={(event) => setFeedbackText(event.target.value)}
              placeholder="한 줄 피드백을 입력해주세요"
              className="mt-5 w-full rounded-2xl border border-[#EBEBEB] bg-[#F9F7F3] px-4 py-3 text-sm outline-none focus:border-ink/20 focus:bg-white transition-colors"
            />

            {feedbackStatus && <p className="mt-3 text-sm text-green-600 font-semibold">{feedbackStatus}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setFeedbackTarget(null)} className="rounded-full border border-[#EBEBEB] px-5 py-2.5 text-sm font-bold text-ink-light hover:text-ink hover:border-ink/20 transition-all">
                닫기
              </button>
              <button
                type="button"
                disabled={submittingFeedback || !feedbackText.trim()}
                onClick={submitFeedback}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-ink/90 transition-all"
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
