"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function FollowButton({
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
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [count, setCount] = useState(followerCount);
    const [loading, setLoading] = useState(false);

    // If viewing own profile, hide follow interaction
    if (session?.user?.id === targetUserId) {
        return (
            <div className="rounded-full bg-ink/5 px-4 py-2 text-sm font-bold text-ink/70">
                내 프로필 (팔로워 {count}명)
            </div>
        );
    }

    const handleFollow = async () => {
        if (!session?.user?.id) {
            alert("로그인이 필요합니다.");
            return;
        }

        setLoading(true);
        // Optimistic UI update
        const wasFollowing = isFollowing;
        setIsFollowing(!isFollowing);
        setCount(prev => (wasFollowing ? prev - 1 : prev + 1));

        try {
            const res = await fetch(`/api/maker/${targetUserId}/follow`, { method: "POST" });
            if (!res.ok) {
                throw new Error("Failed to follow");
            }
            router.refresh();
        } catch {
            // Revert in case of error
            setIsFollowing(wasFollowing);
            setCount(prev => (wasFollowing ? prev + 1 : prev - 1));
            alert("서버 오류가 발생했습니다. 다시 시도해 주세요.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleFollow}
            disabled={loading}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all ${isFollowing
                    ? "border border-ink/20 bg-white text-ink hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    : "bg-ink text-white shadow-md hover:scale-105"
                } disabled:opacity-50`}
        >
            {isFollowing ? `✓ 팔로잉 (${count})` : `+ 팔로우 (${count})`}
        </button>
    );
}
