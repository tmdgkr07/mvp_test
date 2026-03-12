"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const MESSAGE_LIMIT = 50;

type ApiResult<T> = {
  data?: T;
  error?: { code: string; message: string };
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

type FeedbackTab = "unread" | "read";

type CreatorFeedbackInboxProps = {
  projectId?: string | null;
  projectName?: string | null;
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("ko-KR")} ${currency}`;
  }
}

export default function CreatorFeedbackInbox({ projectId = null, projectName = null }: CreatorFeedbackInboxProps) {
  const [activeTab, setActiveTab] = useState<FeedbackTab>("unread");
  const [messages, setMessages] = useState<CreatorFeedbackMessage[]>([]);
  const [counts, setCounts] = useState<CreatorFeedbackCounts>({ all: 0, read: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [markingMessageId, setMarkingMessageId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: String(MESSAGE_LIMIT),
          filter: activeTab
        });

        if (projectId) {
          params.set("projectId", projectId);
        }

        const response = await fetch(`/api/messages?${params.toString()}`, { cache: "no-store" });
        const payload = (await response.json()) as ApiResult<CreatorFeedbackPayload>;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "피드백 메시지를 불러오지 못했습니다.");
        }

        if (!cancelled) {
          setMessages(payload.data.messages);
          setCounts(payload.data.counts);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setMessages([]);
          setCounts({ all: 0, read: 0, unread: 0 });
          setError(fetchError instanceof Error ? fetchError.message : "피드백 메시지를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [activeTab, projectId]);

  async function applyMessageAction(body: Record<string, unknown>) {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...body,
        filter: activeTab,
        limit: MESSAGE_LIMIT,
        ...(projectId ? { projectId } : {})
      })
    });

    const payload = (await response.json()) as ApiResult<CreatorFeedbackPayload>;
    if (!response.ok || !payload.data) {
      throw new Error(payload.error?.message || "피드백 메시지를 업데이트하지 못했습니다.");
    }

    setMessages(payload.data.messages);
    setCounts(payload.data.counts);
  }

  async function handleMarkAllRead() {
    if (counts.unread === 0) {
      return;
    }

    setMarkingAllRead(true);
    setError(null);

    try {
      await applyMessageAction({
        action: "mark-all-read"
      });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "피드백 메시지를 모두 읽음 처리하지 못했습니다.");
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function handleMarkRead(messageId: string) {
    setMarkingMessageId(messageId);
    setError(null);

    try {
      await applyMessageAction({
        action: "mark-read",
        messageId
      });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "피드백 메시지를 읽음 처리하지 못했습니다.");
    } finally {
      setMarkingMessageId(null);
    }
  }

  const title = projectName ? `${projectName} 피드백 메시지` : "전체 서비스 피드백 메시지";
  const description = projectName
    ? "이 서비스에 도착한 후원 피드백을 읽지 않음과 읽음으로 나눠 확인할 수 있습니다."
    : "내가 관리하는 모든 서비스의 후원 피드백을 한곳에서 확인하고 읽음 처리할 수 있습니다.";

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <section className="rounded-[32px] bg-white p-8 shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-gray-400">Creator Messages</p>
            <h1 className="mt-3 text-4xl font-black text-gray-900">{title}</h1>
            <p className="mt-4 text-base leading-7 text-gray-600">{description}</p>
          </div>
          <Link
            href={projectId ? "/dashboard?hub=service" : "/dashboard?hub=service"}
            className="inline-flex rounded-full border border-[#EBEBEB] px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
          >
            서비스 허브로 돌아가기
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-[#F1EEE2] bg-[#FFFCF3] p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${activeTab === "unread" ? "bg-[#FFF3B3] text-[#6B5300]" : "bg-white text-gray-500 hover:bg-gray-100"}`}
            >
              읽지 않음 {counts.unread}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("read")}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${activeTab === "read" ? "bg-[#FFF3B3] text-[#6B5300]" : "bg-white text-gray-500 hover:bg-gray-100"}`}
            >
              읽음 {counts.read}
            </button>
            <span className="ml-1 text-sm font-medium text-gray-500">전체 {counts.all}</span>
          </div>

          {activeTab === "unread" ? (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={markingAllRead || counts.unread === 0}
              className="rounded-full border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {markingAllRead ? "처리 중..." : "모두 읽음"}
            </button>
          ) : null}
        </div>

        {error ? <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-600">{error}</div> : null}

        {loading ? (
          <div className="mt-10 rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center text-sm text-gray-500">
            피드백 메시지를 불러오는 중입니다.
          </div>
        ) : messages.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
            <p className="text-sm font-bold text-gray-900">
              {activeTab === "unread" ? "읽지 않은 피드백 메시지가 없습니다." : "읽음 처리한 피드백 메시지가 없습니다."}
            </p>
            <p className="mt-2 text-sm text-gray-500">후원자가 남긴 메시지는 최근 순으로 이 화면에 표시됩니다.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {messages.map((message) => {
              const createdAt = new Date(message.approvedAt || message.createdAt).toLocaleString("ko-KR");
              const readAt = message.creatorReadAt ? new Date(message.creatorReadAt).toLocaleString("ko-KR") : null;
              const isMarkingThisMessage = markingMessageId === message.id;

              return (
                <article key={message.id} className="rounded-3xl border border-[#EBEBEB] bg-[#FFFDF7] p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-gray-900">{message.supporterName || "익명 후원자"}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            message.creatorReadAt ? "bg-emerald-50 text-emerald-600" : "bg-[#FFF3B3] text-[#6B5300]"
                          }`}
                        >
                          {message.creatorReadAt ? "읽음" : "읽지 않음"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        {message.project.name} · {createdAt}
                      </p>
                      {readAt ? <p className="mt-1 text-[11px] font-bold text-emerald-600">읽음 {readAt}</p> : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-[#FFF3B3] px-3 py-1 text-xs font-black text-[#6B5300]">
                      {formatMoney(message.amount, message.currency)}
                    </span>
                  </div>

                  <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">{message.message}</p>

                  {!message.creatorReadAt ? (
                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void handleMarkRead(message.id)}
                        disabled={isMarkingThisMessage}
                        className="rounded-full border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isMarkingThisMessage ? "처리 중..." : "읽음 처리"}
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
