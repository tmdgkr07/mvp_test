"use client";

import { useEffect, useState } from "react";
import type { EmbedAnalyticsDashboardData } from "@/lib/embed-dashboard";

const RANGE_OPTIONS = [7, 14, 30, 90] as const;
const MAX_BAR_HEIGHT = 180;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ALL_PROJECTS_KEY = "__all_projects__";

type ApiResult<T> = {
  data?: T;
  error?: { code: string; message: string };
};

type DashboardProjectOption = {
  id: string;
  isLaunched: boolean;
  name: string;
  statusLabel: string;
};

type EmbedDashboardPayload = {
  dashboard: EmbedAnalyticsDashboardData;
  endDate: string | null;
  projectIds: string[];
  rangeDays: number;
  startDate: string | null;
};

type TrendMetricKey = "views" | "widgetOpens" | "donationAttempts" | "donationSuccessCount" | "totalAmount";

type TrendMetricOption = {
  colorClass: string;
  key: TrendMetricKey;
  label: string;
  lightColorClass: string;
};

type ActiveRange =
  | { days: number; mode: "preset" }
  | { endDate: string; mode: "custom"; startDate: string };

type EmbedAnalyticsDashboardProps = {
  className?: string;
  initialDays?: number | null;
  initialEndDate?: string | null;
  initialProjectId?: string | null;
  initialStartDate?: string | null;
  projects: DashboardProjectOption[];
};

const TREND_METRICS: TrendMetricOption[] = [
  { key: "views", label: "조회수", colorClass: "bg-blue-500", lightColorClass: "bg-blue-50 text-blue-600" },
  { key: "widgetOpens", label: "위젯 열기", colorClass: "bg-emerald-500", lightColorClass: "bg-emerald-50 text-emerald-600" },
  { key: "donationAttempts", label: "후원 시도", colorClass: "bg-amber-500", lightColorClass: "bg-amber-50 text-amber-700" },
  { key: "donationSuccessCount", label: "후원 성공", colorClass: "bg-violet-500", lightColorClass: "bg-violet-50 text-violet-700" },
  { key: "totalAmount", label: "후원금", colorClass: "bg-rose-500", lightColorClass: "bg-rose-50 text-rose-700" }
];

function clampRangeDays(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return 30;
  }

  return Math.max(7, Math.min(365, Math.trunc(value as number)));
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildPresetInputRange(days: number) {
  const safeDays = clampRangeDays(days);
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate.getTime() - (safeDays - 1) * DAY_IN_MS);

  return {
    endDate: toDateInputValue(endDate),
    startDate: toDateInputValue(startDate)
  };
}

function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validateCustomRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return "시작일과 종료일을 모두 입력해야 합니다.";
  }

  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate);
  if (!start || !end) {
    return "날짜 형식이 올바르지 않습니다.";
  }

  if (end < start) {
    return "종료일은 시작일보다 빠를 수 없습니다.";
  }

  const dayCount = Math.floor((end.getTime() - start.getTime()) / DAY_IN_MS) + 1;
  if (dayCount > 365) {
    return "사용자 지정 기간은 최대 1년까지만 조회할 수 있습니다.";
  }

  return null;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function formatSeconds(value: number) {
  return `${value.toLocaleString("ko-KR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1
  })}초`;
}

function formatPercent(value: number) {
  return `${value.toLocaleString("ko-KR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1
  })}%`;
}

function formatTrendValue(metric: TrendMetricKey, value: number) {
  return metric === "totalAmount" ? formatCurrency(value) : formatInteger(value);
}

function formatEventTypeBadge(type: string) {
  if (type === "view") return "bg-blue-50 text-blue-600";
  if (type === "widget_open") return "bg-emerald-50 text-emerald-600";
  if (type === "donation_submit") return "bg-amber-50 text-amber-700";
  if (type === "engagement") return "bg-violet-50 text-violet-700";
  return "bg-gray-100 text-gray-600";
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

function formatShortDate(value: string) {
  return value.slice(5).replace("-", "/");
}

function formatDisplayDate(value: string) {
  const parsed = parseDateInput(value);
  if (!parsed) {
    return value;
  }

  return parsed.toLocaleDateString("ko-KR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function compactId(value: string) {
  return value.length <= 14 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function toCsvCell(value: string | number) {
  const serialized = String(value ?? "");
  if (serialized.includes(",") || serialized.includes("\"") || serialized.includes("\n")) {
    return `"${serialized.replaceAll("\"", "\"\"")}"`;
  }

  return serialized;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map((cell) => toCsvCell(cell)).join(",")).join("\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getInitialRange(initialDays?: number | null, initialStartDate?: string | null, initialEndDate?: string | null): ActiveRange {
  if (initialStartDate && initialEndDate) {
    return { endDate: initialEndDate, mode: "custom", startDate: initialStartDate };
  }

  return { days: clampRangeDays(initialDays), mode: "preset" };
}

function roundToTenths(value: number) {
  return Math.round(value * 10) / 10;
}

export default function EmbedAnalyticsDashboard({
  className = "mt-4",
  initialDays,
  initialEndDate,
  initialProjectId,
  initialStartDate,
  projects
}: EmbedAnalyticsDashboardProps) {
  const initialRange = getInitialRange(initialDays, initialStartDate, initialEndDate);
  const initialDraftRange =
    initialRange.mode === "custom" ? initialRange : { ...buildPresetInputRange(initialRange.days), mode: "custom" as const };

  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || ALL_PROJECTS_KEY);
  const [activeRange, setActiveRange] = useState<ActiveRange>(initialRange);
  const [draftStartDate, setDraftStartDate] = useState(initialDraftRange.startDate);
  const [draftEndDate, setDraftEndDate] = useState(initialDraftRange.endDate);
  const [trendMetric, setTrendMetric] = useState<TrendMetricKey>("views");
  const [dashboard, setDashboard] = useState<EmbedAnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [resolvedRange, setResolvedRange] = useState({
    endDate: initialEndDate || null,
    rangeDays: initialRange.mode === "preset" ? initialRange.days : 0,
    startDate: initialStartDate || null
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (selectedProjectId !== ALL_PROJECTS_KEY) {
          params.set("projectId", selectedProjectId);
        }

        if (activeRange.mode === "custom") {
          params.set("startDate", activeRange.startDate);
          params.set("endDate", activeRange.endDate);
        } else {
          params.set("days", String(activeRange.days));
        }

        const response = await fetch(`/api/embed/dashboard?${params.toString()}`, { cache: "no-store" });
        const payload = (await response.json()) as ApiResult<EmbedDashboardPayload>;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "상세 대시보드를 불러오지 못했습니다.");
        }

        if (!cancelled) {
          setDashboard(payload.data.dashboard);
          setResolvedRange({
            endDate: payload.data.endDate,
            rangeDays: payload.data.rangeDays,
            startDate: payload.data.startDate
          });
        }
      } catch (fetchError) {
        if (!cancelled) {
          setDashboard(null);
          setError(fetchError instanceof Error ? fetchError.message : "상세 대시보드를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [activeRange, selectedProjectId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedProjectId !== ALL_PROJECTS_KEY) {
      params.set("projectId", selectedProjectId);
    }

    if (activeRange.mode === "custom") {
      params.set("startDate", activeRange.startDate);
      params.set("endDate", activeRange.endDate);
    } else {
      params.set("days", String(activeRange.days));
    }

    const query = params.toString();
    window.history.replaceState(null, "", query ? `${window.location.pathname}?${query}` : window.location.pathname);
  }, [activeRange, selectedProjectId]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) || null;
  const isAggregateView = selectedProjectId === ALL_PROJECTS_KEY;
  const scopeLabel = isAggregateView ? "전체 배포 서비스" : selectedProject?.name || "선택한 서비스";
  const showProjectColumn = isAggregateView;
  const selectedMetric = TREND_METRICS.find((item) => item.key === trendMetric) || TREND_METRICS[0];
  const trendValues = dashboard?.trends.map((point) => point[trendMetric]) || [];
  const trendMax = Math.max(...trendValues, 1);
  const trendCanvasWidth = Math.max((dashboard?.trends.length || 0) * 18, 640);
  const periodLabel =
    activeRange.mode === "custom"
      ? `${formatDisplayDate(resolvedRange.startDate || activeRange.startDate)} - ${formatDisplayDate(resolvedRange.endDate || activeRange.endDate)}`
      : `최근 ${resolvedRange.rangeDays || activeRange.days}일`;

  function applyPresetRange(days: number) {
    const nextRange = buildPresetInputRange(days);
    setRangeError(null);
    setDraftStartDate(nextRange.startDate);
    setDraftEndDate(nextRange.endDate);
    setActiveRange({ days: clampRangeDays(days), mode: "preset" });
  }

  function applyCustomRange() {
    const validationError = validateCustomRange(draftStartDate, draftEndDate);
    if (validationError) {
      setRangeError(validationError);
      return;
    }

    setRangeError(null);
    setActiveRange({ endDate: draftEndDate, mode: "custom", startDate: draftStartDate });
  }

  function handleExportTrends() {
    if (!dashboard || dashboard.trends.length === 0) {
      return;
    }

    const filename = `${isAggregateView ? "all-services" : selectedProject?.name || "service"}-${activeRange.mode === "custom" ? "custom" : `${activeRange.days}days`}-trends.csv`;
    const rows: Array<Array<string | number>> = [
      ["day", "views", "visits", "uniqueVisitors", "widgetOpens", "donationAttempts", "donationSuccessCount", "feedbackCount", "totalAmount", "avgDwellSeconds"],
      ...dashboard.trends.map((point) => [
        point.day,
        point.views,
        point.visits,
        point.uniqueVisitors,
        point.widgetOpens,
        point.donationAttempts,
        point.donationSuccessCount,
        point.feedbackCount,
        point.totalAmount,
        point.avgDwellSeconds
      ])
    ];

    downloadCsv(filename, rows);
  }

  return (
    <section className={`${className} rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">임베드 상세 대시보드</p>
            <h3 className="mt-1 text-lg font-black text-gray-900">{scopeLabel} 트래킹 상세</h3>
            <p className="mt-1 text-sm text-gray-500">{periodLabel} 기준으로 일별 트렌드, 페이지 성과, 최근 이벤트를 자세히 볼 수 있습니다.</p>
            {isAggregateView ? <p className="mt-2 text-xs font-medium text-[#8B6F00]">전체 보기는 공식 배포중 서비스만 합산합니다.</p> : null}
            <div className="mt-3">
              <button
                type="button"
                onClick={handleExportTrends}
                disabled={!dashboard || dashboard.trends.length === 0}
                className="inline-flex items-center justify-center rounded-full border border-[#EBEBEB] bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                트렌드 CSV 내보내기
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#F1EEE2] bg-[#FFFCF3] p-4 lg:min-w-[360px]">
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm font-bold text-gray-700">
                <span>서비스 선택</span>
                <select
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  className="h-11 rounded-xl border border-[#E3D59C] bg-white px-3 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-[#CBAA1A]"
                >
                  <option value={ALL_PROJECTS_KEY}>전체 배포 서비스</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.statusLabel})
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-bold text-gray-700">빠른 기간 선택</span>
                <div className="flex flex-wrap gap-2">
                  {RANGE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => applyPresetRange(option)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                        activeRange.mode === "preset" && activeRange.days === option ? "bg-[#FFF3B3] text-[#6B5300]" : "bg-white text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      최근 {option}일
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 rounded-xl border border-dashed border-[#E3D59C] bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-gray-700">사용자 지정 기간</span>
                  <span className="text-xs font-medium text-gray-400">최대 1년</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                    <span>시작일</span>
                    <input
                      type="date"
                      value={draftStartDate}
                      max={draftEndDate || undefined}
                      onChange={(event) => setDraftStartDate(event.target.value)}
                      className="h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-[#CBAA1A]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                    <span>종료일</span>
                    <input
                      type="date"
                      value={draftEndDate}
                      min={draftStartDate || undefined}
                      onChange={(event) => setDraftEndDate(event.target.value)}
                      className="h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-[#CBAA1A]"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-gray-500">1년 범위 안에서는 원하는 날짜로 직접 조회할 수 있습니다.</p>
                  <button
                    type="button"
                    onClick={applyCustomRange}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-[#111111] px-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  >
                    기간 적용
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {rangeError ? <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-600">{rangeError}</div> : null}
        {error ? <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-600">{error}</div> : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl bg-[#FFFCF3] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{periodLabel} 조회수</p>
          <p className="mt-2 text-3xl font-black text-blue-600">{loading || !dashboard ? "-" : formatInteger(dashboard.overview.views)}</p>
          <p className="mt-1 text-xs text-gray-500">방문 수 {loading || !dashboard ? "-" : formatInteger(dashboard.overview.visits)}</p>
        </article>
        <article className="rounded-2xl bg-[#FFFCF3] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">고유 방문자</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">{loading || !dashboard ? "-" : formatInteger(dashboard.overview.uniqueVisitors)}</p>
          <p className="mt-1 text-xs text-gray-500">재방문 비율 {loading || !dashboard ? "-" : formatPercent(dashboard.overview.repeatVisitorRate)}</p>
        </article>
        <article className="rounded-2xl bg-[#FFFCF3] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">후원 성과</p>
          <p className="mt-2 text-3xl font-black text-amber-600">{loading || !dashboard ? "-" : formatInteger(dashboard.overview.donationSuccessCount)}</p>
          <p className="mt-1 text-xs text-gray-500">시도 {loading || !dashboard ? "-" : formatInteger(dashboard.overview.donationAttempts)}</p>
        </article>
        <article className="rounded-2xl bg-[#FFFCF3] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">후원금 / 체류시간</p>
          <p className="mt-2 text-3xl font-black text-violet-600">{loading || !dashboard ? "-" : formatCurrency(dashboard.overview.totalAmount)}</p>
          <p className="mt-1 text-xs text-gray-500">평균 체류 {loading || !dashboard ? "-" : formatSeconds(dashboard.overview.avgDwellSeconds)}</p>
        </article>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-[#F1EEE2] bg-[#FFFCF3] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">일별 트렌드</p>
              <p className="mt-1 text-sm text-gray-500">{periodLabel} 동안 수집된 핵심 이벤트를 일 단위로 비교합니다.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {TREND_METRICS.map((metric) => (
                <button
                  key={metric.key}
                  type="button"
                  onClick={() => setTrendMetric(metric.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                    trendMetric === metric.key ? metric.lightColorClass : "bg-white text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="mt-6 flex h-[240px] items-center justify-center rounded-2xl border border-dashed border-[#E9D989] bg-white text-sm text-gray-500">
              트렌드 데이터를 불러오는 중입니다.
            </div>
          ) : !dashboard || dashboard.trends.length === 0 ? (
            <div className="mt-6 flex h-[240px] items-center justify-center rounded-2xl border border-dashed border-[#E9D989] bg-white text-sm text-gray-500">
              선택한 기간에 수집된 트렌드 데이터가 없습니다.
            </div>
          ) : (
            <>
              <div className="mt-6 overflow-x-auto">
                <div
                  className="flex h-[240px] items-end gap-1 rounded-2xl border border-[#F1EEE2] bg-white px-3 pb-3 pt-6"
                  style={{ minWidth: `${trendCanvasWidth}px` }}
                >
                  {dashboard.trends.map((point) => {
                    const value = point[trendMetric];
                    const height = Math.max((value / trendMax) * MAX_BAR_HEIGHT, value > 0 ? 10 : 2);

                    return (
                      <div key={point.day} className="group relative flex h-full min-w-[12px] flex-1 items-end">
                        <div
                          className={`w-full rounded-t-xl ${selectedMetric.colorClass} transition-opacity group-hover:opacity-85`}
                          style={{ height }}
                        />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-28 -translate-x-1/2 rounded-xl bg-gray-950 px-3 py-2 text-center text-[11px] font-medium text-white shadow-lg group-hover:block">
                          <p>{formatShortDate(point.day)}</p>
                          <p className="mt-1">{formatTrendValue(trendMetric, value)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-gray-400">
                <span>{formatShortDate(dashboard.trends[0].day)}</span>
                <span>{selectedMetric.label} 최대 {formatTrendValue(trendMetric, trendMax)}</span>
                <span>{formatShortDate(dashboard.trends[dashboard.trends.length - 1].day)}</span>
              </div>
            </>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-[#F1EEE2] bg-[#FFFCF3] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">이벤트 타입 분포</p>
            <div className="mt-4 space-y-3">
              {loading ? (
                <p className="text-sm text-gray-500">이벤트 분포를 불러오는 중입니다.</p>
              ) : !dashboard || dashboard.eventTypes.length === 0 ? (
                <p className="text-sm text-gray-500">집계된 이벤트 타입이 없습니다.</p>
              ) : (
                dashboard.eventTypes.map((item) => (
                  <div key={item.type} className="rounded-xl bg-white px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${formatEventTypeBadge(item.type)}`}>{item.label}</span>
                      <span className="text-sm font-black text-gray-900">{formatInteger(item.count)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#F1EEE2] bg-[#FFFCF3] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">유입 Referrer</p>
            <div className="mt-4 space-y-3">
              {loading ? (
                <p className="text-sm text-gray-500">유입 데이터를 불러오는 중입니다.</p>
              ) : !dashboard || dashboard.referrers.length === 0 ? (
                <p className="text-sm text-gray-500">선택한 기간의 referrer 데이터가 없습니다.</p>
              ) : (
                dashboard.referrers.map((item) => (
                  <div key={item.key} className="rounded-xl bg-white px-3 py-3">
                    <p className="truncate text-sm font-bold text-gray-900">{item.referrer}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      조회 {formatInteger(item.views)} / 방문 {formatInteger(item.visits)} / 고유 {formatInteger(item.uniqueVisitors)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-[#F1EEE2] bg-[#FFFCF3]">
          <div className="border-b border-[#F1EEE2] px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">캠페인별 성과</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                <tr>
                  {showProjectColumn ? <th className="px-4 py-3">서비스</th> : null}
                  <th className="px-4 py-3">캠페인</th>
                  <th className="px-4 py-3">조회</th>
                  <th className="px-4 py-3">방문</th>
                  <th className="px-4 py-3">후원성공</th>
                  <th className="px-4 py-3">후원금</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EEE2]">
                {loading ? (
                  <tr>
                    <td colSpan={showProjectColumn ? 6 : 5} className="px-4 py-6 text-center text-sm text-gray-500">
                      캠페인 데이터를 불러오는 중입니다.
                    </td>
                  </tr>
                ) : !dashboard || dashboard.campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={showProjectColumn ? 6 : 5} className="px-4 py-6 text-center text-sm text-gray-500">
                      집계된 캠페인 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  dashboard.campaigns.map((row) => (
                    <tr key={row.key} className="bg-[#FFFCF3]">
                      {showProjectColumn ? <td className="px-4 py-3 text-gray-600">{row.projectName || "-"}</td> : null}
                      <td className="px-4 py-3 font-bold text-gray-900">{row.campaign || "default"}</td>
                      <td className="px-4 py-3 text-gray-600">{formatInteger(row.views)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatInteger(row.visits)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatInteger(row.donationSuccessCount)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatCurrency(row.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#F1EEE2] bg-[#FFFCF3]">
          <div className="border-b border-[#F1EEE2] px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">페이지별 성과</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                <tr>
                  {showProjectColumn ? <th className="px-4 py-3">서비스</th> : null}
                  <th className="px-4 py-3">호스트</th>
                  <th className="px-4 py-3">경로</th>
                  <th className="px-4 py-3">조회</th>
                  <th className="px-4 py-3">후원금</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EEE2]">
                {loading ? (
                  <tr>
                    <td colSpan={showProjectColumn ? 5 : 4} className="px-4 py-6 text-center text-sm text-gray-500">
                      페이지 데이터를 불러오는 중입니다.
                    </td>
                  </tr>
                ) : !dashboard || dashboard.pages.length === 0 ? (
                  <tr>
                    <td colSpan={showProjectColumn ? 5 : 4} className="px-4 py-6 text-center text-sm text-gray-500">
                      집계된 페이지 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  dashboard.pages.map((row) => (
                    <tr key={row.key} className="bg-[#FFFCF3]">
                      {showProjectColumn ? <td className="px-4 py-3 text-gray-600">{row.projectName || "-"}</td> : null}
                      <td className="px-4 py-3 text-gray-600">{row.host || "-"}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">{row.pagePath || "/"}</p>
                        <p className="mt-1 text-xs text-gray-400">{row.campaign || "default"}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatInteger(row.views)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatCurrency(row.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-[#F1EEE2] bg-[#FFFCF3] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">최근 트래킹 이벤트</p>
            <p className="mt-1 text-sm text-gray-500">현재 수집 중인 이벤트를 시간순으로 확인할 수 있습니다.</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-xl bg-white px-4 py-5 text-sm text-gray-500">최근 이벤트를 불러오는 중입니다.</div>
          ) : !dashboard || dashboard.recentEvents.length === 0 ? (
            <div className="rounded-xl bg-white px-4 py-5 text-sm text-gray-500">선택한 기간에 기록된 최근 이벤트가 없습니다.</div>
          ) : (
            dashboard.recentEvents.map((event) => (
              <article key={event.id} className="rounded-xl bg-white px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${formatEventTypeBadge(event.type)}`}>
                        {event.type === "view"
                          ? "페이지 노출"
                          : event.type === "widget_open"
                            ? "위젯 열기"
                            : event.type === "donation_submit"
                              ? "후원 시도"
                              : "체류 기록"}
                      </span>
                      {showProjectColumn && event.project ? (
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">{event.project.name}</span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm font-bold text-gray-900">
                      {event.host || "-"}
                      {event.pagePath || "/"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {formatTimestamp(event.timestamp)}
                      {event.campaign ? ` / 캠페인 ${event.campaign}` : ""}
                      {event.referrer ? ` / referrer ${event.referrer}` : ""}
                      {event.durationMs ? ` / ${formatSeconds(roundToTenths(event.durationMs / 1000))}` : ""}
                    </p>
                  </div>

                  <div className="shrink-0 text-right text-xs text-gray-400">
                    <p>session {compactId(event.sessionId)}</p>
                    <p className="mt-1">visitor {event.visitorId ? compactId(event.visitorId) : "-"}</p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
