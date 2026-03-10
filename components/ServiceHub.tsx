"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, BarChart2, Clock3, HeartHandshake, MessageCircleMore, Plus, Repeat, Users } from "lucide-react";
import type { Project } from "@/lib/types";
import { getProjectStatusMeta, isOfficiallyLaunched, type ProjectStatusTone } from "@/lib/project-status";

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

type DashboardResponse = {
  projects: Project[];
  waitlistCount?: number;
};

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

export default function ServiceHub() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string>(ALL_PROJECTS_KEY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmbedGuide, setShowEmbedGuide] = useState(false);
  const [metricToggles, setMetricToggles] = useState<MetricToggleState>(DEFAULT_METRIC_TOGGLES);

  const eligibleProjects = useMemo(() => projects.filter((project) => isOfficiallyLaunched(project.status)), [projects]);
  const launchedVoteCount = useMemo(() => eligibleProjects.reduce((sum, project) => sum + project.voteCount, 0), [eligibleProjects]);
  const selectedProject = eligibleProjects.find((project) => project.id === selectedKey);
  const isAggregateView = selectedKey === ALL_PROJECTS_KEY;

  useEffect(() => {
    async function bootstrap() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        const payload = (await response.json()) as ApiResult<DashboardResponse>;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "서비스 허브를 불러오지 못했습니다.");
        }

        setProjects(payload.data.projects);
        setWaitlistCount(payload.data.waitlistCount ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, []);

  const metricCards = useMemo(
    () => buildExternalMetrics(isAggregateView, eligibleProjects.length, selectedProject?.name),
    [eligibleProjects.length, isAggregateView, selectedProject?.name]
  );
  const visibleMetricCards = metricCards.filter((card) => metricToggles[card.key]);

  const headerTitle = isAggregateView ? "종합 집계" : selectedProject?.name ?? "서비스";
  const headerDescription = isAggregateView
    ? "공식 배포 중인 서비스만 대상으로 외부 서비스 지표 연동 현황을 보여줍니다."
    : `${selectedProject?.name ?? "선택 서비스"}의 외부 서비스 추적 지표와 임베드 설정을 관리합니다.`;

  const embedCode = getEmbedCode(selectedProject?.slug ?? selectedProject?.name);

  function handleToggle(metricKey: MetricKey) {
    setMetricToggles((current) => ({
      ...current,
      [metricKey]: !current[metricKey]
    }));
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {loading ? <div className="flex justify-center py-24"><p className="text-sm text-gray-400">불러오는 중...</p></div> : null}
      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div> : null}

      {!loading && !error ? (
        <div className="space-y-8">
          <div className="rounded-3xl border border-[#EBEBEB] bg-white px-6 py-8 shadow-sm">
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
                    <p className="text-lg font-black text-gray-900">{eligibleProjects.length}</p>
                    <p className="text-xs text-gray-400">배포 서비스 수</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-gray-900">{launchedVoteCount}</p>
                    <p className="text-xs text-gray-400">총응원</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-gray-900">{waitlistCount}</p>
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
                    {eligibleProjects.map((project) => {
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

                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowEmbedGuide((prev) => !prev)} className="rounded-full bg-[#FFF3B3] px-4 py-2 text-xs font-black text-[#6B5300] shadow-[0_10px_24px_rgba(214,181,29,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#FFE784]">
                    임베드 하기
                  </button>
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
                      <p className="mt-1 text-sm leading-6 text-gray-600">운영 중인 외부 서비스에 우리 배너를 임베드하면, 원하는 데이터 수집 범위를 켜고 외부 지표 연동 준비를 할 수 있습니다.</p>
                    </div>
                    <button type="button" onClick={() => setShowEmbedGuide(false)} className="text-xs font-bold text-gray-500 hover:text-gray-900">닫기</button>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-xl bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">임베드 예시 코드</p>
                      <pre className="mt-3 overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs text-gray-100"><code>{embedCode}</code></pre>
                    </div>

                    <div className="rounded-xl bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">수집 데이터 ON/OFF</p>
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
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
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
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">외부 연동 설계 메모</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl bg-[#FFFCF3] px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">배너 임베드 기반 추적</p>
                      <p className="mt-1 text-sm text-gray-500">배포 중인 외부 서비스에 우리 배너를 붙이면 동일한 추적 사인을 수집할 수 있습니다.</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">활성 조건</p>
                      <p className="mt-1 text-sm text-gray-500">플랫폼 허브에서 상태를 공식 배포중으로 설정한 서비스만 서비스 허브에서 다룹니다.</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">후원/매출 데이터</p>
                      <p className="mt-1 text-sm text-gray-500">Stripe, Buy Me a Coffee, 결제 대행사 데이터 연결 구조를 추후 붙입니다.</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">오류/버그 데이터</p>
                      <p className="mt-1 text-sm text-gray-500">Sentry, LogRocket, 문의 폼, 커뮤니티 리포트를 함께 볼 수 있게 확장합니다.</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">현재 상태</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-[#F1EEE2] bg-[#FFFCF3] px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">외부 지표 연동 준비 단계</p>
                      <p className="mt-1 text-sm text-gray-500">지금은 지표별 연동 스위치와 임베드 코드만 준비되어 있고, 실제 숫자는 연동 대기 상태입니다.</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">대상 서비스</p>
                      <p className="mt-1 text-sm text-gray-500">아이디어 단계 서비스는 플랫폼 허브에서 검증하고, 공식 배포중 서비스만 여기서 다룹니다.</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">다음 단계</p>
                      <p className="mt-1 text-sm text-gray-500">서비스별 외부 분석툴 계정과 키를 연결하면 실제 집계 필드를 붙일 수 있습니다.</p>
                    </div>
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
