"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, BarChart2, Check, Clock3, Copy, ExternalLink, HeartHandshake, MessageCircleMore, Plus, Repeat, Search, Sparkles, Users } from "lucide-react";
import type { Project } from "@/lib/types";
import { getProjectStatusMeta, isOfficiallyLaunched, type ProjectStatusTone } from "@/lib/project-status";
import type { ServiceHubBootstrapData } from "@/lib/service-hub";

const ALL_PROJECTS_KEY = "__all__";

const STATUS_TONE_STYLES: Record<ProjectStatusTone, string> = {
  idea: "bg-gray-100 text-gray-600",
  developing: "bg-orange-50 text-orange-600",
  released: "bg-emerald-50 text-emerald-700",
  paused: "bg-red-50 text-red-600",
  pivoted: "bg-yellow-50 text-yellow-700"
};

const METRIC_KEYS = ["visitors", "reactions", "funding", "errors", "duration", "retention"] as const;

type MetricKey = (typeof METRIC_KEYS)[number];

type DashboardResponse = ServiceHubBootstrapData;

type ApiResult<T> = {
  data?: T;
  error?: { code: string; message: string };
};

type MetricCard = {
  key: MetricKey;
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone: string;
};

type MetricToggleState = Record<MetricKey, boolean>;

type EmbedSnippetPayload = {
  snippet: string;
  origin: string;
};

type EmbedSummary = {
  avgDwellSeconds: number;
  donationAttempts: number;
  donationSuccessCount: number;
  errorCount: number;
  feedbackCount: number;
  repeatVisitorRate: number;
  repeatVisitors: number;
  totalAmount: number;
  uniqueVisitors: number;
  views: number;
  visits: number;
  widgetOpens: number;
};

type EmbedSummaryPayload = {
  summary: EmbedSummary;
};

type EmbedOriginsPayload = {
  origins: string[];
  autoRegisterReady: boolean;
};

type CachedOrigins = {
  autoRegisterReady: boolean;
  origins: string[];
};

type CreatorFeedbackMessage = {
  id: string;
  amount: number;
  currency: string;
  supporterName: string | null;
  message: string | null;
  createdAt: string;
  approvedAt: string | null;
  creatorReadAt: string | null;
  project: {
    id: string;
    name: string;
    slug: string;
  };
};

type CreatorFeedbackCounts = {
  all: number;
  read: number;
  unread: number;
};

type CreatorFeedbackPayload = {
  counts: CreatorFeedbackCounts;
  messages: CreatorFeedbackMessage[];
};

const DEFAULT_METRIC_TOGGLES: MetricToggleState = {
  visitors: true,
  reactions: true,
  funding: true,
  errors: true,
  duration: true,
  retention: true
};

function buildExternalMetrics(isAggregateView: boolean, projectCount: number, projectName?: string): MetricCard[] {
  const scopeLabel = isAggregateView ? "전체 배포 서비스 기준" : `${projectName ?? "선택 서비스"} 기준`;

  const metrics: MetricCard[] = [
    {
      key: "visitors",
      title: "방문자 수",
      value: "연동 대기",
      sub: `${scopeLabel} / GA4, Amplitude, Mixpanel 등 외부 방문 데이터`,
      icon: <Users className="h-4 w-4" />,
      tone: "text-blue-600"
    },
    {
      key: "reactions",
      title: "댓글&반응",
      value: "연동 대기",
      sub: `${scopeLabel} / 유튜브, 커뮤니티, SNS 반응 데이터`,
      icon: <MessageCircleMore className="h-4 w-4" />,
      tone: "text-emerald-600"
    },
    {
      key: "funding",
      title: "후원금",
      value: "연동 대기",
      sub: `${scopeLabel} / Stripe, Buy Me a Coffee, 후원 플랫폼 금액`,
      icon: <HeartHandshake className="h-4 w-4" />,
      tone: "text-amber-600"
    },
    {
      key: "errors",
      title: "오류&버그",
      value: "연동 대기",
      sub: `${scopeLabel} / Sentry, LogRocket, CS 이슈 리포트`,
      icon: <AlertTriangle className="h-4 w-4" />,
      tone: "text-red-600"
    },
    {
      key: "duration",
      title: "이용시간",
      value: "연동 대기",
      sub: `${scopeLabel} / 외부 서비스 평균 세션 시간`,
      icon: <Clock3 className="h-4 w-4" />,
      tone: "text-violet-600"
    },
    {
      key: "retention",
      title: "리텐션",
      value: "연동 대기",
      sub: `${scopeLabel} / 재방문, 재사용, 재구매 지표`,
      icon: <Repeat className="h-4 w-4" />,
      tone: "text-sky-600"
    }
  ];

  return metrics.map((item) => ({
    ...item,
    sub: isAggregateView ? `${item.sub} · 배포 서비스 ${projectCount}개 합산 예정` : item.sub
  }));
}

function getEmbedCode(projectName?: string) {
  const name = projectName ?? "service";
  return [
    '<script async src="https://babjuseyo.example/embed.js"></script>',
    `<div data-babjuseyo-banner="${name}"></div>`
  ].join("\n");
}

function getProjectOrigin(project?: Project) {
  if (!project?.websiteUrl) {
    return "";
  }

  try {
    return new URL(project.websiteUrl).origin;
  } catch (error) {
    return "";
  }
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function formatSeconds(value: number) {
  return `${value.toLocaleString("ko-KR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1
  })}초`;
}

function formatPercent(value: number) {
  return `${value.toLocaleString("ko-KR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1
  })}%`;
}

function buildScopedCacheKey(scope: string, projectIds: string[]) {
  return `${scope}:${projectIds.map((item) => item.trim()).filter(Boolean).sort().join(",")}`;
}

function formatCompactDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", {
    day: "numeric",
    month: "short"
  });
}

function buildLiveMetricCards(
  isAggregateView: boolean,
  projectCount: number,
  projectName: string | undefined,
  summary: EmbedSummary | null,
  loading: boolean
): MetricCard[] {
  const scopeLabel = isAggregateView ? "전체 서비스" : `${projectName ?? "선택 서비스"}`;
  const pendingText = loading ? "집계 중" : "-";
  const cards: MetricCard[] = [
    {
      key: "visitors",
      title: "방문자수",
      value: summary ? `${formatInteger(summary.uniqueVisitors)}명` : pendingText,
      sub: summary
        ? `${scopeLabel} / 조회 ${formatInteger(summary.views)}회 · 세션 ${formatInteger(summary.visits)}회`
        : `${scopeLabel} / 임베드 방문 집계를 불러오는 중입니다.`,
      icon: <Users className="h-4 w-4" />,
      tone: "text-blue-600"
    },
    {
      key: "reactions",
      title: "피드백",
      value: summary ? `${formatInteger(summary.feedbackCount)}건` : pendingText,
      sub: summary
        ? `${scopeLabel} / 위젯 열림 ${formatInteger(summary.widgetOpens)}회`
        : `${scopeLabel} / 후원 메시지와 반응 집계를 준비 중입니다.`,
      icon: <MessageCircleMore className="h-4 w-4" />,
      tone: "text-emerald-600"
    },
    {
      key: "funding",
      title: "후원금",
      value: summary ? formatCurrency(summary.totalAmount) : pendingText,
      sub: summary
        ? `${scopeLabel} / 성공 ${formatInteger(summary.donationSuccessCount)}건 · 시도 ${formatInteger(summary.donationAttempts)}건`
        : `${scopeLabel} / 실제 후원 금액을 집계하는 중입니다.`,
      icon: <HeartHandshake className="h-4 w-4" />,
      tone: "text-amber-600"
    },
    {
      key: "errors",
      title: "오류",
      value: summary ? `${formatInteger(summary.errorCount)}건` : pendingText,
      sub: `${scopeLabel} / 오류 수집은 다음 단계에서 확장 예정입니다.`,
      icon: <AlertTriangle className="h-4 w-4" />,
      tone: "text-red-600"
    },
    {
      key: "duration",
      title: "체류시간",
      value: summary ? formatSeconds(summary.avgDwellSeconds) : pendingText,
      sub: summary
        ? `${scopeLabel} / 임베드 방문 평균 체류시간`
        : `${scopeLabel} / 체류시간 집계를 불러오는 중입니다.`,
      icon: <Clock3 className="h-4 w-4" />,
      tone: "text-violet-600"
    },
    {
      key: "retention",
      title: "재방문",
      value: summary ? formatPercent(summary.repeatVisitorRate) : pendingText,
      sub: summary
        ? `${scopeLabel} / 재방문자 ${formatInteger(summary.repeatVisitors)}명`
        : `${scopeLabel} / 재방문 비율 집계를 불러오는 중입니다.`,
      icon: <Repeat className="h-4 w-4" />,
      tone: "text-sky-600"
    }
  ];

  return cards.map((item) => ({
    ...item,
    sub: isAggregateView ? `${item.sub} · ${formatInteger(projectCount)}개 서비스 합산` : item.sub
  }));
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${checked ? "bg-[#FFD84D]" : "bg-[#D9D9D9]"}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function ServiceHub({ initialData = null }: { initialData?: ServiceHubBootstrapData | null }) {
  const { data: session } = useSession();
  const initialAggregateProjectIds = useMemo(
    () => initialData?.projects.filter((project) => isOfficiallyLaunched(project.status)).map((project) => project.id) ?? [],
    [initialData]
  );
  const embedCodeCacheRef = useRef<Record<string, string>>({});
  const summaryCacheRef = useRef<Record<string, EmbedSummary>>(
    initialAggregateProjectIds.length > 0 && initialData
      ? { [buildScopedCacheKey("summary", initialAggregateProjectIds)]: initialData.aggregateSummary }
      : {}
  );
  const feedbackCacheRef = useRef<Record<string, CreatorFeedbackMessage[]>>(
    initialAggregateProjectIds.length > 0 && initialData
      ? { [buildScopedCacheKey("feedback", initialAggregateProjectIds)]: initialData.aggregateFeedbackMessages }
      : {}
  );
  const originsCacheRef = useRef<Record<string, CachedOrigins>>({});
  const [projects, setProjects] = useState<Project[]>(initialData?.projects ?? []);
  const [waitlistCount, setWaitlistCount] = useState(initialData?.waitlistCount ?? 0);
  const [selectedKey, setSelectedKey] = useState<string>(ALL_PROJECTS_KEY);
  const [serviceSearch, setServiceSearch] = useState("");
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [showEmbedGuide, setShowEmbedGuide] = useState(false);
  const [generatedEmbedCode, setGeneratedEmbedCode] = useState("");
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [embedSummary, setEmbedSummary] = useState<EmbedSummary | null>(initialData?.aggregateSummary ?? null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [feedbackMessages, setFeedbackMessages] = useState<CreatorFeedbackMessage[]>(initialData?.aggregateFeedbackMessages ?? []);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>([]);
  const [originInput, setOriginInput] = useState("");
  const [originLoading, setOriginLoading] = useState(false);
  const [originSaving, setOriginSaving] = useState(false);
  const [originError, setOriginError] = useState<string | null>(null);
  const [originMessage, setOriginMessage] = useState<string | null>(null);
  const [autoRegisterReady, setAutoRegisterReady] = useState(false);
  const [metricToggles, setMetricToggles] = useState<MetricToggleState>(DEFAULT_METRIC_TOGGLES);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const eligibleProjects = useMemo(() => projects.filter((project) => isOfficiallyLaunched(project.status)), [projects]);
  const filteredProjects = useMemo(() => {
    const keyword = serviceSearch.trim().toLowerCase();
    if (!keyword) {
      return eligibleProjects;
    }

    return eligibleProjects.filter((project) => {
      const name = project.name.toLowerCase();
      const tagline = project.tagline.toLowerCase();
      const website = project.websiteUrl.toLowerCase();
      return name.includes(keyword) || tagline.includes(keyword) || website.includes(keyword);
    });
  }, [eligibleProjects, serviceSearch]);
  const launchedVoteCount = useMemo(() => eligibleProjects.reduce((sum, project) => sum + project.voteCount, 0), [eligibleProjects]);
  const selectedProject = eligibleProjects.find((project) => project.id === selectedKey);
  const isAggregateView = selectedKey === ALL_PROJECTS_KEY;

  useEffect(() => {
    if (!initialData || initialAggregateProjectIds.length === 0) {
      return;
    }

    summaryCacheRef.current[buildScopedCacheKey("summary", initialAggregateProjectIds)] = initialData.aggregateSummary;
    feedbackCacheRef.current[buildScopedCacheKey("feedback", initialAggregateProjectIds)] = initialData.aggregateFeedbackMessages;
  }, [initialAggregateProjectIds, initialData]);

  useEffect(() => {
    if (initialData) {
      setProjects(initialData.projects);
      setWaitlistCount(initialData.waitlistCount ?? 0);
      setEmbedSummary(initialData.aggregateSummary);
      setFeedbackMessages(initialData.aggregateFeedbackMessages);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      try {
        const response = await fetch("/api/service-hub", { cache: "no-store" });
        const payload = (await response.json()) as ApiResult<DashboardResponse>;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "서비스 허브를 불러오지 못했습니다.");
        }

        if (cancelled) {
          return;
        }

        const aggregateProjectIds = payload.data.projects.filter((project) => isOfficiallyLaunched(project.status)).map((project) => project.id);
        if (aggregateProjectIds.length > 0) {
          summaryCacheRef.current[buildScopedCacheKey("summary", aggregateProjectIds)] = payload.data.aggregateSummary;
          feedbackCacheRef.current[buildScopedCacheKey("feedback", aggregateProjectIds)] = payload.data.aggregateFeedbackMessages;
        }

        setProjects(payload.data.projects);
        setWaitlistCount(payload.data.waitlistCount ?? 0);
        setEmbedSummary(payload.data.aggregateSummary);
        setFeedbackMessages(payload.data.aggregateFeedbackMessages);
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
  }, [initialAggregateProjectIds, initialData]);

  useEffect(() => {
    if (!copyMessage) {
      return;
    }

    const timer = window.setTimeout(() => setCopyMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [copyMessage]);

  useEffect(() => {
    let cancelled = false;

    async function loadEmbedCode() {
      if (!selectedProject) {
        setGeneratedEmbedCode("");
        setEmbedError(null);
        return;
      }

      const embedOrigin = allowedOrigins[allowedOrigins.length - 1] || getProjectOrigin(selectedProject);
      if (!embedOrigin) {
        setGeneratedEmbedCode("");
        setEmbedError("임베드 코드를 생성하려면 먼저 허용 origin을 등록해주세요.");
        return;
      }

      const cacheKey = `${selectedProject.id}:${embedOrigin}`;
      const cachedSnippet = embedCodeCacheRef.current[cacheKey];
      if (cachedSnippet) {
        setGeneratedEmbedCode(cachedSnippet);
        setEmbedError(null);
        return;
      }

      setGeneratedEmbedCode("");
      setEmbedError(null);

      try {
        const response = await fetch("/api/embed/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            projectId: selectedProject.id,
            origin: embedOrigin
          })
        });

        const payload = (await response.json()) as ApiResult<EmbedSnippetPayload>;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "임베드 코드를 생성하지 못했습니다.");
        }

        if (!cancelled) {
          embedCodeCacheRef.current[cacheKey] = payload.data.snippet;
          setGeneratedEmbedCode(payload.data.snippet);
          if (!allowedOrigins.includes(payload.data.origin)) {
            const nextOrigins = [...allowedOrigins, payload.data.origin];
            originsCacheRef.current[selectedProject.id] = {
              autoRegisterReady: false,
              origins: nextOrigins
            };
            setAllowedOrigins(nextOrigins);
            setAutoRegisterReady(false);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setEmbedError(e instanceof Error ? e.message : "임베드 코드를 생성하지 못했습니다.");
        }
      }
    }

    void loadEmbedCode();

    return () => {
      cancelled = true;
    };
  }, [allowedOrigins, selectedProject]);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      if (loading || error) {
        setSummaryLoading(false);
        return;
      }

      if (!isAggregateView && !selectedProject) {
        setSummaryLoading(false);
        setEmbedSummary(null);
        return;
      }

      const scopedProjectIds = isAggregateView ? eligibleProjects.map((project) => project.id) : selectedProject ? [selectedProject.id] : [];
      const cacheKey = buildScopedCacheKey("summary", scopedProjectIds);
      const cachedSummary = summaryCacheRef.current[cacheKey];
      if (cachedSummary) {
        setEmbedSummary(cachedSummary);
        setSummaryLoading(false);
        return;
      }

      setEmbedSummary(null);
      setSummaryLoading(true);

      try {
        const query = !isAggregateView && selectedProject ? `?projectId=${encodeURIComponent(selectedProject.id)}` : "";
        const response = await fetch(`/api/embed/summary${query}`, { cache: "no-store" });
        const payload = (await response.json()) as ApiResult<EmbedSummaryPayload>;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "임베드 지표를 불러오지 못했습니다.");
        }

        if (!cancelled) {
          summaryCacheRef.current[cacheKey] = payload.data.summary;
          setEmbedSummary(payload.data.summary);
        }
      } catch (e) {
        if (!cancelled) {
          setEmbedSummary(null);
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [eligibleProjects, error, isAggregateView, loading, selectedProject]);

  useEffect(() => {
    let cancelled = false;

    async function loadFeedbackMessages() {
      if (loading || error) {
        setFeedbackLoading(false);
        return;
      }

      const scopedProjectIds = isAggregateView ? eligibleProjects.map((project) => project.id) : selectedProject ? [selectedProject.id] : [];
      if (scopedProjectIds.length === 0) {
        setFeedbackMessages([]);
        setFeedbackError(null);
        setFeedbackLoading(false);
        return;
      }

      const cacheKey = buildScopedCacheKey("feedback", scopedProjectIds);
      const cachedMessages = feedbackCacheRef.current[cacheKey];
      if (cachedMessages) {
        setFeedbackMessages(cachedMessages);
        setFeedbackError(null);
        setFeedbackLoading(false);
        return;
      }

      setFeedbackLoading(true);
      setFeedbackError(null);

      try {
        const params = new URLSearchParams({
          limit: "5",
          filter: "all"
        });
        if (isAggregateView) {
          params.set("projectIds", scopedProjectIds.join(","));
        } else if (selectedProject) {
          params.set("projectId", selectedProject.id);
        }
        const response = await fetch(`/api/messages?${params.toString()}`, { cache: "no-store" });
        const payload = (await response.json()) as ApiResult<CreatorFeedbackPayload>;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "피드백 메시지를 불러오지 못했습니다.");
        }

        if (!cancelled) {
          feedbackCacheRef.current[cacheKey] = payload.data.messages;
          setFeedbackMessages(payload.data.messages);
        }
      } catch (e) {
        if (!cancelled) {
          setFeedbackMessages([]);
          setFeedbackError(e instanceof Error ? e.message : "피드백 메시지를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setFeedbackLoading(false);
        }
      }
    }

    void loadFeedbackMessages();

    return () => {
      cancelled = true;
    };
  }, [eligibleProjects, error, isAggregateView, loading, selectedProject]);

  useEffect(() => {
    let cancelled = false;

    async function loadAllowedOrigins() {
      if (!selectedProject) {
        setAllowedOrigins([]);
        setOriginInput("");
        setOriginError(null);
        setOriginMessage(null);
        setOriginLoading(false);
        setAutoRegisterReady(false);
        return;
      }

      const cachedOrigins = originsCacheRef.current[selectedProject.id];
      if (cachedOrigins) {
        setAllowedOrigins(cachedOrigins.origins);
        setAutoRegisterReady(cachedOrigins.autoRegisterReady);
        setOriginLoading(false);
        return;
      }

      setOriginLoading(true);
      setOriginError(null);
      setOriginMessage(null);

      try {
        const response = await fetch(`/api/embed/origins?projectId=${encodeURIComponent(selectedProject.id)}`, { cache: "no-store" });
        const payload = (await response.json()) as ApiResult<EmbedOriginsPayload>;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "허용 origin 목록을 불러오지 못했습니다.");
        }

        if (!cancelled) {
          originsCacheRef.current[selectedProject.id] = {
            autoRegisterReady: payload.data.autoRegisterReady,
            origins: payload.data.origins
          };
          setAllowedOrigins(payload.data.origins);
          setAutoRegisterReady(payload.data.autoRegisterReady);
        }
      } catch (e) {
        if (!cancelled) {
          setAllowedOrigins([]);
          setAutoRegisterReady(false);
          setOriginError(e instanceof Error ? e.message : "허용 origin 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setOriginLoading(false);
        }
      }
    }

    void loadAllowedOrigins();

    return () => {
      cancelled = true;
    };
  }, [selectedProject]);

  const metricCards = useMemo(
    () => buildLiveMetricCards(isAggregateView, eligibleProjects.length, selectedProject?.name, embedSummary, summaryLoading),
    [eligibleProjects.length, embedSummary, isAggregateView, selectedProject?.name, summaryLoading]
  );
  const visibleMetricCards = metricCards.filter((card) => metricToggles[card.key]);

  const headerTitle = isAggregateView ? "종합 집계" : selectedProject?.name ?? "서비스";
  const headerDescription = isAggregateView
    ? "공식 배포 중인 서비스만 대상으로 외부 서비스 지표 연동 현황을 보여줍니다."
    : `${selectedProject?.name ?? "선택 서비스"}의 외부 서비스 추적 지표와 임베드 설정을 관리합니다.`;

  const embedCode = isAggregateView
    ? "프로젝트를 선택하면 실제 임베드 코드가 자동으로 생성됩니다."
    : generatedEmbedCode || "임베드 코드를 불러오는 중입니다.";
  const projectWebsiteOrigin = getProjectOrigin(selectedProject);
  const analyticsDashboardHref = isAggregateView ? "/embed-dashboard" : selectedProject ? `/embed-dashboard?projectId=${encodeURIComponent(selectedProject.id)}` : "/embed-dashboard";
  const feedbackSectionHref = isAggregateView ? "/messages" : selectedProject ? `/messages?projectId=${encodeURIComponent(selectedProject.id)}` : "/messages";
  const visibleProjectCountLabel =
    serviceSearch.trim().length > 0 ? `${filteredProjects.length} / ${eligibleProjects.length}개 표시` : `${eligibleProjects.length}개 서비스`;
  const selectedProjectWebsiteHref = selectedProject?.websiteUrl?.trim() || "";
  const unreadPreviewCount = feedbackMessages.filter((message) => !message.creatorReadAt).length;
  const serviceChecklistItems = [
    {
      key: "snippet",
      label: "임베드 코드 준비",
      status: !!generatedEmbedCode,
      description: generatedEmbedCode ? "외부 서비스에 바로 붙일 수 있는 스니펫이 준비되었습니다." : "서비스를 선택하면 스니펫을 즉시 생성합니다."
    },
    {
      key: "origin",
      label: "허용 origin 설정",
      status: allowedOrigins.length > 0,
      description:
        allowedOrigins.length > 0
          ? `${allowedOrigins.length}개 origin이 등록되었습니다.`
          : "임베드를 붙일 외부 사이트 origin을 먼저 등록해주세요."
    },
    {
      key: "feedback",
      label: "최근 피드백 확인",
      status: feedbackMessages.length > 0,
      description: feedbackMessages.length > 0 ? `최근 피드백 ${feedbackMessages.length}건을 확인했습니다.` : "도착한 후원 메시지가 아직 없습니다."
    }
  ];

  function handleToggle(metricKey: MetricKey) {
    setMetricToggles((current) => ({
      ...current,
      [metricKey]: !current[metricKey]
    }));
  }

  async function handleCopyEmbedCode() {
    if (isAggregateView || !generatedEmbedCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedEmbedCode);
      setCopyMessage("임베드 코드를 복사했습니다.");
    } catch {
      setCopyMessage("브라우저에서 복사를 허용하지 않았습니다.");
    }
  }

  async function refreshAllowedOrigins(projectId: string) {
    const response = await fetch(`/api/embed/origins?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" });
    const payload = (await response.json()) as ApiResult<EmbedOriginsPayload>;

    if (!response.ok || !payload.data) {
      throw new Error(payload.error?.message || "허용 origin 목록을 불러오지 못했습니다.");
    }

    originsCacheRef.current[projectId] = {
      autoRegisterReady: payload.data.autoRegisterReady,
      origins: payload.data.origins
    };
    setAllowedOrigins(payload.data.origins);
    setAutoRegisterReady(payload.data.autoRegisterReady);
  }

  async function handleOriginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject) {
      return;
    }

    setOriginSaving(true);
    setOriginError(null);
    setOriginMessage(null);

    try {
      const response = await fetch("/api/embed/origins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          origin: originInput
        })
      });

      const payload = (await response.json()) as ApiResult<EmbedOriginsPayload>;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "origin을 등록하지 못했습니다.");
      }

      originsCacheRef.current[selectedProject.id] = {
        autoRegisterReady: payload.data.autoRegisterReady,
        origins: payload.data.origins
      };
      setAllowedOrigins(payload.data.origins);
      setAutoRegisterReady(payload.data.autoRegisterReady);
      setOriginInput("");
      setOriginMessage("허용 origin이 등록되었습니다.");
    } catch (e) {
      setOriginError(e instanceof Error ? e.message : "origin을 등록하지 못했습니다.");
    } finally {
      setOriginSaving(false);
    }
  }

  async function handleOriginRemove(origin: string) {
    if (!selectedProject) {
      return;
    }

    setOriginSaving(true);
    setOriginError(null);
    setOriginMessage(null);

    try {
      const response = await fetch("/api/embed/origins", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          origin
        })
      });

      const payload = (await response.json()) as ApiResult<EmbedOriginsPayload>;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "origin을 삭제하지 못했습니다.");
      }

      originsCacheRef.current[selectedProject.id] = {
        autoRegisterReady: payload.data.autoRegisterReady,
        origins: payload.data.origins
      };
      setAllowedOrigins(payload.data.origins);
      setAutoRegisterReady(payload.data.autoRegisterReady);
      setOriginMessage("허용 origin이 삭제되었습니다.");
      if (payload.data.origins.length === 0) {
        await refreshAllowedOrigins(selectedProject.id);
      }
    } catch (e) {
      setOriginError(e instanceof Error ? e.message : "origin을 삭제하지 못했습니다.");
    } finally {
      setOriginSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {loading ? <div className="flex justify-center py-24"><p className="text-sm text-gray-400">불러오는 중...</p></div> : null}
      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div> : null}

      {!loading && !error ? (
        <div className="space-y-8">
          <div className="overflow-hidden rounded-[32px] border border-[#E9DFC2] bg-[linear-gradient(135deg,#FFF9E7_0%,#FFFFFF_48%,#F8FBFF_100%)] px-6 py-8 shadow-[0_24px_50px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
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

              <div className="flex flex-col gap-4 lg:items-end">
                <div className="grid grid-cols-3 gap-3">
                  <div className="min-w-[92px] rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-center shadow-sm">
                    <p className="text-lg font-black text-gray-900">{eligibleProjects.length}</p>
                    <p className="text-xs text-gray-400">배포 서비스</p>
                  </div>
                  <div className="min-w-[92px] rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-center shadow-sm">
                    <p className="text-lg font-black text-gray-900">{launchedVoteCount}</p>
                    <p className="text-xs text-gray-400">총응원</p>
                  </div>
                  <div className="min-w-[92px] rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-center shadow-sm">
                    <p className="text-lg font-black text-gray-900">{waitlistCount}</p>
                    <p className="text-xs text-gray-400">알림 신청</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#F1E2A6] bg-[#FFF7D1] px-3 py-1.5 text-xs font-bold text-[#7A6100]">
                    <Sparkles className="h-3.5 w-3.5" />
                    외부 임베드 운영 허브
                  </span>
                  <Link href="/register" className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-gray-900 shadow-btn transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-400">
                    <Plus className="h-4 w-4" />
                    서비스 등록
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-72">
              <div className="overflow-hidden rounded-2xl border border-[#EBEBEB] bg-white shadow-sm">
                <div className="border-b border-[#EBEBEB] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">내 서비스</p>
                    <span className="text-[11px] font-bold text-gray-400">{visibleProjectCountLabel}</span>
                  </div>
                  <label className="mt-3 flex items-center gap-2 rounded-xl border border-[#EFE7C9] bg-[#FFFCF2] px-3 py-2.5 text-sm text-gray-500">
                    <Search className="h-4 w-4" />
                    <input
                      value={serviceSearch}
                      onChange={(event) => setServiceSearch(event.target.value)}
                      placeholder="서비스 이름 또는 도메인 검색"
                      className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    />
                  </label>
                </div>

                <button type="button" onClick={() => setSelectedKey(ALL_PROJECTS_KEY)} className={`flex w-full items-start gap-3 border-b border-[#F5F5F5] px-4 py-4 text-left transition-colors ${isAggregateView ? "bg-accent/10" : "hover:bg-gray-50"}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3B3] text-[#6B5300]">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-gray-900">종합 집계</p>
                    <p className="mt-1 text-xs text-gray-500">배포 중인 서비스의 외부 지표 연동 현황을 합산합니다.</p>
                  </div>
                </button>

                {eligibleProjects.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="mb-3 text-sm text-gray-400">공식 배포중인 서비스가 없습니다.</p>
                    <Link href="/dashboard?hub=platform" className="inline-block rounded-full bg-accent px-4 py-2 text-xs font-bold text-gray-900 transition-colors hover:bg-yellow-400">
                      플랫폼 허브에서 상태 변경
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#F5F5F5]">
                    {filteredProjects.map((project) => {
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
                {eligibleProjects.length > 0 && filteredProjects.length === 0 ? (
                  <div className="border-t border-[#F5F5F5] px-4 py-6 text-center">
                    <p className="text-sm font-bold text-gray-700">검색 결과가 없습니다.</p>
                    <p className="mt-1 text-xs text-gray-400">다른 키워드로 다시 검색해보세요.</p>
                  </div>
                ) : null}
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black text-gray-900">{headerTitle}</h2>
                  <p className="mt-0.5 text-sm text-gray-400">{headerDescription}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setShowEmbedGuide((prev) => !prev)} className="rounded-full bg-[#FFF3B3] px-4 py-2 text-xs font-black text-[#6B5300] shadow-[0_10px_24px_rgba(214,181,29,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#FFE784]">
                    임베드 하기
                  </button>
                  <a
                    href={analyticsDashboardHref}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#EBEBEB] bg-white px-3.5 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    상세 대시보드
                  </a>
                  {!isAggregateView && selectedProjectWebsiteHref ? (
                    <a
                      href={selectedProjectWebsiteHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#EBEBEB] bg-white px-3.5 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      서비스 열기
                    </a>
                  ) : null}
                  {!isAggregateView && selectedProject ? (
                    <Link href={`/register?edit=${selectedProject.id}`} className="rounded-full border border-[#EBEBEB] bg-white px-3.5 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50">
                      서비스 수정
                    </Link>
                  ) : null}
                </div>
              </div>

              {showEmbedGuide ? (
                <div className="mb-4 rounded-2xl border border-[#E9D989] bg-[#FFFBE8] p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-gray-900">배너 임베드 안내</p>
                      <p className="mt-1 text-sm leading-6 text-gray-600">운영 중인 외부 서비스에 우리 배너를 임베드하면, 원하는 데이터 수집 범위를 켜고 외부 지표 연동 준비를 할 수 있습니다. 위젯을 붙일 외부 사이트 origin은 여기서 직접 등록해 관리합니다.</p>
                    </div>
                    <button type="button" onClick={() => setShowEmbedGuide(false)} className="text-xs font-bold text-gray-500 hover:text-gray-900">닫기</button>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-xl bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">임베드 예시 코드</p>
                        {!isAggregateView && selectedProject ? (
                          <button
                            type="button"
                            onClick={() => void handleCopyEmbedCode()}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#EBEBEB] px-3 py-1.5 text-[11px] font-bold text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            {copyMessage === "임베드 코드를 복사했습니다." ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            코드 복사
                          </button>
                        ) : null}
                      </div>
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-gray-950 p-4 text-xs text-gray-100"><code className="block whitespace-pre-wrap break-all">{embedCode}</code></pre>
                      {copyMessage ? <p className="mt-3 text-xs text-emerald-600">{copyMessage}</p> : null}
                      {embedError ? <p className="mt-3 text-xs text-red-600">{embedError}</p> : null}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">허브 카드 표시</p>
                        <p className="mt-2 text-xs leading-5 text-gray-500">여기 토글은 실제 수집 설정이 아니라 서비스 허브 카드 노출 여부만 바꿉니다.</p>
                        <div className="mt-3 space-y-3">
                          {metricCards.map((card) => (
                            <div key={card.key} className="flex items-center justify-between rounded-xl border border-[#F1EEE2] px-3 py-3">
                              <div>
                                <p className="text-sm font-bold text-gray-900">{card.title}</p>
                                <p className="text-xs text-gray-500">{card.sub}</p>
                              </div>
                              <Toggle checked={metricToggles[card.key]} onChange={() => handleToggle(card.key)} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">허용 origin 관리</p>
                        {isAggregateView || !selectedProject ? (
                          <p className="mt-3 text-xs leading-5 text-gray-500">개별 서비스를 선택하면 해당 서비스의 허용 origin을 직접 등록하고 삭제할 수 있습니다.</p>
                        ) : (
                          <>
                            <p className="mt-3 text-xs leading-5 text-gray-500">
                              `https://도메인` 형식으로 등록하세요. `www` 와 루트 도메인, 서브도메인은 각각 별도 origin입니다.
                            </p>

                            <form onSubmit={handleOriginSubmit} className="mt-3 flex gap-2">
                              <input
                                value={originInput}
                                onChange={(event) => setOriginInput(event.target.value)}
                                placeholder="https://app.example.com"
                                className="min-w-0 flex-1 rounded-xl border border-[#EBEBEB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#D6B51D]"
                              />
                              <button
                                type="submit"
                                disabled={originSaving || !originInput.trim()}
                                className="shrink-0 rounded-xl bg-[#FFF3B3] px-4 py-2.5 text-xs font-black text-[#6B5300] transition-colors hover:bg-[#FFE784] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {originSaving ? "저장 중..." : "origin 추가"}
                              </button>
                            </form>

                            {projectWebsiteOrigin && !allowedOrigins.includes(projectWebsiteOrigin) ? (
                              <button
                                type="button"
                                onClick={() => setOriginInput(projectWebsiteOrigin)}
                                className="mt-2 text-xs font-bold text-[#8A6B00] hover:text-[#6B5300]"
                              >
                                프로젝트 URL origin 채우기: {projectWebsiteOrigin}
                              </button>
                            ) : null}

                            {originMessage ? <p className="mt-3 text-xs text-emerald-600">{originMessage}</p> : null}
                            {originError ? <p className="mt-3 text-xs text-red-600">{originError}</p> : null}

                            <div className="mt-3 space-y-2">
                              {originLoading ? (
                                <p className="text-xs text-gray-500">허용 origin 목록을 불러오는 중입니다.</p>
                              ) : allowedOrigins.length > 0 ? (
                                allowedOrigins.map((origin) => (
                                  <div key={origin} className="flex items-center justify-between gap-3 rounded-xl border border-[#F1EEE2] px-3 py-2.5">
                                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">{origin}</p>
                                    <button
                                      type="button"
                                      onClick={() => void handleOriginRemove(origin)}
                                      disabled={originSaving}
                                      className="shrink-0 rounded-full border border-[#EBEBEB] px-3 py-1.5 text-[11px] font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-xl border border-dashed border-[#E9D989] bg-[#FFFCF3] px-3 py-3 text-xs leading-5 text-gray-600">
                                  등록된 origin이 아직 없습니다. 임베드를 붙일 사이트의 origin을 직접 추가해주세요.
                                </div>
                              )}
                            </div>

                            <p className="mt-3 text-[11px] leading-5 text-gray-400">
                              현재부터는 등록된 origin만 허용됩니다. 새 도메인에 위젯을 붙이기 전에 먼저 여기서 origin을 추가해주세요.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleMetricCards.map((card) => (
                  <div key={card.title} className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-400">{card.title}</p>
                      <div className={card.tone}>{card.icon}</div>
                    </div>
                    <p className={`mt-3 text-3xl font-black ${card.tone}`}>{card.value}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-400">{card.sub}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">운영 체크리스트</p>
                      <p className="mt-2 text-sm text-gray-500">현재 선택한 범위에서 확인해야 할 상태만 빠르게 모았습니다.</p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-[#FFF3B3] px-3 py-1 text-[11px] font-black text-[#6B5300]">
                      {isAggregateView ? "전체 서비스" : "선택 서비스"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {serviceChecklistItems.map((item) => (
                      <div key={item.key} className="flex items-start gap-3 rounded-xl border border-[#F1EEE2] bg-[#FFFCF3] px-4 py-3">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            item.status ? "bg-emerald-50 text-emerald-600" : "bg-[#FFF3B3] text-[#6B5300]"
                          }`}
                        >
                          {item.status ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900">{item.label}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                item.status ? "bg-emerald-50 text-emerald-600" : "bg-[#FFF3B3] text-[#6B5300]"
                              }`}
                            >
                              {item.status ? "준비됨" : "확인 필요"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                        </div>
                      </div>
                    ))}
                    <div className="grid gap-3 rounded-2xl bg-gray-50 p-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">최근 업데이트</p>
                        <p className="mt-2 text-sm font-bold text-gray-900">
                          {feedbackMessages[0] ? formatCompactDate(feedbackMessages[0].approvedAt || feedbackMessages[0].createdAt) : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">허용 origin</p>
                        <p className="mt-2 text-sm font-bold text-gray-900">{allowedOrigins.length}개</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">읽지 않음 미리보기</p>
                        <p className="mt-2 text-sm font-bold text-gray-900">{unreadPreviewCount}건</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">제작자 피드백 메시지</p>
                      <p className="mt-2 text-sm text-gray-500">최근 피드백 메시지 5개만 요약해서 보여줍니다.</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <a href={feedbackSectionHref} className="whitespace-nowrap text-xs font-bold text-[#8A6B00] hover:text-[#6B5300]">
                        전체 보기
                      </a>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {feedbackLoading ? (
                      <div className="rounded-xl border border-dashed border-[#E9D989] bg-[#FFFCF3] px-4 py-5 text-sm text-gray-500">
                        피드백 메시지를 불러오는 중입니다.
                      </div>
                    ) : feedbackError ? (
                      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-600">{feedbackError}</div>
                    ) : feedbackMessages.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[#E9D989] bg-[#FFFCF3] px-4 py-5 text-sm text-gray-500">
                        아직 받은 피드백 메시지가 없습니다. 후원 메시지가 들어오면 최근 순으로 여기에 표시됩니다.
                      </div>
                    ) : (
                      feedbackMessages.map((message) => (
                        <article key={message.id} className="rounded-xl border border-[#F1EEE2] bg-[#FFFCF3] px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-bold text-gray-900">{message.supporterName || "익명 후원자"}</p>
                                {!message.creatorReadAt ? (
                                  <span className="inline-flex rounded-full bg-[#FFF3B3] px-2.5 py-1 text-[11px] font-bold text-[#6B5300]">
                                    읽지 않음
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs text-gray-400">
                                {isAggregateView ? `${message.project.name} · ` : ""}
                                {new Date(message.approvedAt || message.createdAt).toLocaleString("ko-KR")}
                              </p>
                              {message.creatorReadAt ? (
                                <p className="mt-1 text-[11px] font-bold text-emerald-600">
                                  읽음 {new Date(message.creatorReadAt).toLocaleString("ko-KR")}
                                </p>
                              ) : null}
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="inline-flex rounded-full bg-[#FFF3B3] px-3 py-1 text-[11px] font-black text-[#6B5300]">
                                {formatCurrency(message.amount)}
                              </span>
                            </div>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">{message.message}</p>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
