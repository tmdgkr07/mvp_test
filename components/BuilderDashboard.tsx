"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Download, Pencil, Plus, ExternalLink, BarChart2, MessageSquare, Bell, TrendingDown } from "lucide-react";
import type { Feedback, Project } from "@/lib/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  IDEA: { label: "아이디어", color: "bg-gray-100 text-gray-600" },
  VALIDATING: { label: "검증 중", color: "bg-blue-50 text-blue-600" },
  DEVELOPING: { label: "개발 중", color: "bg-orange-50 text-orange-600" },
  RELEASED: { label: "출시 완료", color: "bg-emerald-50 text-emerald-700" },
  GROWING: { label: "성장 중", color: "bg-indigo-50 text-indigo-600" },
  PAUSED: { label: "일시 중단", color: "bg-red-50 text-red-600" },
  PIVOTED: { label: "피봇", color: "bg-yellow-50 text-yellow-700" },
};

type DashboardPayload = {
  funnel: Array<{ stage: string; key: string; count: number }>;
  dropOff: Array<{ from: string; to: string; lostUsers: number; rate: number }>;
  exitReport: Array<{ stage: string; exits: number; rate: number }>;
  avgSessionSeconds: number;
  totalSessions: number;
  feedback: Feedback[];
};

type ApiResult<T> = {
  data?: T;
  error?: { code: string; message: string };
};

const EMPTY_DASHBOARD: DashboardPayload = {
  funnel: [],
  dropOff: [],
  exitReport: [],
  avgSessionSeconds: 0,
  totalSessions: 0,
  feedback: [],
};

type WaitlistEntry = { email: string; createdAt: string };
type Tab = "overview" | "funnel" | "feedback" | "waitlist";

export default function BuilderDashboard() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [dashboard, setDashboard] = useState<DashboardPayload>(EMPTY_DASHBOARD);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    async function bootstrap() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        const payload = (await response.json()) as ApiResult<{
          projects: Project[];
          waitlistCount: number;
          dashboard: DashboardPayload;
        }>;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "대시보드를 불러오지 못했습니다.");
        }
        setProjects(payload.data.projects);
        setWaitlistCount(payload.data.waitlistCount ?? 0);
        setDashboard(payload.data.dashboard || EMPTY_DASHBOARD);
        if (payload.data.projects.length > 0) {
          setSelectedProjectId(payload.data.projects[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    async function fetchDashboard() {
      try {
        const [dashRes, waitRes] = await Promise.all([
          fetch(`/api/dashboard?projectId=${selectedProjectId}`, { cache: "no-store" }),
          fetch(`/api/projects/${selectedProjectId}/waitlist`, { cache: "no-store" }),
        ]);
        const dashPayload = (await dashRes.json()) as ApiResult<{ dashboard: DashboardPayload }>;
        if (!dashRes.ok || !dashPayload.data) {
          throw new Error(dashPayload.error?.message || "데이터를 불러오지 못했습니다.");
        }
        setDashboard(dashPayload.data.dashboard || EMPTY_DASHBOARD);
        if (waitRes.ok) {
          const waitPayload = (await waitRes.json()) as { data?: { waitlist: WaitlistEntry[] } };
          setWaitlist(waitPayload.data?.waitlist ?? []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      }
    }
    void fetchDashboard();
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "개요", icon: <BarChart2 className="h-4 w-4" /> },
    { id: "funnel", label: "퍼널 분석", icon: <TrendingDown className="h-4 w-4" /> },
    { id: "feedback", label: `피드백 ${dashboard.feedback.length > 0 ? `(${dashboard.feedback.length})` : ""}`, icon: <MessageSquare className="h-4 w-4" /> },
    { id: "waitlist", label: `알림 신청 ${waitlist.length > 0 ? `(${waitlist.length})` : ""}`, icon: <Bell className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* 프로필 헤더 */}
      <div className="bg-white border-b border-[#EBEBEB]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="프로필"
                  width={56}
                  height={56}
                  className="rounded-full ring-2 ring-[#EBEBEB]"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center text-xl font-black text-gray-900">
                  {session?.user?.name?.[0] ?? "나"}
                </div>
              )}
              <div>
                <h1 className="text-xl font-black text-gray-900">
                  {session?.user?.name ?? "메이커"}님의 페이지
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-6 mr-4">
                <div className="text-center">
                  <p className="text-lg font-black text-gray-900">{loading ? "…" : projects.length}</p>
                  <p className="text-xs text-gray-400">서비스</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-gray-900">{loading ? "…" : projects.reduce((s, p) => s + p.voteCount, 0)}</p>
                  <p className="text-xs text-gray-400">총 응원</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-gray-900">{loading ? "…" : waitlistCount}</p>
                  <p className="text-xs text-gray-400">알림 신청</p>
                </div>
              </div>
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-full bg-accent hover:bg-yellow-400 px-5 py-2.5 text-sm font-bold text-gray-900 transition-all duration-200 hover:-translate-y-0.5 shadow-btn"
              >
                <Plus className="h-4 w-4" />
                서비스 등록
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 본문: 2-컬럼 레이아웃 */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm text-gray-400">불러오는 중...</p>
          </div>
        )}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="flex gap-6 items-start">
            {/* 왼쪽: 서비스 목록 */}
            <aside className="w-64 shrink-0 sticky top-24">
              <div className="rounded-2xl bg-white border border-[#EBEBEB] overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-[#EBEBEB]">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">내 서비스</p>
                </div>

                {projects.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-gray-400 mb-3">아직 등록한 서비스가 없어요</p>
                    <Link
                      href="/register"
                      className="inline-block rounded-full bg-accent hover:bg-yellow-400 px-4 py-2 text-xs font-bold text-gray-900 transition-colors"
                    >
                      첫 서비스 등록
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#F5F5F5]">
                    {projects.map((project) => {
                      const isSelected = selectedProjectId === project.id;
                      return (
                        <li key={project.id}>
                          <button
                            onClick={() => setSelectedProjectId(project.id)}
                            className={`w-full text-left px-4 py-3.5 transition-colors flex items-center gap-3 ${
                              isSelected ? "bg-accent/10" : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="relative h-9 w-9 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                src={project.thumbnailUrl}
                                alt={project.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-bold truncate ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                                {project.name}
                              </p>
                              {project.status && STATUS_LABELS[project.status] && (
                                <span className={`mt-0.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_LABELS[project.status].color}`}>
                                  {STATUS_LABELS[project.status].label}
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <div className="h-2 w-2 shrink-0 rounded-full bg-accent"></div>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </aside>

            {/* 오른쪽: 분석 패널 */}
            <div className="flex-1 min-w-0">
              {!selectedProjectId ? (
                <div className="rounded-2xl bg-white border border-[#EBEBEB] py-20 text-center shadow-sm">
                  <p className="text-gray-400 text-sm">서비스를 선택하면 분석 데이터가 표시됩니다.</p>
                </div>
              ) : (
                <>
                  {/* 선택된 프로젝트 헤더 */}
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black text-gray-900">{selectedProject?.name}</h2>
                      <p className="text-sm text-gray-400 mt-0.5">{selectedProject?.tagline}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/register?edit=${selectedProjectId}`}
                        className="flex items-center gap-1.5 rounded-full border border-[#EBEBEB] bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        편집
                      </Link>
                      {selectedProject?.websiteUrl && (
                        <a
                          href={selectedProject.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-full border border-[#EBEBEB] bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          사이트
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 탭 */}
                  <div className="flex gap-1 bg-white border border-[#EBEBEB] rounded-xl p-1 mb-5 shadow-sm">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 flex-1 justify-center rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                          activeTab === tab.id
                            ? "bg-gray-900 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* 탭 컨텐츠 */}
                  {activeTab === "overview" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: "총 방문자", value: dashboard.totalSessions, sub: "총 세션 수", color: "text-blue-600" },
                          { label: "평균 체류", value: `${dashboard.avgSessionSeconds}초`, sub: "콘텐츠 흡수 시간", color: "text-purple-600" },
                          { label: "피드백", value: dashboard.feedback.length, sub: "유저 의견 수", color: "text-emerald-600" },
                        ].map(({ label, value, sub, color }) => (
                          <div key={label} className="rounded-2xl bg-white border border-[#EBEBEB] p-5 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 mb-2">{label}</p>
                            <p className={`text-3xl font-black ${color}`}>{value}</p>
                            <p className="mt-1 text-xs text-gray-400">{sub}</p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl bg-white border border-[#EBEBEB] p-5 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wide">최근 퍼널 요약</p>
                        {dashboard.funnel.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">아직 데이터가 없습니다.</p>
                        ) : (
                          <div className="flex items-end gap-2">
                            {dashboard.funnel.map((step, i) => {
                              const max = Math.max(...dashboard.funnel.map((s) => s.count), 1);
                              const heightPct = Math.max((step.count / max) * 100, 8);
                              return (
                                <div key={step.key} className="flex-1 flex flex-col items-center gap-1.5">
                                  <p className="text-xs font-bold text-gray-700">{step.count}</p>
                                  <div
                                    className="w-full rounded-t-lg transition-all"
                                    style={{
                                      height: `${heightPct * 1.2}px`,
                                      backgroundColor: i === 0 ? "#FFDD59" : `rgba(255,221,89,${1 - i * 0.2})`,
                                    }}
                                  />
                                  <p className="text-[10px] text-gray-400 text-center leading-tight">{step.stage}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "funnel" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-white border border-[#EBEBEB] p-5 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wide">단계별 전환</p>
                        {dashboard.funnel.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-6">퍼널 데이터가 없습니다.</p>
                        ) : (
                          <ul className="space-y-2">
                            {dashboard.funnel.map((step) => (
                              <li key={step.key} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                                <span className="text-sm font-semibold text-gray-700">{step.stage}</span>
                                <strong className="text-sm font-black text-gray-900">{step.count}건</strong>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="rounded-2xl bg-white border border-[#EBEBEB] p-5 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wide">이탈 구간</p>
                        {dashboard.dropOff.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-6">이탈 데이터가 없습니다.</p>
                        ) : (
                          <ul className="space-y-2">
                            {dashboard.dropOff.map((item, i) => (
                              <li key={`${item.from}-${i}`} className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-bold text-red-800">{item.from} → {item.to}</span>
                                  <span className="text-xs font-bold text-red-600">{item.rate}%</span>
                                </div>
                                <p className="text-xs text-red-500">{item.lostUsers}명 이탈</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "feedback" && (
                    <div className="rounded-2xl bg-white border border-[#EBEBEB] p-5 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wide">유저 피드백 (VOC)</p>
                      {dashboard.feedback.length === 0 ? (
                        <div className="py-12 text-center">
                          <p className="text-sm text-gray-400">아직 남겨진 피드백이 없습니다.</p>
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {dashboard.feedback.map((item) => (
                            <li key={item.id} className="rounded-xl border border-[#EBEBEB] p-4">
                              <div className="flex items-start justify-between gap-3">
                                <span className={`shrink-0 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  item.sentiment === "positive" ? "bg-emerald-100 text-emerald-700" :
                                  item.sentiment === "negative" ? "bg-red-100 text-red-700" :
                                  "bg-gray-100 text-gray-600"
                                }`}>
                                  {item.sentiment === "positive" ? "긍정" : item.sentiment === "negative" ? "아쉬움" : "중립"}
                                </span>
                                <time className="shrink-0 text-xs text-gray-400">
                                  {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                                </time>
                              </div>
                              <p className="mt-2.5 text-sm leading-relaxed text-gray-700">{item.comment}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {activeTab === "waitlist" && (
                    <div className="rounded-2xl bg-white border border-[#EBEBEB] p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">알림 신청자 목록</p>
                        {waitlist.length > 0 && (
                          <button
                            onClick={() => {
                              const csv = ["이메일,신청일시", ...waitlist.map((w) =>
                                `${w.email},${new Date(w.createdAt).toLocaleString()}`
                              )].join("\n");
                              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `waitlist_${selectedProject?.name ?? "export"}.csv`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="flex items-center gap-1.5 rounded-full border border-[#EBEBEB] px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            CSV
                          </button>
                        )}
                      </div>
                      {waitlist.length === 0 ? (
                        <div className="py-12 text-center">
                          <p className="text-sm text-gray-400">아직 알림 신청자가 없습니다.</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-[#EBEBEB]">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-[#EBEBEB]">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400">#</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400">이메일</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-400">신청일</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F5F5F5]">
                              {waitlist.map((entry, i) => (
                                <tr key={entry.email} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                                  <td className="px-4 py-3 font-medium text-gray-900">{entry.email}</td>
                                  <td className="px-4 py-3 text-xs text-gray-400">
                                    {new Date(entry.createdAt).toLocaleDateString("ko-KR")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
