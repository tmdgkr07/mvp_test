"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { BarChart2, Bell, Blocks, Download, ExternalLink, MessageSquare, Pencil, Plus, TrendingDown } from "lucide-react";
import { FUNNEL_STAGE_ORDER, getFunnelStageMeta } from "@/lib/funnel";
import type { BuilderDashboardBootstrapData, DashboardPayload, WaitlistEntry } from "@/lib/platform-hub";
import {
  getDisplayStatusValue,
  getProjectStatusMeta,
  PROJECT_STATUS_OPTIONS,
  type DisplayProjectStatus,
  type ProjectStatusTone
} from "@/lib/project-status";
import type { FunnelStage, Project } from "@/lib/types";

const ALL_PROJECTS_KEY = "__all__";

const STATUS_TONE_STYLES: Record<ProjectStatusTone, string> = {
  idea: "bg-gray-100 text-gray-600",
  developing: "bg-orange-50 text-orange-600",
  released: "bg-emerald-50 text-emerald-700",
  paused: "bg-red-50 text-red-600",
  pivoted: "bg-yellow-50 text-yellow-700"
};

type Tab = "overview" | "funnel" | "feedback" | "waitlist" | "rice";
export type BuilderDashboardTab = Tab;
type QuickAction =
  | {
      key: string;
      title: string;
      description: string;
      icon: React.ReactNode;
      href: Route;
    }
  | {
      key: string;
      title: string;
      description: string;
      icon: React.ReactNode;
      action: () => void;
    };

type DashboardResponse = BuilderDashboardBootstrapData & {
  project?: Project;
};

type ApiResult<T> = {
  data?: T;
  error?: { code: string; message: string };
};

type BuilderDashboardProps = {
  initialData?: BuilderDashboardBootstrapData | null;
  initialSelectedProjectId?: string;
  initialTab?: BuilderDashboardTab;
};

const EMPTY_DASHBOARD: DashboardPayload = {
  funnel: [],
  dropOff: [],
  exitReport: [],
  avgSessionSeconds: 0,
  totalSessions: 0,
  feedback: [],
  supportSummary: {
    supportClickCount: 0,
    estimatedAmount: 0,
    totalRice: 0,
    tierBreakdown: []
  }
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(value);
}

export default function BuilderDashboard({
  initialData = null,
  initialSelectedProjectId,
  initialTab = "overview"
}: BuilderDashboardProps) {
  const { data: session } = useSession();
  const lastAppliedInitialProjectIdRef = useRef<string | undefined>(undefined);
  const dashboardCacheRef = useRef<Record<string, DashboardPayload>>(
    initialData ? { [ALL_PROJECTS_KEY]: initialData.dashboard } : {}
  );
  const waitlistCacheRef = useRef<Record<string, WaitlistEntry[]>>(
    initialData ? { [ALL_PROJECTS_KEY]: initialData.waitlist } : {}
  );
  const [projects, setProjects] = useState<Project[]>(initialData?.projects ?? []);
  const [selectedKey, setSelectedKey] = useState<string>(ALL_PROJECTS_KEY);
  const [dashboard, setDashboard] = useState<DashboardPayload>(initialData?.dashboard ?? EMPTY_DASHBOARD);
  const [waitlistCount, setWaitlistCount] = useState(initialData?.waitlistCount ?? 0);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(initialData?.waitlist ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [panelLoading, setPanelLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const selectedProject = projects.find((project) => project.id === selectedKey);
  const isAggregateView = selectedKey === ALL_PROJECTS_KEY;

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialData) {
      dashboardCacheRef.current[ALL_PROJECTS_KEY] = initialData.dashboard;
      waitlistCacheRef.current[ALL_PROJECTS_KEY] = initialData.waitlist;
      setProjects(initialData.projects);
      setWaitlistCount(initialData.waitlistCount ?? 0);
      setDashboard(initialData.dashboard ?? EMPTY_DASHBOARD);
      setWaitlist(initialData.waitlist ?? []);
      setSelectedKey(
        initialSelectedProjectId && initialData.projects.some((project) => project.id === initialSelectedProjectId)
          ? initialSelectedProjectId
          : ALL_PROJECTS_KEY
      );
      lastAppliedInitialProjectIdRef.current = initialSelectedProjectId;
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        const payload = (await response.json()) as ApiResult<DashboardResponse>;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "플랫폼 허브를 불러오지 못했습니다.");
        }

        if (cancelled) {
          return;
        }

        dashboardCacheRef.current[ALL_PROJECTS_KEY] = payload.data.dashboard || EMPTY_DASHBOARD;
        waitlistCacheRef.current[ALL_PROJECTS_KEY] = payload.data.waitlist ?? [];
        setProjects(payload.data.projects);
        setWaitlistCount(payload.data.waitlistCount ?? 0);
        setWaitlist(payload.data.waitlist ?? []);
        setDashboard(payload.data.dashboard || EMPTY_DASHBOARD);
        setSelectedKey(
          initialSelectedProjectId && payload.data.projects.some((project) => project.id === initialSelectedProjectId)
            ? initialSelectedProjectId
            : ALL_PROJECTS_KEY
        );
        lastAppliedInitialProjectIdRef.current = initialSelectedProjectId;
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [initialData, initialSelectedProjectId]);

  useEffect(() => {
    if (loading) return;

    if (lastAppliedInitialProjectIdRef.current !== initialSelectedProjectId) {
      lastAppliedInitialProjectIdRef.current = initialSelectedProjectId;

      if (initialSelectedProjectId && projects.some((project) => project.id === initialSelectedProjectId)) {
        setSelectedKey(initialSelectedProjectId);
        return;
      }

      if (!initialSelectedProjectId && selectedKey !== ALL_PROJECTS_KEY) {
        setSelectedKey(ALL_PROJECTS_KEY);
        return;
      }
    }

    const cacheKey = isAggregateView ? ALL_PROJECTS_KEY : selectedKey;
    const cachedDashboard = dashboardCacheRef.current[cacheKey];
    const cachedWaitlist = waitlistCacheRef.current[cacheKey];
    if (cachedDashboard && cachedWaitlist) {
      setDashboard(cachedDashboard);
      setWaitlist(cachedWaitlist);
      setPanelLoading(false);
      return;
    }

    async function fetchDashboard() {
      try {
        setPanelLoading(true);
        setError(null);

        const endpoint = isAggregateView ? "/api/dashboard" : `/api/dashboard?projectId=${selectedKey}`;
        const response = await fetch(endpoint, { cache: "no-store" });
        const payload = (await response.json()) as ApiResult<DashboardResponse>;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "집계 데이터를 불러오지 못했습니다.");
        }

        const nextDashboard = payload.data.dashboard || EMPTY_DASHBOARD;
        const nextWaitlist = payload.data.waitlist ?? [];
        dashboardCacheRef.current[cacheKey] = nextDashboard;
        waitlistCacheRef.current[cacheKey] = nextWaitlist;
        setDashboard(nextDashboard);
        setWaitlist(nextWaitlist);
      } catch (e) {
        setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        setPanelLoading(false);
      }
    }

    void fetchDashboard();
  }, [initialSelectedProjectId, isAggregateView, loading, projects, selectedKey]);

  useEffect(() => {
    if (loading) return;

    const url = new URL(window.location.href);
    url.pathname = "/dashboard";
    url.searchParams.delete("hub");

    if (selectedKey !== ALL_PROJECTS_KEY) {
      url.searchParams.set("projectId", selectedKey);
    } else {
      url.searchParams.delete("projectId");
    }

    if (activeTab !== "overview") {
      url.searchParams.set("tab", activeTab);
    } else {
      url.searchParams.delete("tab");
    }

    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [activeTab, loading, selectedKey]);

  async function updateSelectedProjectStatus(nextStatus: DisplayProjectStatus) {
    if (!selectedProject || getDisplayStatusValue(selectedProject.status) === nextStatus) {
      return;
    }

    try {
      setStatusUpdating(true);
      setError(null);

      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const payload = (await response.json()) as ApiResult<{ project: Project }>;

      if (!response.ok || !payload.data?.project) {
        throw new Error(payload.error?.message || "상태 변경에 실패했습니다.");
      }

      setProjects((current) =>
        current.map((project) => (project.id === payload.data!.project.id ? payload.data!.project : project))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "상태 변경 중 오류가 발생했습니다.");
    } finally {
      setStatusUpdating(false);
    }
  }

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: "개요", icon: <BarChart2 className="h-4 w-4" /> },
    { id: "funnel", label: "퍼널 분석", icon: <TrendingDown className="h-4 w-4" /> },
    { id: "feedback", label: `피드백${dashboard.feedback.length ? ` (${dashboard.feedback.length})` : ""}`, icon: <MessageSquare className="h-4 w-4" /> },
    { id: "waitlist", label: `알림 신청${waitlist.length ? ` (${waitlist.length})` : ""}`, icon: <Bell className="h-4 w-4" /> },
    { id: "rice", label: `받은 밥알${dashboard.supportSummary.totalRice ? ` (${dashboard.supportSummary.totalRice})` : ""}`, icon: <span className="text-sm">🍚</span> }
  ];

  const summaryCards = [
    { label: "총 방문자 수", value: dashboard.totalSessions, sub: "총 세션 수", color: "text-blue-600" },
    { label: "평균 이용시간", value: `${dashboard.avgSessionSeconds}초`, sub: "세션 종료 기준", color: "text-violet-600" },
    { label: "피드백 수", value: dashboard.feedback.length, sub: "저장된 의견 수", color: "text-emerald-600" }
  ];

  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));
  const headerTitle = isAggregateView ? "종합 집계" : selectedProject?.name ?? "서비스";
  const headerDescription = isAggregateView
    ? "등록한 모든 서비스의 플랫폼 내 반응과 검증 데이터를 합산해 보여줍니다."
    : selectedProject?.tagline ?? "선택한 서비스의 플랫폼 내 반응과 검증 데이터를 보여줍니다.";

  const csvHeader = isAggregateView ? "서비스명,이메일,신청일시" : "이메일,신청일시";
  const csvRows = waitlist.map((entry) => {
    const dateText = new Date(entry.createdAt).toLocaleString("ko-KR");
    if (isAggregateView) {
      return `${projectNameById.get(entry.projectId) ?? "미분류"},${entry.email},${dateText}`;
    }
    return `${entry.email},${dateText}`;
  });

  function downloadWaitlistCsv() {
    if (waitlist.length === 0) {
      return;
    }

    const csv = [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = isAggregateView ? "waitlist_all_projects.csv" : `waitlist_${selectedProject?.name ?? "project"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const totalVotes = useMemo(() => projects.reduce((sum, project) => sum + project.voteCount, 0), [projects]);
  const maxFunnelCount = Math.max(...dashboard.funnel.map((item) => item.count), 1);
  const funnelGuide = FUNNEL_STAGE_ORDER.map((stageKey) => ({
    ...getFunnelStageMeta(stageKey),
    count: dashboard.funnel.find((step) => step.key === stageKey)?.count ?? 0
  }));
  const quickActions: QuickAction[] = [
    {
      key: "register",
      title: projects.length === 0 ? "첫 서비스 등록" : "새 서비스 등록",
      description: "새 아이디어를 바로 등록하고 유입과 반응을 쌓습니다.",
      href: "/register" as Route,
      icon: <Plus className="h-4 w-4" />
    },
    {
      key: "service-hub",
      title: "서비스 허브 열기",
      description: "임베드 코드와 외부 서비스 운영 지표를 바로 확인합니다.",
      href: "/dashboard?hub=service" as Route,
      icon: <Blocks className="h-4 w-4" />
    },
    ...(waitlist.length > 0
      ? [
          {
            key: "download-waitlist",
            title: "대기자 CSV 내려받기",
            description: `${waitlist.length}건의 알림 신청 목록을 바로 추출합니다.`,
            action: () => downloadWaitlistCsv(),
            icon: <Download className="h-4 w-4" />
          }
        ]
      : []),
    ...(dashboard.feedback.length > 0
      ? [
          {
            key: "feedback",
            title: "최근 피드백 확인",
            description: `${dashboard.feedback.length}개의 저장된 의견을 바로 확인합니다.`,
            action: () => setActiveTab("feedback"),
            icon: <MessageSquare className="h-4 w-4" />
          }
        ]
      : []),
    ...(!isAggregateView && selectedProject
      ? [
          {
            key: "edit",
            title: "선택 서비스 수정",
            description: "태그, 소개, 링크를 바로 손봅니다.",
            href: `/register?edit=${selectedProject.id}` as Route,
            icon: <Pencil className="h-4 w-4" />
          }
        ]
      : [])
  ];
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="border-b border-[#EBEBEB] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {session?.user?.image ? (
                <Image src={session.user.image} alt={session.user.name ?? "profile"} width={56} height={56} className="rounded-full ring-2 ring-[#EBEBEB]" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-black text-gray-900">
                  {session?.user?.name?.[0] ?? "M"}
                </div>
              )}
              <div>
                <h1 className="text-xl font-black text-gray-900">{session?.user?.name ?? "메이커"}의 마이페이지</h1>
                <p className="mt-0.5 text-sm text-gray-400">{session?.user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="mr-4 hidden items-center gap-6 sm:flex">
                <div className="text-center">
                  <p className="text-lg font-black text-gray-900">{loading ? "..." : projects.length}</p>
                  <p className="text-xs text-gray-400">등록 서비스 수</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-gray-900">{loading ? "..." : totalVotes}</p>
                  <p className="text-xs text-gray-400">총응원</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-gray-900">{loading ? "..." : waitlistCount}</p>
                  <p className="text-xs text-gray-400">알림 신청</p>
                </div>
              </div>
              <Link href="/register" className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-gray-900 shadow-btn transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-400">
                <Plus className="h-4 w-4" />
                서비스 등록
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {loading && <div className="flex justify-center py-24"><p className="text-sm text-gray-400">불러오는 중...</p></div>}
        {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>}

        {!loading && !error && (
          <div className="flex items-start gap-6">
            <aside className="sticky top-24 w-72 shrink-0">
              <div className="overflow-hidden rounded-2xl border border-[#EBEBEB] bg-white shadow-sm">
                <div className="border-b border-[#EBEBEB] px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">내 서비스</p>
                </div>

                <button type="button" onClick={() => setSelectedKey(ALL_PROJECTS_KEY)} className={`flex w-full items-start gap-3 border-b border-[#F5F5F5] px-4 py-4 text-left transition-colors ${isAggregateView ? "bg-accent/10" : "hover:bg-gray-50"}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3B3] text-[#6B5300]">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-gray-900">종합 집계</p>
                    <p className="mt-1 text-xs text-gray-500">플랫폼 안에서 수집된 전체 반응을 합산해 봅니다.</p>
                  </div>
                </button>

                {projects.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="mb-3 text-sm text-gray-400">등록한 서비스가 없습니다.</p>
                    <Link href="/register" className="inline-block rounded-full bg-accent px-4 py-2 text-xs font-bold text-gray-900 transition-colors hover:bg-yellow-400">
                      첫 서비스 등록
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#F5F5F5]">
                    {projects.map((project) => {
                      const isSelected = selectedKey === project.id;
                      return (
                        <li key={project.id}>
                          <button type="button" onClick={() => setSelectedKey(project.id)} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${isSelected ? "bg-accent/10" : "hover:bg-gray-50"}`}>
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                              <Image src={project.thumbnailUrl} alt={project.name} fill className="object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-sm font-bold ${isSelected ? "text-gray-900" : "text-gray-700"}`}>{project.name}</p>
                              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE_STYLES[getProjectStatusMeta(project.status).tone]}`}>
                                {getProjectStatusMeta(project.status).label}
                              </span>
                            </div>
                            {isSelected ? <div className="h-2 w-2 shrink-0 rounded-full bg-accent" /> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-gray-900">{headerTitle}</h2>
                  <p className="mt-0.5 text-sm text-gray-400">{headerDescription}</p>
                </div>

                {!isAggregateView && selectedProject ? (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 rounded-full border border-[#EBEBEB] bg-white px-3 py-2 text-xs font-bold text-gray-700">
                      <span>상태</span>
                      <select value={getDisplayStatusValue(selectedProject.status)} onChange={(event) => void updateSelectedProjectStatus(event.target.value as DisplayProjectStatus)} disabled={statusUpdating} className="bg-transparent text-xs font-bold outline-none disabled:opacity-60">
                        {PROJECT_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <Link href={`/register?edit=${selectedProject.id}`} className="flex items-center gap-1.5 rounded-full border border-[#EBEBEB] bg-white px-3.5 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50">
                      <Pencil className="h-3 w-3" />
                      수정
                    </Link>
                    {selectedProject.websiteUrl ? (
                      <a href={selectedProject.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full border border-[#EBEBEB] bg-white px-3.5 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50">
                        <ExternalLink className="h-3 w-3" />
                        사이트
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="mb-5 flex flex-wrap gap-1 rounded-xl border border-[#EBEBEB] bg-white p-1 shadow-sm">
                {tabs.map((tab) => (
                  <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${activeTab === tab.id ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {panelLoading ? (
                <div className="rounded-2xl border border-[#EBEBEB] bg-white py-20 text-center shadow-sm">
                  <p className="text-sm text-gray-400">집계 데이터를 불러오는 중...</p>
                </div>
              ) : null}

              {!panelLoading && activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    {summaryCards.map(({ label, value, sub, color }) => (
                      <div key={label} className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                        <p className="mb-2 text-xs font-bold text-gray-400">{label}</p>
                        <p className={`text-3xl font-black ${color}`}>{value}</p>
                        <p className="mt-1 text-xs text-gray-400">{sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">빠른 액션</p>
                      <p className="mt-2 text-sm text-gray-500">지금 상태에서 바로 이어서 해야 할 작업을 모았습니다.</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {quickActions.map((item) =>
                        "href" in item ? (
                          <Link
                            key={item.key}
                            href={item.href}
                            className="rounded-2xl border border-[#EBEBEB] bg-[#FFFCF3] px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[#E5D27A]"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF3B3] text-[#6B5300]">
                              {item.icon}
                            </span>
                            <p className="mt-3 text-sm font-black text-gray-900">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-gray-500">{item.description}</p>
                          </Link>
                        ) : (
                          <button
                            key={item.key}
                            type="button"
                            onClick={item.action}
                            className="rounded-2xl border border-[#EBEBEB] bg-[#FFFCF3] px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#E5D27A]"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF3B3] text-[#6B5300]">
                              {item.icon}
                            </span>
                            <p className="mt-3 text-sm font-black text-gray-900">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-gray-500">{item.description}</p>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">퍼널 요약</p>
                      <p className="mt-2 text-sm text-gray-500">
                        첫 단계인 <strong className="text-gray-700">프로젝트 노출</strong>는 밥주세요 홈 또는 탐색 화면에서
                        서비스 카드가 사용자에게 보인 횟수입니다.
                      </p>
                    </div>
                    {dashboard.funnel.length === 0 ? (
                      <p className="py-4 text-center text-sm text-gray-400">아직 집계 데이터가 없습니다.</p>
                    ) : (
                      <div className="flex items-end gap-2">
                        {dashboard.funnel.map((step, index) => {
                          const meta = getFunnelStageMeta(step.key);
                          const height = Math.max((step.count / maxFunnelCount) * 120, 10);
                          return (
                            <div key={step.key} className="flex flex-1 flex-col items-center gap-1.5" title={`${meta.label}: ${meta.description}`}>
                              <p className="text-xs font-bold text-gray-700">{step.count}</p>
                              <div className="w-full rounded-t-lg" style={{ height, backgroundColor: index === 0 ? "#FFDD59" : `rgba(255,221,89,${1 - index * 0.18})` }} />
                              <p className="text-center text-[10px] leading-tight text-gray-400">{meta.shortLabel}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!panelLoading && activeTab === "funnel" && (
                <div className="space-y-4">
                  {false ? (
                  <div className="rounded-2xl border border-[#F1E2A6] bg-[#FFFBE8] p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#9B7A00]">퍼널 읽는 법</p>
                        <p className="mt-2 text-sm text-gray-600">
                          각 단계가 무엇을 의미하는지 바로 이해할 수 있도록 설명을 함께 제공합니다.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {funnelGuide.map((step, index) => (
                        <div key={step.key} className="rounded-2xl border border-[#F2E7BD] bg-white px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF1A8] text-sm font-black text-[#6B5300]">
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{step.label}</p>
                                <p className="text-xs text-gray-500">{step.helper}</p>
                              </div>
                            </div>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                              {step.count}건
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-gray-600">{step.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  ) : null}

                  <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">단계별 전환</p>
                      <p className="mt-2 text-sm text-gray-500">퍼널 수치는 각 단계 이벤트가 기록된 누적 횟수 기준입니다.</p>
                    </div>
                    {dashboard.funnel.length === 0 ? <p className="py-6 text-center text-sm text-gray-400">퍼널 데이터가 없습니다.</p> : (
                      <ul className="space-y-2">
                        {dashboard.funnel.map((step) => {
                          const meta = getFunnelStageMeta(step.key);
                          return (
                            <li key={step.key} className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3">
                              <div>
                                <span className="text-sm font-semibold text-gray-700">{meta.label}</span>
                                <p className="mt-1 text-xs text-gray-500">{meta.description}</p>
                              </div>
                              <strong className="shrink-0 text-sm font-black text-gray-900">{step.count}건</strong>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">이탈 구간</p>
                      <p className="mt-2 text-sm text-gray-500">어느 단계에서 다음 행동으로 이어지지 않았는지 확인할 수 있습니다.</p>
                    </div>
                    {dashboard.dropOff.length === 0 ? <p className="py-6 text-center text-sm text-gray-400">이탈 데이터가 없습니다.</p> : (
                      <ul className="space-y-2">
                        {dashboard.dropOff.map((item, index) => {
                          const fromMeta = getFunnelStageMeta(item.fromKey);
                          const toMeta = getFunnelStageMeta(item.toKey);
                          return (
                            <li key={`${item.from}-${index}`} className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-sm font-bold text-red-800">{fromMeta.shortLabel} → {toMeta.shortLabel}</span>
                                <span className="text-xs font-bold text-red-600">{item.rate}%</span>
                              </div>
                              <p className="text-xs text-red-500">
                                {item.lostUsers}명이 "{fromMeta.label}" 이후 "{toMeta.label}"까지 이어지지 않았습니다.
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {!panelLoading && activeTab === "feedback" && (
                <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                  <p className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-400">사용자 피드백</p>
                  {dashboard.feedback.length === 0 ? <div className="py-12 text-center"><p className="text-sm text-gray-400">아직 수집된 피드백이 없습니다.</p></div> : (
                    <ul className="space-y-3">
                      {dashboard.feedback.map((item) => (
                        <li key={item.id} className="rounded-xl border border-[#EBEBEB] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <span className={`inline-block shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${item.sentiment === "positive" ? "bg-emerald-100 text-emerald-700" : item.sentiment === "negative" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                              {item.sentiment === "positive" ? "긍정" : item.sentiment === "negative" ? "부정" : "중립"}
                            </span>
                            <time className="shrink-0 text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</time>
                          </div>
                          <p className="mt-2.5 text-sm leading-relaxed text-gray-700">{item.comment}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {!panelLoading && activeTab === "waitlist" && (
                <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">알림 신청 목록</p>
                    {waitlist.length > 0 ? (
                      <button type="button" onClick={downloadWaitlistCsv} className="flex items-center gap-1.5 rounded-full border border-[#EBEBEB] px-3.5 py-1.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50">
                        <Download className="h-3 w-3" />
                        CSV
                      </button>
                    ) : null}
                  </div>

                  {waitlist.length === 0 ? <div className="py-12 text-center"><p className="text-sm text-gray-400">아직 알림 신청자가 없습니다.</p></div> : (
                    <div className="overflow-hidden rounded-xl border border-[#EBEBEB]">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[#EBEBEB] bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400">#</th>
                            {isAggregateView ? <th className="px-4 py-3 text-left text-xs font-bold text-gray-400">서비스</th> : null}
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400">이메일</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400">신청일</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F5F5]">
                          {waitlist.map((entry, index) => (
                            <tr key={`${entry.projectId}-${entry.email}-${index}`} className="transition-colors hover:bg-gray-50">
                              <td className="px-4 py-3 text-xs text-gray-400">{index + 1}</td>
                              {isAggregateView ? <td className="px-4 py-3 text-xs font-medium text-gray-700">{projectNameById.get(entry.projectId) ?? "미분류"}</td> : null}
                              <td className="px-4 py-3 font-medium text-gray-900">{entry.email}</td>
                              <td className="px-4 py-3 text-xs text-gray-400">{new Date(entry.createdAt).toLocaleDateString("ko-KR")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {!panelLoading && activeTab === "rice" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                      <p className="mb-2 text-xs font-bold text-gray-400">받은 밥알 수</p>
                      <p className="text-3xl font-black text-amber-600">{dashboard.supportSummary.totalRice}</p>
                      <p className="mt-1 text-xs text-gray-400">후원 버튼 클릭 기준 추정 밥알</p>
                    </div>
                    <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                      <p className="mb-2 text-xs font-bold text-gray-400">추정 후원 금액</p>
                      <p className="text-3xl font-black text-emerald-600">{formatCurrency(dashboard.supportSummary.estimatedAmount)}</p>
                      <p className="mt-1 text-xs text-gray-400">이벤트 metadata.amount 합산</p>
                    </div>
                    <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                      <p className="mb-2 text-xs font-bold text-gray-400">후원 클릭 수</p>
                      <p className="text-3xl font-black text-blue-600">{dashboard.supportSummary.supportClickCount}</p>
                      <p className="mt-1 text-xs text-gray-400">support_button_click 이벤트 수</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">밥알 상세 내역</p>
                        <p className="mt-1 text-sm text-gray-500">실제 결제 완료가 아니라, 사용자가 후원 버튼을 눌러 이동한 기록 기준입니다.</p>
                      </div>
                    </div>

                    {dashboard.supportSummary.tierBreakdown.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-sm text-gray-400">아직 기록된 밥알 이벤트가 없습니다.</p>
                      </div>
                    ) : (
                      <div className="mt-4 overflow-hidden rounded-xl border border-[#EBEBEB]">
                        <table className="w-full text-sm">
                          <thead className="border-b border-[#EBEBEB] bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400">유형</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400">클릭 수</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400">밥알</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400">금액</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F5F5F5]">
                            {dashboard.supportSummary.tierBreakdown.map((item) => (
                              <tr key={item.tier} className="transition-colors hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{item.label}</td>
                                <td className="px-4 py-3 text-gray-700">{item.count}</td>
                                <td className="px-4 py-3 text-gray-700">{item.rice}</td>
                                <td className="px-4 py-3 text-gray-700">{formatCurrency(item.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
