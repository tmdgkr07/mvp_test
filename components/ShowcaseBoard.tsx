"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FunnelStage, Project } from "@/lib/types";
import VoteButton from "@/components/VoteButton";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trophy, MessageSquare, ExternalLink, Info } from "lucide-react";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
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

  const featuredProject = projects.length > 0 ? (
    projects.find(p => p.ownerId && session?.user?.id && p.ownerId === session.user.id) ||
    [...projects].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))[0]
  ) : null;

  return (
    <>
      {/* Header moved to page.tsx for better visibility control */}

      {/* Project of the Week Banner */}
      {featuredProject && (
        <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-r from-support/10 via-support/5 to-canvas border border-support/20 p-1">
          <div className="flex flex-col md:flex-row items-center gap-6 p-6 sm:p-8">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-support/20 text-lg">🏆</span>
                <span className="text-sm font-black tracking-widest text-support uppercase">
                  {featuredProject.ownerId === session?.user?.id ? "My Project" : "Project of the Week"}
                </span>
              </div>
              <div>
                <h2 className="text-3xl font-black text-ink">{featuredProject.name}</h2>
                <p className="mt-2 text-lg font-medium text-ink/70 leading-relaxed">
                  {featuredProject.tagline}
                </p>
              </div>
              <Link
                href={`/project/${featuredProject.id}`}
                className="group inline-flex items-center gap-2 rounded-2xl bg-ink px-6 py-3 text-lg font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-ink/90"
              >
                {featuredProject.ownerId === session?.user?.id ? "내 프로젝트 보러가기" : "이번 주 1위 프로젝트 보러가기"}
                <ExternalLink className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="relative h-48 w-full md:w-80 overflow-hidden rounded-2xl shadow-xl border border-ink/10">
              <Image
                src={featuredProject.thumbnailUrl}
                alt={`${featuredProject.ownerId === session?.user?.id ? "My Project" : "Weekly Top Project"} Thumbnail`}
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
            <div className="mb-12 flex flex-col gap-8">
              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <Search className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-ink/30" />
                <input
                  type="text"
                  placeholder="프로젝트 명, 태그, 키워드로 검색해보세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-3xl border border-ink/5 bg-white py-5 pl-14 pr-6 text-xl font-medium shadow-glass transition-all focus:border-accent/30 focus:outline-none focus:ring-4 focus:ring-accent/5 placeholder:text-ink/20"
                />
              </motion.div>

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

            <motion.div
              layout
              className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
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
                    <motion.article
                      key={project.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="group overflow-hidden rounded-[32px] border border-ink/5 bg-white shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-premium"
                    >
                      <div className="relative h-64 w-full">
                        <div className="absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-sm font-black text-ink shadow-sm backdrop-blur-md">
                          {index + 1}
                        </div>
                        <Image
                          src={project.thumbnailUrl}
                          alt={`${project.name} 썸네일`}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>

                      <div className="space-y-6 p-8">
                        <div>
                          <div className="mb-4 flex items-center justify-between">
                            {project.status && STATUS_LABELS[project.status] && (
                              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${STATUS_LABELS[project.status].color}`}>
                                {STATUS_LABELS[project.status].label}
                              </span>
                            )}
                            <div className="flex items-center gap-4 text-sm font-bold text-ink/40">
                              <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex">
                                <VoteButton projectId={project.id} initialVotes={project.voteCount || 0} />
                              </div>
                              <span className="flex items-center gap-1.5 transition-colors group-hover:text-ink/60" title="댓글/피드백 수">
                                <MessageSquare className="h-4 w-4" />
                                {project.commentCount || 0}
                              </span>
                            </div>
                          </div>
                          <h2 className="text-2xl font-black text-ink group-hover:text-accent transition-colors">{project.name}</h2>
                          <p className="mt-2 text-sm font-medium leading-relaxed text-ink/50 line-clamp-2">{project.tagline}</p>
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
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-ink/80 active:scale-95 shadow-sm"
                          >
                            <span>방문하기</span>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <Link
                            href={`/project/${project.id}`}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-ink/10 px-5 py-3.5 text-sm font-bold text-ink transition-all hover:bg-ink/5 active:scale-95"
                          >
                            <Info className="h-4 w-4" />
                          </Link>
                        </div>

                        <div className="pt-4 border-t border-ink/5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 mb-3 ml-1">Support the Builder</p>
                          <div className="grid grid-cols-3 gap-2">
                            {SUPPORT_TIERS.map((tier) => (
                              <button
                                key={tier.key}
                                type="button"
                                onClick={() => handleSupportClick(project, tier)}
                                className="rounded-xl bg-accent/5 px-2 py-2.5 text-[11px] font-black text-accent transition-all hover:bg-accent hover:text-white"
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
