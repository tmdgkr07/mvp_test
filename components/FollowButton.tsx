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
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-slate-500/10 to-slate-500/5 border border-slate-300/50 text-sm font-bold text-slate-700">
                <span className="text-lg">👤</span>
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
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 group ${
                isFollowing
                    ? "bg-gradient-to-r from-slate-500 to-slate-600 text-white border border-slate-700/50 hover:from-slate-600 hover:to-slate-700"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-700/50 hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5"
            }`}
        >
            <span className={`text-lg transition-transform ${isFollowing ? 'group-hover:scale-110' : 'group-hover:scale-125'}`}>
                {isFollowing ? '✓' : '❤️'}
            </span>
            <span>{isFollowing ? "팔로우 취소" : "팔로우"}</span>
            <span className="text-xs opacity-80 font-semibold">({count})</span>
        </button>
    );
}
