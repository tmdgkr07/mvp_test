"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Blocks,
  Clock3,
  ExternalLink,
  HeartHandshake,
  Link2,
  MessageCircleMore,
  RefreshCcw,
  Users
} from "lucide-react";
import { getProjectStatusMeta, type ProjectStatus, type ProjectStatusTone } from "@/lib/project-status";

type HubProject = {
  id: string;
  name: string;
  slug: string;
  status: ProjectStatus;
  websiteUrl: string;
  thumbnailUrl: string;
};

type EmbedProjectConfig = {
  id: string;
  name: string;
  allowedOrigins: string[];
  requireSignedEmbed: boolean;
  moderateMessages: boolean;
  publicMessages: boolean;
};

type Overview = {
  views: number;
  visits: number;
  uniqueVisitors: number;
  widgetOpens: number;
  donationAttempts: number;
  avgDwellSeconds: number;
  donationSuccessCount: number;
  totalAmount: number;
  feedbackCount: number;
};

type FeedbackItem = {
  orderId: string;
  supporterName: string;
  message: string;
  campaign: string;
  amount: number;
  currency: string;
  status: string;
  approvedAt: string | null;
  createdAt: string;
};

type TopPageItem = {
  host: string | null;
  pagePath: string;
  campaign: string;
  views: number;
  visits: number;
  engagedSeconds: number;
};

type SeriesPoint = {
  day: string;
  views: number;
  visits: number;
  donationSuccessCount: number;
  totalAmount: number;
};

type EmbedHubResponse = {
  projects: HubProject[];
  selectedProjectId: string | null;
  selectedProjectName: string | null;
  serviceUrl: string | null;
  widgetScriptUrl: string | null;
  adminUrl: string | null;
  publicMessagesUrl: string | null;
  websiteOrigin: string | null;
  embedProject: EmbedProjectConfig | null;
  requiresToken: boolean;
  snippet: string | null;
  overview: Overview | null;
  feedback: FeedbackItem[];
  topPages: TopPageItem[];
  series: SeriesPoint[];
};

type ApiResult<T> = {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

type MetricCard = {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone: string;
};

const STATUS_TONE_STYLES: Record<ProjectStatusTone, string> = {
  idea: "bg-gray-100 text-gray-600",
  developing: "bg-orange-50 text-orange-600",
  released: "bg-emerald-50 text-emerald-700",
  paused: "bg-red-50 text-red-600",
  pivoted: "bg-yellow-50 text-yellow-700"
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value || 0);
}

function formatCurrency(value: number, currency = "KRW") {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("ko-KR");
}

function buildMetricCards(overview: Overview | null): MetricCard[] {
  if (!overview) {
    return [];
  }

  return [
    {
      title: "페이지 조회수",
      value: formatNumber(overview.views),
      sub: "위젯이 삽입된 페이지가 실제로 렌더링된 횟수",
      icon: <Users className="h-4 w-4" />,
      tone: "text-sky-600"
    },
    {
      title: "고유 방문 수",
      value: formatNumber(overview.visits),
      sub: "세션 기준 방문 수",
      icon: <Blocks className="h-4 w-4" />,
      tone: "text-blue-600"
    },
    {
      title: "평균 체류시간",
      value: `${overview.avgDwellSeconds.toFixed(1)}초`,
      sub: "방문 세션당 평균 체류 시간",
      icon: <Clock3 className="h-4 w-4" />,
      tone: "text-violet-600"
    },
    {
      title: "후원 시도",
      value: formatNumber(overview.donationAttempts),
      sub: "후원 제출 버튼까지 진행한 횟수",
      icon: <HeartHandshake className="h-4 w-4" />,
      tone: "text-amber-600"
    },
    {
      title: "후원 완료",
      value: formatNumber(overview.donationSuccessCount),
      sub: "실제로 완료 처리된 후원 수",
      icon: <HeartHandshake className="h-4 w-4" />,
      tone: "text-emerald-600"
    },
    {
      title: "후원 메시지",
      value: formatNumber(overview.feedbackCount),
      sub: "메시지를 남긴 후원 수",
      icon: <MessageCircleMore className="h-4 w-4" />,
      tone: "text-rose-600"
    }
  ];
}

function createSeriesPath(values: number[], width: number, height: number, padding: number) {
  const maxValue = Math.max(...values, 1);

  return values
    .map((value, index) => {
      const x = padding + (values.length === 1 ? width / 2 : (index / (values.length - 1)) * width);
      const y = padding + height - (value / maxValue) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function SeriesChart({ series }: { series: SeriesPoint[] }) {
  if (!series.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E5D27A] bg-[#FFFDF2] px-4 py-8 text-sm text-gray-500">
        아직 일별 데이터가 없습니다. 위젯을 실제 페이지에 삽입하면 여기에서 흐름을 볼 수 있습니다.
      </div>
    );
  }

  const width = 660;
  const height = 200;
  const padding = 24;
  const labels = [series[0]?.day, series[Math.floor(series.length / 2)]?.day, series[series.length - 1]?.day].filter(
    Boolean
  ) as string[];
  const views = series.map((item) => item.views);
  const visits = series.map((item) => item.visits);
  const donations = series.map((item) => item.donationSuccessCount);
  const amounts = series.map((item) => item.totalAmount);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs font-bold text-gray-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
          조회수
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#14b8a6]" />
          방문 수
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f97316]" />
          후원 완료
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#7c3aed]" />
          후원 금액
        </span>
      </div>

      <svg viewBox="0 0 720 280" className="w-full overflow-visible rounded-2xl bg-[#F8FAFC]">
        <rect x="0" y="0" width="720" height="280" rx="18" fill="#F8FAFC" />
        {[0, 1, 2, 3].map((index) => {
          const y = padding + (height / 3) * index;
          return (
            <line
              key={index}
              x1={padding}
              x2={padding + width}
              y1={y}
              y2={y}
              stroke="rgba(148, 163, 184, 0.25)"
              strokeWidth="1"
            />
          );
        })}

        <path d={createSeriesPath(views, width, height, padding)} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={createSeriesPath(visits, width, height, padding)} fill="none" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={createSeriesPath(donations, width, height, padding)} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={createSeriesPath(amounts, width, height, padding)} fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {labels.map((label, index) => (
          <text
            key={`${label}-${index}`}
            x={padding + (index / Math.max(labels.length - 1, 1)) * width}
            y={266}
            fill="#64748b"
            fontSize="12"
            textAnchor={index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle"}
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function ServiceHub() {
  const { data: session } = useSession();
  const [data, setData] = useState<EmbedHubResponse | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => data?.projects.find((project) => project.id === (selectedProjectId || data.selectedProjectId || "")) ?? null,
    [data, selectedProjectId]
  );
  const metricCards = useMemo(() => buildMetricCards(data?.overview ?? null), [data]);

  async function loadHub(projectId?: string, nextDays?: number) {
    const resolvedDays = typeof nextDays === "number" ? nextDays : days;
    const resolvedProjectId = projectId ?? selectedProjectId;
    const isFirstLoad = data === null;

    if (isFirstLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError(null);

    try {
      const params = new URLSearchParams({
        days: String(resolvedDays)
      });

      if (resolvedProjectId) {
        params.set("projectId", resolvedProjectId);
      }

      const response = await fetch(`/api/embed-hub?${params.toString()}`, {
        cache: "no-store"
      });
      const payload = (await response.json()) as ApiResult<EmbedHubResponse>;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "임베드 서비스 허브를 불러오지 못했습니다.");
      }

      setData(payload.data);
      if (payload.data.selectedProjectId) {
        setSelectedProjectId(payload.data.selectedProjectId);
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadHub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copySnippet() {
    if (!data?.snippet) {
      return;
    }

    try {
      await navigator.clipboard.writeText(data.snippet);
      setCopyState("done");
    } catch (copyError) {
      setCopyState("error");
    } finally {
      window.setTimeout(() => setCopyState("idle"), 1800);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {loading ? (
        <div className="flex justify-center py-24">
          <p className="text-sm text-gray-400">임베드 서비스 허브를 불러오는 중입니다...</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
      ) : null}

      {!loading && !error ? (
        <div className="space-y-8">
          <section className="rounded-[28px] border border-[#EBEBEB] bg-white px-6 py-7 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "profile"}
                    width={60}
                    height={60}
                    className="rounded-full ring-2 ring-[#EBEBEB]"
                  />
                ) : (
                  <div className="flex h-15 w-15 items-center justify-center rounded-full bg-accent text-xl font-black text-gray-900">
                    {session?.user?.name?.[0] ?? "M"}
                  </div>
                )}

                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#B79A18]">Service Hub</p>
                  <h1 className="mt-2 text-2xl font-black text-gray-900">임베드 후원 위젯 관리</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    서비스 허브에서 실제 임베드 코드, 후원 통계, 최근 메시지를 한 번에 관리합니다.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 rounded-full border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-bold text-gray-700">
                  <span>집계 기간</span>
                  <select
                    value={days}
                    onChange={(event) => {
                      const nextDays = Number(event.target.value);
                      setDays(nextDays);
                      void loadHub(selectedProjectId, nextDays);
                    }}
                    className="border-none bg-transparent p-0 text-sm font-bold text-gray-900 focus:outline-none"
                  >
                    <option value={7}>최근 7일</option>
                    <option value={30}>최근 30일</option>
                    <option value={90}>최근 90일</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => void loadHub(selectedProjectId)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  새로 불러오기
                </button>
              </div>
            </div>
          </section>

          {!data?.projects.length ? (
            <section className="rounded-[28px] border border-[#EBEBEB] bg-white px-6 py-8 shadow-sm">
              <h2 className="text-xl font-black text-gray-900">연동할 프로젝트가 없습니다.</h2>
              <p className="mt-3 text-sm leading-7 text-gray-500">
                먼저 마이페이지에서 프로젝트를 하나 등록하면, 서비스 허브에서 바로 임베드 위젯과 후원 데이터를 연결할 수
                있습니다.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="rounded-full bg-accent px-5 py-2.5 text-sm font-black text-gray-900 shadow-btn transition-all hover:-translate-y-0.5 hover:bg-yellow-400"
                >
                  새 프로젝트 등록
                </Link>
                <Link
                  href="/dashboard?hub=platform"
                  className="rounded-full border border-[#EBEBEB] bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  내 프로젝트 보기
                </Link>
              </div>
            </section>
          ) : (
            <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
              <aside className="sticky top-24 space-y-4">
                <section className="overflow-hidden rounded-[28px] border border-[#EBEBEB] bg-white shadow-sm">
                  <div className="border-b border-[#F2F2F2] px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B79A18]">내 서비스</p>
                  </div>
                  <ul className="divide-y divide-[#F5F5F5]">
                    {data.projects.map((project) => {
                      const statusMeta = getProjectStatusMeta(project.status);
                      const isSelected = selectedProjectId === project.id;

                      return (
                        <li key={project.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProjectId(project.id);
                              void loadHub(project.id);
                            }}
                            className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors ${
                              isSelected ? "bg-[#FFF8D9]" : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                              <Image src={project.thumbnailUrl} alt={project.name} fill className="object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black text-gray-900">{project.name}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE_STYLES[statusMeta.tone]}`}
                                >
                                  {statusMeta.label}
                                </span>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <section className="rounded-[28px] border border-[#EBEBEB] bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B79A18]">연동 상태</p>
                  <div className="mt-4 space-y-3 text-sm text-gray-600">
                    <div className="rounded-2xl bg-[#FFFCF3] px-4 py-3">
                      <p className="font-bold text-gray-900">같은 프로젝트 ID 사용</p>
                      <p className="mt-1 leading-6">
                        현재 서비스 허브는 <strong className="text-gray-900">mvp_test 프로젝트 ID</strong>를 그대로 임베드
                        위젯의 <code className="rounded bg-white px-1 py-0.5">{selectedProject?.id ?? "-"}</code> 로 사용합니다.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-4 py-3">
                      <p className="font-bold text-gray-900">자동 Origin 동기화</p>
                      <p className="mt-1 leading-6">
                        프로젝트 사이트 URL의 origin을 허용 목록에 자동으로 넣습니다.
                      </p>
                    </div>
                  </div>
                </section>
              </aside>

              <div className="space-y-6">
                <section className="rounded-[28px] border border-[#EBEBEB] bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B79A18]">선택된 서비스</p>
                      <h2 className="mt-2 text-2xl font-black text-gray-900">{selectedProject?.name ?? data.selectedProjectName}</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-500">
                        서비스 허브에서 바로 임베드 코드를 복사해서 붙일 수 있고, 같은 DB에 쌓이는 후원/메시지/방문 데이터를
                        바로 확인할 수 있습니다.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {data.publicMessagesUrl ? (
                        <a
                          href={data.publicMessagesUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          공개 메시지 보기
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                      {data.adminUrl ? (
                        <a
                          href={data.adminUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-[#FFF3B3] px-4 py-2 text-sm font-black text-[#6B5300] shadow-[0_10px_24px_rgba(214,181,29,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#FFE784]"
                        >
                          고급 관리 콘솔 열기
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[24px] bg-gray-950 p-5 text-gray-100">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">임베드 코드</p>
                          <p className="mt-2 text-sm text-gray-300">
                            아래 코드를 {data.websiteOrigin ?? "내 사이트"} 페이지에 붙이면 됩니다.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={copySnippet}
                          disabled={!data.snippet}
                          className="rounded-full bg-white px-4 py-2 text-xs font-black text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-white/40"
                        >
                          {copyState === "done" ? "복사 완료" : copyState === "error" ? "복사 실패" : "코드 복사"}
                        </button>
                      </div>

                      {data.requiresToken ? (
                        <div className="mt-4 rounded-2xl border border-yellow-300 bg-yellow-50 px-4 py-4 text-sm leading-6 text-yellow-900">
                          이 프로젝트는 현재 <strong>보호 모드</strong>로 설정되어 있어 간단 스크립트만으로는 동작하지 않습니다.
                          기존 임베드 관리 콘솔에서 토큰을 발급해 주세요.
                        </div>
                      ) : (
                        <pre className="mt-4 overflow-x-auto rounded-2xl bg-black/40 p-4 text-xs leading-6 text-[#F8FAFC]">
                          <code>{data.snippet}</code>
                        </pre>
                      )}
                    </div>

                    <div className="space-y-3 rounded-[24px] bg-[#FFFBE8] p-5">
                      <div className="rounded-2xl bg-white px-4 py-4">
                        <p className="text-sm font-black text-gray-900">현재 위젯 주소</p>
                        <p className="mt-2 break-all text-sm leading-6 text-gray-600">{data.widgetScriptUrl ?? "-"}</p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-4">
                        <p className="text-sm font-black text-gray-900">허용 Origin</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {data.embedProject?.allowedOrigins?.length ? (
                            data.embedProject.allowedOrigins.map((origin) => (
                              <span
                                key={origin}
                                className="inline-flex items-center gap-2 rounded-full bg-[#FFF6CC] px-3 py-1 text-xs font-bold text-[#6B5300]"
                              >
                                <Link2 className="h-3.5 w-3.5" />
                                {origin}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">등록된 origin이 없습니다.</span>
                          )}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-4">
                        <p className="text-sm font-black text-gray-900">연결된 공개 메시지 페이지</p>
                        <p className="mt-2 break-all text-sm leading-6 text-gray-600">{data.publicMessagesUrl ?? "-"}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {metricCards.map((card) => (
                    <article key={card.title} className="rounded-[24px] border border-[#EBEBEB] bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">{card.title}</p>
                        <div className={card.tone}>{card.icon}</div>
                      </div>
                      <p className={`mt-4 text-3xl font-black ${card.tone}`}>{card.value}</p>
                      <p className="mt-2 text-sm leading-6 text-gray-500">{card.sub}</p>
                    </article>
                  ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <article className="rounded-[28px] border border-[#EBEBEB] bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B79A18]">일별 흐름</p>
                        <h3 className="mt-2 text-lg font-black text-gray-900">조회, 방문, 후원 추이</h3>
                      </div>
                      {data.overview ? (
                        <p className="text-sm font-bold text-gray-500">
                          총 후원금 {formatCurrency(data.overview.totalAmount)}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-4">
                      <SeriesChart series={data.series} />
                    </div>
                  </article>

                  <article className="rounded-[28px] border border-[#EBEBEB] bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B79A18]">최근 메시지</p>
                    <h3 className="mt-2 text-lg font-black text-gray-900">후원자 피드백</h3>
                    <div className="mt-4 space-y-3">
                      {data.feedback.length ? (
                        data.feedback.map((item) => (
                          <div key={item.orderId} className="rounded-2xl bg-[#FAFAFA] px-4 py-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-black text-gray-900">{item.supporterName}</p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {item.campaign} · {formatCurrency(item.amount, item.currency)} ·{" "}
                                  {formatDateTime(item.approvedAt || item.createdAt)}
                                </p>
                              </div>
                              <span className="rounded-full bg-[#FFF6CC] px-3 py-1 text-xs font-bold text-[#6B5300]">
                                {item.status}
                              </span>
                            </div>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-700">{item.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-[#E5D27A] bg-[#FFFDF2] px-4 py-8 text-sm text-gray-500">
                          아직 들어온 후원 메시지가 없습니다.
                        </div>
                      )}
                    </div>
                  </article>
                </section>

                <section className="rounded-[28px] border border-[#EBEBEB] bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B79A18]">유입 페이지</p>
                  <h3 className="mt-2 text-lg font-black text-gray-900">어떤 페이지에서 후원이 일어나는지</h3>
                  <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#F1F1F1] text-left text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                          <th className="px-0 py-3">호스트</th>
                          <th className="px-0 py-3">경로</th>
                          <th className="px-0 py-3">캠페인</th>
                          <th className="px-0 py-3">조회수</th>
                          <th className="px-0 py-3">방문 수</th>
                          <th className="px-0 py-3">체류시간</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topPages.length ? (
                          data.topPages.map((item) => (
                            <tr key={`${item.host}-${item.pagePath}-${item.campaign}`} className="border-b border-[#F7F7F7] text-sm text-gray-600">
                              <td className="px-0 py-4">{item.host ?? "-"}</td>
                              <td className="px-0 py-4 font-mono text-xs text-gray-700">{item.pagePath}</td>
                              <td className="px-0 py-4">{item.campaign}</td>
                              <td className="px-0 py-4 font-bold text-gray-900">{formatNumber(item.views)}</td>
                              <td className="px-0 py-4">{formatNumber(item.visits)}</td>
                              <td className="px-0 py-4">{item.engagedSeconds.toFixed(1)}초</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-0 py-8 text-center text-sm text-gray-500">
                              아직 수집된 페이지 데이터가 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
