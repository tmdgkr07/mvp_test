"use client";

import type { Route } from "next";
import { Suspense, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildLoginHref, buildPathWithSearch } from "@/lib/auth-routing";

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  followerCount
}: {
  targetUserId: string;
  initialIsFollowing: boolean;
  followerCount: number;
}) {
  return (
    <Suspense
      fallback={
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-full border border-blue-700/50 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white opacity-50 shadow-md"
        >
          <span className="text-lg">+</span>
          <span>Loading</span>
        </button>
      }
    >
      <FollowButtonContent
        targetUserId={targetUserId}
        initialIsFollowing={initialIsFollowing}
        followerCount={followerCount}
      />
    </Suspense>
  );
}

function FollowButtonContent({
  targetUserId,
  initialIsFollowing,
  followerCount
}: {
  targetUserId: string;
  initialIsFollowing: boolean;
  followerCount: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [count, setCount] = useState(followerCount);
  const [loading, setLoading] = useState(false);
  const currentPath = buildPathWithSearch(pathname || "/", searchParams);

  if (session?.user?.id === targetUserId) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/50 bg-gradient-to-r from-slate-500/10 to-slate-500/5 px-6 py-3 text-sm font-bold text-slate-700">
        <span className="text-lg">내</span>
        내 프로필 (팔로워 {count}명)
      </div>
    );
  }

  async function handleFollow() {
    if (!session?.user?.id) {
      router.push(buildLoginHref(currentPath) as Route);
      return;
    }

    setLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!isFollowing);
    setCount((prev) => (wasFollowing ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/maker/${targetUserId}/follow`, { method: "POST" });
      if (!res.ok) {
        throw new Error("Failed to follow");
      }
      router.refresh();
    } catch {
      setIsFollowing(wasFollowing);
      setCount((prev) => (wasFollowing ? prev + 1 : prev - 1));
      alert("서버 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={() => void handleFollow()}
      disabled={loading}
      className={`group inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-bold shadow-md transition-all duration-300 hover:shadow-lg disabled:opacity-50 ${
        isFollowing
          ? "border-slate-700/50 bg-gradient-to-r from-slate-500 to-slate-600 text-white hover:from-slate-600 hover:to-slate-700"
          : "border-blue-700/50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700"
      }`}
    >
      <span className={`text-lg transition-transform ${isFollowing ? "group-hover:scale-110" : "group-hover:scale-125"}`}>
        {isFollowing ? "✓" : "+"}
      </span>
      <span>{isFollowing ? "팔로우 취소" : "팔로우"}</span>
      <span className="text-xs font-semibold opacity-80">({count})</span>
    </button>
  );
}
