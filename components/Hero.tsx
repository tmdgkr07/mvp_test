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
        <section className="relative overflow-hidden px-6 pt-20 pb-16 sm:px-10 sm:pt-28 sm:pb-24 lg:pt-36">
            {/* Advanced Background Decoration */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-300/40 to-indigo-300/40 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-0 w-96 h-96 bg-gradient-to-tr from-slate-300/30 to-blue-300/30 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-slate-200/20 rounded-full blur-3xl"></div>
            </div>

            <div className="mx-auto max-w-5xl text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2.5 rounded-full bg-white/60 backdrop-blur-sm border-2 border-blue-200/50 px-5 py-2 text-sm font-bold text-blue-800 shadow-lg"
                >
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <span>가장 빠른 MVP 검증 및 후원 플랫폼</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mt-8 text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight"
                >
                    <span className="block text-slate-900">빌더를 위한</span>
                    <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">궁극의 홍보 보드</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-8 text-lg sm:text-xl font-semibold leading-relaxed text-slate-700 lg:mx-auto lg:max-w-3xl"
                >
                    실제 동작하는 URL만 있다면 충분합니다. 불필요한 과정 없이
                    <br/>핵심 기능을 소개하고, 유저들로부터 직접적인 후원과 피드백을 확보하세요.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
                >
                    <Link
                        href="/register"
                        className="group relative flex h-16 w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-lg font-bold text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 border border-blue-700/50 sm:w-auto"
                    >
                        <Rocket className="h-6 w-6 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                        <span>내 MVP 등록하기</span>
                    </Link>
                    <Link
                        href="#projects"
                        className="flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-slate-400 bg-white px-8 text-lg font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-500 transition-all hover:-translate-y-0.5 sm:w-auto"
                    >
                        <span>프로젝트 둘러보기</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>

                {/* Enhanced Stats Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="mt-20 lg:mt-32 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8"
                >
                    <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200/50 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all">
                        <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                            {stats ? formatNumber(stats.totalProjects) : "..."}
                        </p>
                        <p className="mt-2 text-xs sm:text-sm font-bold text-blue-700 uppercase tracking-widest">등록된 MVP</p>
                    </div>
                    <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-orange-100/50 border-2 border-orange-200/50 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all">
                        <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                            {stats ? formatNumber(stats.totalVotes) : "..."}
                        </p>
                        <p className="mt-2 text-xs sm:text-sm font-bold text-orange-700 uppercase tracking-widest">응원 화력 🔥</p>
                    </div>
                    <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-2 border-indigo-200/50 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all col-span-2 sm:col-span-1">
                        <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
                            {stats ? formatNumber(stats.totalUsers) : "..."}
                        </p>
                        <p className="mt-2 text-xs sm:text-sm font-bold text-indigo-700 uppercase tracking-widest">함께하는 빌더</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
