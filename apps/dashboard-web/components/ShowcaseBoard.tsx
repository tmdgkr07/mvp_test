"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  HeartHandshake,
  MessageSquareText,
  RotateCcw,
  Search,
  Sparkles
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useDeferredValue, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  getProjectStatusMeta,
  matchesDisplayStatusFilter,
  PROJECT_STATUS_OPTIONS,
  type ProjectStatusTone
} from "@/lib/project-status";
import type { FunnelStage, Project } from "@/lib/types";

type SupportTierKey = "starter" | "supporter" | "angel";

type ApiResult<T> = {
  data?: T;
  error?: { code: string; message: string };
};

type PendingFeedback = {
  projectId: string;
  projectName: string;
  tierLabel: string;
};

const STATUS_TONE_STYLES: Record<ProjectStatusTone, string> = {
  idea: "border-slate-200 bg-slate-100 text-slate-700",
  developing: "border-orange-200 bg-orange-50 text-orange-700",
  released: "border-emerald-200 bg-emerald-50 text-emerald-700",
  paused: "border-rose-200 bg-rose-50 text-rose-700",
  pivoted: "border-amber-200 bg-amber-50 text-amber-700"
};

const SUPPORT_TIERS: Array<{ key: SupportTierKey; label: string; amount: number }> = [
  { key: "starter", label: "5,000원", amount: 5000 },
  { key: "supporter", label: "10,000원", amount: 10000 },
  { key: "angel", label: "30,000원", amount: 30000 }
];

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
      // ignore analytics failures
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
      particleCount: 36,
      spread: 62,
      origin: { x, y },
      colors: ["#1d79d8", "#7fb5ff", "#dceeff"]
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
      {featuredProject ? (
        <section className="panel-card overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_56%,#dfefff_100%)] px-5 py-5 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#bfd8f8] bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d79d8]">
                <Sparkles className="h-3.5 w-3.5" />
                {featuredProject.ownerId === session?.user?.id ? "My Featured Project" : "Most Loved This Week"}
              </div>
              <h2 className="mt-4 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                {featuredProject.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {featuredProject.tagline}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/project/${featuredProject.id}`} className="brand-button">
                  서비스 자세히 보기
                </Link>
                <a
                  href={featuredProject.websiteUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => {
                    markStage(featuredProject.id, "website_click");
                    void logEvent({
                      type: "website_click",
                      projectId: featuredProject.id,
                      metadata: { from: "featured_banner" }
                    });
                  }}
                  className="brand-button-secondary"
                >
                  서비스 방문하기
                </a>
              </div>
            </div>

            <div className="relative h-56 overflow-hidden rounded-[24px] border border-[#dce8f7] bg-white shadow-[0_20px_44px_-30px_rgba(23,68,129,0.34)]">
              <Image
                src={featuredProject.thumbnailUrl}
                alt={`${featuredProject.name} thumbnail`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel-card mt-6 px-5 py-5 sm:px-6">
        <div className="grid gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="프로젝트명, 태그, 키워드로 검색"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="field-input pl-11"
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveFilter("ALL")}
                className={activeFilter === "ALL" ? "brand-button px-4 py-2.5" : "brand-button-secondary px-4 py-2.5"}
              >
                전체
              </button>
              {PROJECT_STATUS_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveFilter(value)}
                  className={activeFilter === value ? "brand-button px-4 py-2.5" : "brand-button-secondary px-4 py-2.5"}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-full border border-[#dce8f7] bg-[#f8fbff] p-1">
                <button
                  type="button"
                  onClick={() => setSortOrder("LATEST")}
                  className={sortOrder === "LATEST" ? "brand-button px-4 py-2.5" : "brand-button-secondary px-4 py-2.5"}
                >
                  최신순
                </button>
                <button
                  type="button"
                  onClick={() => setSortOrder("POPULAR")}
                  className={sortOrder === "POPULAR" ? "brand-button px-4 py-2.5" : "brand-button-secondary px-4 py-2.5"}
                >
                  인기순
                </button>
              </div>

              {hasActiveFilters ? (
                <button type="button" onClick={resetFilters} className="brand-button-secondary gap-2 px-4 py-2.5">
                  <RotateCcw className="h-4 w-4" />
                  초기화
                </button>
              ) : null}
            </div>
          </div>

          <div className="soft-card flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-black text-slate-950">
                {visibleProjects.length}개 표시 중 <span className="text-slate-400">/ 전체 {projects.length}개</span>
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                검색어와 상태를 조합해 지금 살펴보고 싶은 서비스만 빠르게 좁힐 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {projects.length === 0 ? (
        <div className="panel-card mt-6 px-6 py-12 text-center">
          <p className="text-2xl font-black text-slate-950">등록된 서비스가 아직 없습니다.</p>
          <p className="mt-3 text-sm leading-7 text-slate-500">첫 번째 빌더로 프로젝트를 등록해보세요.</p>
        </div>
      ) : null}

      {projects.length > 0 && visibleProjects.length === 0 ? (
        <div className="panel-card mt-6 px-6 py-12 text-center">
          <p className="text-2xl font-black text-slate-950">조건에 맞는 서비스가 없습니다.</p>
          <p className="mt-3 text-sm leading-7 text-slate-500">검색어를 줄이거나 필터를 초기화해 다시 찾아보세요.</p>
          {hasActiveFilters ? (
            <button type="button" onClick={resetFilters} className="brand-button mt-6 gap-2">
              <RotateCcw className="h-4 w-4" />
              전체 서비스 다시 보기
            </button>
          ) : null}
        </div>
      ) : null}

      {visibleProjects.length > 0 ? (
        <motion.div layout className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visibleProjects.map((project, index) => (
              <motion.article
                key={project.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.2 }}
                className="group overflow-hidden rounded-[26px] border border-[#dce8f7] bg-white shadow-[0_20px_44px_-32px_rgba(23,68,129,0.32)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_-28px_rgba(23,68,129,0.36)]"
              >
                <div className="relative h-48 overflow-hidden bg-[#edf5ff]">
                  <span className="absolute left-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-slate-950 shadow-[0_14px_28px_-24px_rgba(23,68,129,0.34)]">
                    {index + 1}
                  </span>
                  <Image
                    src={project.thumbnailUrl}
                    alt={`${project.name} thumbnail`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/45 to-transparent" />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={(event) => void handleVoteClick(event, project.id)}
                    disabled={votingProjectIds.includes(project.id)}
                    className="absolute right-3 top-3 z-20 inline-flex items-center gap-2 rounded-full border border-[#bfd8f8] bg-white/92 px-3 py-1.5 text-xs font-black text-[#1d79d8] shadow-[0_14px_28px_-24px_rgba(23,68,129,0.34)] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#1d79d8] disabled:opacity-70"
                    aria-label={`${project.name} 투표, 현재 ${project.voteCount || 0}`}
                  >
                    👍 {project.voteCount || 0}
                  </motion.button>
                </div>

                <div className="space-y-4 px-4 py-4">
                  <div>
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      {project.status ? (
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${STATUS_TONE_STYLES[getProjectStatusMeta(project.status).tone]}`}>
                          {getProjectStatusMeta(project.status).label}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <MessageSquareText className="h-3.5 w-3.5" />
                        {project.commentCount || 0}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-slate-950">{project.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{project.tagline}</p>
                  </div>

                  {project.tags && project.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {project.tags.slice(0, 4).map((tag) => (
                        <span
                          key={`${project.id}-${tag}`}
                          className="rounded-full border border-[#dce8f7] bg-[#f8fbff] px-3 py-1 text-xs font-semibold text-slate-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <a
                      href={project.websiteUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      onClick={() => {
                        markStage(project.id, "website_click");
                        void logEvent({ type: "website_click", projectId: project.id, metadata: { from: "main_card" } });
                      }}
                      className="brand-button gap-2"
                    >
                      서비스 보기
                      <ArrowUpRight className="h-4 w-4" />
                    </a>

                    <Link href={`/project/${project.id}`} className="brand-button-secondary gap-2">
                      상세 보기
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="rounded-[20px] border border-[#dce8f7] bg-[#f8fbff] px-3.5 py-3.5">
                    <div className="mb-2.5 flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4 text-[#1d79d8]" />
                      <p className="text-sm font-black text-slate-950">후원으로 응원하기</p>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {SUPPORT_TIERS.map((tier) => (
                        <button
                          key={tier.key}
                          type="button"
                          onClick={() => handleSupportClick(project, tier)}
                          className="rounded-full border border-[#bfd8f8] bg-white px-2 py-1.5 text-[11px] font-bold text-[#1d79d8] transition-all hover:-translate-y-0.5 hover:border-[#1d79d8] hover:bg-[#edf5ff]"
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
      ) : null}

      {feedbackTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_26px_56px_-28px_rgba(23,68,129,0.38)]">
            <p className="section-eyebrow">Feedback Prompt</p>
            <h3 className="mt-4 text-2xl font-black text-slate-950">후원 후 짧은 의견 남기기</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              <strong className="text-slate-950">{feedbackTarget.projectName}</strong>에{" "}
              <strong className="text-slate-950">{feedbackTarget.tierLabel}</strong> 후원을 시도하셨네요.
              짧은 의견을 남겨주시면 빌더가 다음 실험을 더 빠르게 이어갈 수 있습니다.
            </p>

            <input
              value={feedbackText}
              onChange={(event) => setFeedbackText(event.target.value)}
              placeholder="한 줄 피드백을 입력해주세요"
              className="field-input mt-5"
            />

            {feedbackStatus ? <p className="mt-3 text-sm font-semibold text-[#15803d]">{feedbackStatus}</p> : null}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setFeedbackTarget(null)} className="brand-button-secondary px-5 py-2.5">
                닫기
              </button>
              <button
                type="button"
                disabled={submittingFeedback || !feedbackText.trim()}
                onClick={() => void submitFeedback()}
                className="brand-button px-5 py-2.5 disabled:opacity-40"
              >
                {submittingFeedback ? "저장 중..." : "피드백 제출"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
