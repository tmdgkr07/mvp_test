"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Clock3,
  Copy,
  ExternalLink,
  Globe2,
  HeartHandshake,
  Link2,
  MessageCircleMore,
  Plus,
  RefreshCcw,
  Trash2,
  Users
} from "lucide-react";

type EmbedServiceSummary = {
  id: string;
  name: string;
  websiteUrl: string | null;
  websiteOrigin: string | null;
  allowedOrigins: string[];
  requireSignedEmbed: boolean;
  moderateMessages: boolean;
  publicMessages: boolean;
  createdAt: string;
  updatedAt: string;
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
  projects: EmbedServiceSummary[];
  selectedProjectId: string | null;
  selectedProjectName: string | null;
  serviceUrl: string | null;
  widgetScriptUrl: string | null;
  adminUrl: string | null;
  publicMessagesUrl: string | null;
  websiteUrl: string | null;
  websiteOrigin: string | null;
  embedProject: EmbedServiceSummary | null;
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
      title: "방문 수",
      value: formatNumber(overview.visits),
      sub: "세션 기준 방문 수",
      icon: <Users className="h-4 w-4" />,
      tone: "text-sky-600"
    },
    {
      title: "페이지 조회",
      value: formatNumber(overview.views),
      sub: "위젯이 렌더링된 총 횟수",
      icon: <Globe2 className="h-4 w-4" />,
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
      sub: "후원 버튼까지 진행한 횟수",
      icon: <HeartHandshake className="h-4 w-4" />,
      tone: "text-amber-600"
    },
    {
      title: "후원 완료",
      value: formatNumber(overview.donationSuccessCount),
      sub: "실제로 완료된 후원 수",
      icon: <HeartHandshake className="h-4 w-4" />,
      tone: "text-emerald-600"
    },
    {
      title: "피드백 메시지",
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
        아직 일별 데이터가 없습니다. 외부 사이트에 위젯을 붙이면 방문/후원 흐름이 여기에 쌓입니다.
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
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />조회수</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#14b8a6]" />방문 수</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#f97316]" />후원 완료</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#7c3aed]" />후원 금액</span>
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
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    websiteUrl: ""
  });

  const selectedProject = useMemo(
    () => data?.projects.find((project) => project.id === (selectedProjectId || data.selectedProjectId || "")) ?? null,
    [data, selectedProjectId]
  );
  const metricCards = useMemo(() => buildMetricCards(data?.overview ?? null), [data]);

  function applyPayload(payload: EmbedHubResponse) {
    setData(payload);
    setSelectedProjectId(payload.selectedProjectId || "");
  }

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
        throw new Error(payload.error?.message || "서비스 허브를 불러오지 못했습니다.");
      }

      applyPayload(payload.data);
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

  async function createService() {
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/embed-hub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(createForm)
      });
      const payload = (await response.json()) as ApiResult<EmbedHubResponse>;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "서비스를 만들지 못했습니다.");
      }

      applyPayload(payload.data);
      setCreateForm({
        name: "",
        websiteUrl: ""
      });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "서비스 생성 중 오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteService() {
    if (!selectedProject) {
      return;
    }

    if (!window.confirm(`${selectedProject.name} 서비스를 삭제하시겠습니까?`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/embed-hub", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId: selectedProject.id
        })
      });
      const payload = (await response.json()) as ApiResult<EmbedHubResponse>;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "서비스를 삭제하지 못했습니다.");
      }

      applyPayload(payload.data);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "서비스 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

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
          <p className="text-sm text-gray-400">서비스 허브를 불러오는 중입니다...</p>
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
      ) : null}

      {!loading ? (
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
                  <h1 className="mt-2 text-2xl font-black text-gray-900">외부 사이트용 임베드 후원 위젯</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Buy Me a Coffee처럼 내 플랫폼에 등록되지 않은 외부 사이트에도 위젯을 붙이고, 방문자 수와 후원 메시지를 함께 추적합니다.
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

          <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
            <aside className="sticky top-24 space-y-4">
              <section className="rounded-[28px] border border-[#EBEBEB] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-[#B79A18]" />
                  <p className="text-sm font-black text-gray-900">외부 서비스 만들기</p>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-bold text-gray-700">
                    서비스 이름
                    <input
                      value={createForm.name}
                      onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="예: 나의 블로그 후원 배너"
                      className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-[#E5D27A]"
                    />
                  </label>

                  <label className="block text-sm font-bold text-gray-700">
                    사이트 주소
                    <input
                      value={createForm.websiteUrl}
                      onChange={(event) => setCreateForm((current) => ({ ...current, websiteUrl: event.target.value }))}
                      placeholder="https://my-site.com"
                      className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-[#E5D27A]"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={createService}
                    disabled={creating}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-black text-gray-900 shadow-btn transition-all hover:-translate-y-0.5 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-yellow-200"
                  >
                    <Plus className="h-4 w-4" />
                    {creating ? "만드는 중..." : "임베드 서비스 만들기"}
                  </button>
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-500">
                  이 서비스는 플랫폼 허브 등록과 무관하게 독립적으로 동작합니다. 외부 사이트에 스크립트만 붙이면 후원, 메시지, 방문 데이터를 받을 수 있습니다.
                </p>
              </section>

              <section className="overflow-hidden rounded-[28px] border border-[#EBEBEB] bg-white shadow-sm">
                <div className="border-b border-[#F2F2F2] px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B79A18]">내 임베드 서비스</p>
                </div>

                {!data?.projects.length ? (
                  <div className="px-5 py-8 text-sm leading-7 text-gray-500">
                    아직 만든 임베드 서비스가 없습니다. 왼쪽 폼에서 하나 만들면 바로 위젯 스크립트가 생성됩니다.
                  </div>
                ) : (
                  <ul className="divide-y divide-[#F5F5F5]">
                    {data.projects.map((project) => {
                      const isSelected = selectedProjectId === project.id;
                      const initial = project.name.slice(0, 1).toUpperCase();

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
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3B3] text-sm font-black text-[#6B5300]">
                              {initial}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black text-gray-900">{project.name}</p>
                              <p className="mt-1 truncate text-xs text-gray-500">{project.websiteOrigin || project.websiteUrl || "사이트 주소 없음"}</p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </aside>

            <div className="space-y-6">
              {!selectedProject ? (
                <section className="rounded-[28px] border border-[#EBEBEB] bg-white p-8 text-center shadow-sm">
                  <h2 className="text-xl font-black text-gray-900">외부 서비스부터 하나 만들어 주세요.</h2>
                  <p className="mt-3 text-sm leading-7 text-gray-500">
                    서비스를 만들면 여기에서 바로 스크립트 복사, 메시지 확인, 방문/후원 통계를 볼 수 있습니다.
                  </p>
                </section>
              ) : (
                <>
                  <section className="rounded-[28px] border border-[#EBEBEB] bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B79A18]">선택된 외부 서비스</p>
                        <h2 className="mt-2 text-2xl font-black text-gray-900">{selectedProject.name}</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-500">
                          이 서비스는 플랫폼 허브와 별개로 운영되는 독립 임베드 프로젝트입니다. 외부 사이트에 스크립트만 넣으면 후원,
                          피드백 메시지, 방문/체류시간 데이터를 함께 수집할 수 있습니다.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {data?.publicMessagesUrl ? (
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
                        {data?.adminUrl ? (
                          <a
                            href={data.adminUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-[#FFF3B3] px-4 py-2 text-sm font-black text-[#6B5300] shadow-[0_10px_24px_rgba(214,181,29,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#FFE784]"
                          >
                            고급 관리 콘솔
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={deleteService}
                          disabled={deleting}
                          className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deleting ? "삭제 중..." : "서비스 삭제"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                      <div className="rounded-[24px] bg-gray-950 p-5 text-gray-100">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">임베드 코드</p>
                            <p className="mt-2 text-sm text-gray-300">
                              아래 코드를 {data?.websiteOrigin ?? "외부 사이트"} 페이지에 붙이면 Buy Me a Coffee 같은 후원 배너로 동작합니다.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={copySnippet}
                            disabled={!data?.snippet}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-white/40"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            {copyState === "done" ? "복사 완료" : copyState === "error" ? "복사 실패" : "코드 복사"}
                          </button>
                        </div>

                        {data?.requiresToken ? (
                          <div className="mt-4 rounded-2xl border border-yellow-300 bg-yellow-50 px-4 py-4 text-sm leading-6 text-yellow-900">
                            현재 이 서비스는 보호 모드라서 간단 스크립트만으로는 동작하지 않습니다. 고급 관리 콘솔에서 토큰을 발급해 주세요.
                          </div>
                        ) : (
                          <pre className="mt-4 overflow-x-auto rounded-2xl bg-black/40 p-4 text-xs leading-6 text-[#F8FAFC]">
                            <code>{data?.snippet}</code>
                          </pre>
                        )}
                      </div>

                      <div className="space-y-3 rounded-[24px] bg-[#FFFBE8] p-5">
                        <div className="rounded-2xl bg-white px-4 py-4">
                          <p className="text-sm font-black text-gray-900">서비스 ID</p>
                          <p className="mt-2 break-all text-sm leading-6 text-gray-600">{selectedProject.id}</p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-4">
                          <p className="text-sm font-black text-gray-900">사이트 주소</p>
                          <p className="mt-2 break-all text-sm leading-6 text-gray-600">{selectedProject.websiteUrl || "-"}</p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-4">
                          <p className="text-sm font-black text-gray-900">허용 Origin</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedProject.allowedOrigins.length ? (
                              selectedProject.allowedOrigins.map((origin) => (
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
                          <h3 className="mt-2 text-lg font-black text-gray-900">방문, 후원, 금액 추이</h3>
                        </div>
                        {data?.overview ? (
                          <p className="text-sm font-bold text-gray-500">총 후원금 {formatCurrency(data.overview.totalAmount)}</p>
                        ) : null}
                      </div>
                      <div className="mt-4">
                        <SeriesChart series={data?.series || []} />
                      </div>
                    </article>

                    <article className="rounded-[28px] border border-[#EBEBEB] bg-white p-6 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B79A18]">최근 메시지</p>
                      <h3 className="mt-2 text-lg font-black text-gray-900">후원자 피드백</h3>
                      <div className="mt-4 space-y-3">
                        {data?.feedback.length ? (
                          data.feedback.map((item) => (
                            <div key={item.orderId} className="rounded-2xl bg-[#FAFAFA] px-4 py-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-black text-gray-900">{item.supporterName}</p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {item.campaign} · {formatCurrency(item.amount, item.currency)} · {formatDateTime(item.approvedAt || item.createdAt)}
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
                            아직 수집된 후원 메시지가 없습니다.
                          </div>
                        )}
                      </div>
                    </article>
                  </section>

                  <section className="rounded-[28px] border border-[#EBEBEB] bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B79A18]">유입 페이지</p>
                    <h3 className="mt-2 text-lg font-black text-gray-900">어떤 외부 페이지에서 후원과 방문이 일어나는지</h3>
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
                          {data?.topPages.length ? (
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
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
