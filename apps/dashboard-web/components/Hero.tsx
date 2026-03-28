"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface GlobalStats {
    totalProjects: number;
    totalUsers: number;
    totalVotes: number;
}

export default function Hero() {
    const [stats, setStats] = useState<GlobalStats | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/stats");
                const json = await res.json();
                if (json.data) setStats(json.data);
            } catch (e) {
                console.error("Failed to fetch statistics", e);
            }
        }
        fetchStats();
    }, []);

    const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

    return (
        <section className="bg-white px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
            <div className="mx-auto max-w-3xl text-center">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF9C4] border border-[#FFE066] px-4 py-2 text-sm font-bold text-[#8B6914] mb-8">
                    <span className="animate-float inline-block">🍚</span>
                    AI 빌더를 위한 검증 플랫폼
                </div>

                {/* Main heading */}
                <h1 className="text-5xl sm:text-7xl font-black text-ink leading-[1.05] tracking-tight">
                    후원과 피드백으로<br />
                    <span className="relative inline-block">
                        <span className="relative z-10">검증이 남는</span>
                        <span className="absolute -bottom-1 left-0 right-0 h-4 sm:h-5 bg-accent/40 -z-0 rounded-sm" />
                    </span>{" "}
                    구조
                </h1>

                {/* Subtext */}
                <p className="mt-7 text-lg sm:text-xl text-ink-light leading-relaxed max-w-xl mx-auto">
                    AI로 서비스를 만들었지만 다음이 막막한가요?<br />
                    후원 + 피드백을 결과 화면에 임베드해, 검증 데이터와 초기 수익을 동시에 만드세요.
                </p>

                {/* CTAs */}
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/register"
                        className="w-full sm:w-auto rounded-full bg-accent hover:bg-accent-dark px-8 py-4 text-base font-bold text-ink transition-all duration-200 shadow-btn hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-0"
                    >
                        내 서비스 등록하기 →
                    </Link>
                    <Link
                        href="/explore"
                        className="w-full sm:w-auto rounded-full border-2 border-[#EBEBEB] hover:border-ink/30 bg-white px-8 py-4 text-base font-bold text-ink transition-all duration-200"
                    >
                        서비스 둘러보기
                    </Link>
                </div>

                {/* Trust line */}
                <p className="mt-5 text-xs text-ink-light">
                    ✓ 무료로 시작 &nbsp;·&nbsp; ✓ 신용카드 불필요 &nbsp;·&nbsp; ✓ 5분이면 등록 완료
                </p>

                {/* Stats */}
                <div className="mt-16 grid grid-cols-3 gap-4">
                    {[
                        { value: stats ? fmt(stats.totalProjects) : "—", label: "등록된 서비스" },
                        { value: stats ? fmt(stats.totalVotes) : "—", label: "누적 응원" },
                        { value: stats ? fmt(stats.totalUsers) : "—", label: "함께하는 빌더" },
                    ].map(({ value, label }) => (
                        <div key={label} className="rounded-3xl bg-[#F9F7F3] border border-[#EBEBEB] p-6">
                            <p className="text-3xl sm:text-4xl font-black text-ink">{value}</p>
                            <p className="mt-1.5 text-sm font-semibold text-ink-light">{label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
