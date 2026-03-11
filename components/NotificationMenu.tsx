"use client";

import type { Route } from "next";
import Link from "next/link";
import { Bell, ChevronRight, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type NotificationItem = {
  id: string;
  kind: "feedback" | "support";
  projectId: string;
  projectName: string;
  detail: string;
  createdAt: string;
  href: string;
};

type NotificationPayload = {
  items: NotificationItem[];
  feedbackCount: number;
  supportCount: number;
  latestCreatedAt: string | null;
};

type ApiResult<T> = {
  data?: T;
  error?: { code: string; message: string };
};

const EMPTY_PAYLOAD: NotificationPayload = {
  items: [],
  feedbackCount: 0,
  supportCount: 0,
  latestCreatedAt: null
};

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diff = Date.now() - timestamp;

  if (Number.isNaN(timestamp) || diff < 60_000) {
    return "방금 전";
  }

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) {
    return `${minutes}분 전`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}시간 전`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}일 전`;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric"
  }).format(new Date(value));
}

export default function NotificationMenu({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<NotificationPayload>(EMPTY_PAYLOAD);
  const [unseenCount, setUnseenCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const storageKey = `babjuseyo_notifications_last_seen_at_${userId}`;

  function computeUnseenCount(items: NotificationItem[], latestCreatedAt: string | null, initializeIfEmpty = false) {
    const stored = window.localStorage.getItem(storageKey);

    if (!stored) {
      if (initializeIfEmpty && latestCreatedAt) {
        window.localStorage.setItem(storageKey, latestCreatedAt);
      }
      return 0;
    }

    const seenAt = new Date(stored).getTime();
    if (Number.isNaN(seenAt)) {
      if (initializeIfEmpty && latestCreatedAt) {
        window.localStorage.setItem(storageKey, latestCreatedAt);
      }
      return 0;
    }

    return items.filter((item) => new Date(item.createdAt).getTime() > seenAt).length;
  }

  function markAllAsSeen(latestCreatedAt: string | null) {
    if (!latestCreatedAt) return;
    window.localStorage.setItem(storageKey, latestCreatedAt);
    setUnseenCount(0);
  }

  async function loadNotifications(initializeIfEmpty = false) {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const nextPayload = (await response.json()) as ApiResult<NotificationPayload>;

      if (!response.ok || !nextPayload.data) {
        throw new Error(nextPayload.error?.message || "알림을 불러오지 못했습니다.");
      }

      setPayload(nextPayload.data);
      setError(null);

      if (isOpen) {
        markAllAsSeen(nextPayload.data.latestCreatedAt);
      } else {
        setUnseenCount(computeUnseenCount(nextPayload.data.items, nextPayload.data.latestCreatedAt, initializeIfEmpty));
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "알림을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications(true);

    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30_000);

    const handleFocus = () => {
      void loadNotifications();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isOpen, storageKey]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  function toggleOpen() {
    setIsOpen((current) => {
      const next = !current;
      if (next) {
        markAllAsSeen(payload.latestCreatedAt);
      }
      return next;
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#E5D27A] bg-[#FFF7CC] text-[#6B5300] shadow-[0_10px_24px_rgba(214,181,29,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFE784]"
      >
        <Bell className="h-4 w-4" />
        {unseenCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#D64545] px-1.5 text-[10px] font-black text-white">
            {unseenCount > 9 ? "9+" : unseenCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-3 w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[28px] border border-[#EEE5BC] bg-white shadow-[0_24px_60px_rgba(33,33,33,0.16)]">
          <div className="border-b border-[#F3EBC7] bg-[#FFFDF2] px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-gray-900">알림</p>
                <p className="mt-1 text-xs text-gray-500">내 서비스에 들어온 피드백과 응원을 빠르게 확인해보세요.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex min-w-[56px] items-center justify-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-black text-gray-700 shadow-sm">
                  <MessageSquare className="h-5 w-5 text-[#2F80ED]" />
                  <span>{payload.feedbackCount}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-gray-700 shadow-sm">
                  <span className="text-sm leading-none">🍚</span>
                  <span>{payload.supportCount}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-3">
            {loading ? <p className="px-3 py-8 text-center text-sm text-gray-400">알림을 불러오는 중입니다...</p> : null}

            {!loading && error ? <p className="px-3 py-8 text-center text-sm text-red-600">{error}</p> : null}

            {!loading && !error && payload.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E7E1C2] bg-[#FFFDF6] px-4 py-10 text-center">
                <p className="text-sm font-bold text-gray-900">아직 새 알림이 없어요.</p>
                <p className="mt-2 text-xs leading-5 text-gray-500">서비스에 피드백이나 응원이 들어오면 여기에서 바로 확인할 수 있어요.</p>
              </div>
            ) : null}

            {!loading && !error ? (
              <div className="space-y-2">
                {payload.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href as Route}
                    onClick={() => setIsOpen(false)}
                    className="block rounded-2xl border border-transparent bg-[#FAFAFA] px-4 py-4 transition-all hover:border-[#E5D27A] hover:bg-[#FFFDF2]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black ${
                          item.kind === "feedback"
                            ? "bg-[#EEF5FF] text-[#2F5EA8]"
                            : "bg-[#FFF3D8] text-[#A35F00]"
                        }`}
                      >
                        {item.kind === "feedback" ? "새 피드백" : "새 응원"}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-400">{formatRelativeTime(item.createdAt)}</span>
                    </div>

                    <p className="mt-2 text-sm font-black text-gray-900">{item.projectName}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{item.detail}</p>

                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#8B6914]">
                      바로 보기
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
