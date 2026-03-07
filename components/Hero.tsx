"use client";

import { motion } from "framer-motion";
import { ArrowRight, Rocket, Sparkles } from "lucide-react";
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

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat("ko-KR").format(num);
    };

    return (
        <section className="relative overflow-hidden px-6 pt-24 pb-16 sm:px-10 sm:pt-32 sm:pb-24 lg:pt-40">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 opacity-20 blur-[120px] bg-gradient-to-br from-accent via-support to-transparent" />

            <div className="mx-auto max-w-5xl text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 rounded-full glass border border-ink/5 px-4 py-1.5 text-sm font-bold text-ink/70 shadow-sm"
                >
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span>가장 빠른 MVP 검증 및 후원 플랫폼</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mt-8 text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl"
                >
                    <span className="block">빌더를 위한</span>
                    <span className="text-gradient">궁극의 홍보 보드</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-8 text-lg font-medium leading-relaxed text-ink/60 sm:text-xl lg:mx-auto lg:max-w-3xl"
                >
                    실제 동작하는 URL만 있다면 충분합니다. 불필요한 과정 없이
                    핵심 기능을 소개하고, 유저들로부터 직접적인 후원과 피드백을 확보하세요.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
                >
                    <Link
                        href="/register"
                        className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-ink px-8 text-lg font-bold text-white shadow-premium transition-all hover:bg-ink/90 sm:w-auto"
                    >
                        <Rocket className="h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                        <span>내 MVP 등록하기</span>
                    </Link>
                    <Link
                        href="#projects"
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-white/50 px-8 text-lg font-bold text-ink backdrop-blur-sm transition-all hover:bg-white sm:w-auto"
                    >
                        <span>프로젝트 둘러보기</span>
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </motion.div>

                {/* Stats / Proof */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="mt-20 grid grid-cols-2 gap-8 divide-x divide-ink/5 sm:grid-cols-3 lg:mt-32"
                >
                    <div className="flex flex-col items-center">
                        <span className="text-3xl font-black text-ink">
                            {stats ? formatNumber(stats.totalProjects) : "..."}
                        </span>
                        <span className="mt-1 text-sm font-bold text-ink/40 uppercase tracking-widest">등록된 MVP</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-3xl font-black text-ink">
                            {stats ? formatNumber(stats.totalVotes) : "..."}
                        </span>
                        <span className="mt-1 text-sm font-bold text-ink/40 uppercase tracking-widest">누적 응원 화력</span>
                    </div>
                    <div className="hidden flex-col items-center sm:flex">
                        <span className="text-3xl font-black text-ink">
                            {stats ? formatNumber(stats.totalUsers) : "..."}
                        </span>
                        <span className="mt-1 text-sm font-bold text-ink/40 uppercase tracking-widest">함께하는 빌더</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
