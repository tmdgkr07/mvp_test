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
        <section className="relative overflow-hidden px-6 pt-20 pb-16 sm:px-10 sm:pt-28 sm:pb-24 lg:pt-36 bg-white">
            {/* Subtle background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-100/60 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 left-0 w-72 h-72 bg-slate-100/80 rounded-full blur-3xl"></div>
            </div>

            <div className="mx-auto max-w-4xl text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 rounded-full bg-yellow-50 border border-yellow-300 px-4 py-1.5 text-sm font-semibold text-yellow-800"
                >
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    <span>FINTECH · EMBEDDED FINANCE</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mt-8 text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight text-slate-900"
                >
                    <span className="block">후원과 피드백으로</span>
                    <span className="block text-yellow-500">검증이 남는 구조</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-6 text-lg sm:text-xl leading-relaxed text-slate-600 lg:mx-auto lg:max-w-2xl"
                >
                    AI로 서비스를 만드는 사람은 늘었지만, 수익이 나기 전 검증이 가장 어렵습니다.<br />
                    후원 + 피드백을 결과 화면에 임베드해, 검증 데이터와 초기 수익을 동시에 만드세요.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
                >
                    <Link
                        href="/register"
                        className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 hover:bg-yellow-500 px-8 text-base font-bold text-slate-900 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 sm:w-auto"
                    >
                        <Rocket className="h-5 w-5" />
                        <span>내 서비스 등록하기</span>
                    </Link>
                    <Link
                        href="#projects"
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 text-base font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all sm:w-auto"
                    >
                        <span>서비스 둘러보기</span>
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </motion.div>

                {/* Stats Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="mt-20 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6"
                >
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-8">
                        <p className="text-4xl sm:text-5xl font-black text-slate-900">
                            {stats ? formatNumber(stats.totalProjects) : "—"}
                        </p>
                        <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-500">등록된 서비스</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-8">
                        <p className="text-4xl sm:text-5xl font-black text-yellow-500">
                            {stats ? formatNumber(stats.totalVotes) : "—"}
                        </p>
                        <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-500">누적 후원 / 피드백</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-8 col-span-2 sm:col-span-1">
                        <p className="text-4xl sm:text-5xl font-black text-slate-900">
                            {stats ? formatNumber(stats.totalUsers) : "—"}
                        </p>
                        <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-500">함께하는 빌더</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
