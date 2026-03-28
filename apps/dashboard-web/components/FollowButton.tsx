"use client";

import type { Route } from "next";
import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserPlus2 } from "lucide-react";
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
        <button type="button" disabled className="brand-button gap-2 px-5 py-2.5 opacity-60">
          <UserPlus2 className="h-4 w-4" />
          Loading
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
    return <div className="brand-button-secondary gap-2 px-5 py-2.5">My profile followers {count}</div>;
  }

  async function handleFollow() {
    if (!session?.user?.id) {
      router.push(buildLoginHref(currentPath) as Route);
      return;
    }

    setLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!isFollowing);
    setCount((current) => (wasFollowing ? current - 1 : current + 1));

    try {
      const response = await fetch(`/api/maker/${targetUserId}/follow`, { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to follow");
      }
      router.refresh();
    } catch {
      setIsFollowing(wasFollowing);
      setCount((current) => (wasFollowing ? current + 1 : current - 1));
      alert("요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={() => void handleFollow()}
      disabled={loading}
      className={isFollowing ? "brand-button-secondary gap-2 px-5 py-2.5" : "brand-button gap-2 px-5 py-2.5"}
    >
      <UserPlus2 className="h-4 w-4" />
      <span>{isFollowing ? "언팔로우" : "팔로우"}</span>
      <span className="text-xs font-semibold opacity-80">({count})</span>
    </button>
  );
}
