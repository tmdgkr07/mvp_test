"use client";

import Link from "next/link";
import AuthMenu from "./AuthMenu";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-[#EBEBEB]">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-2xl transition-transform group-hover:rotate-12 duration-300">🍚</span>
                        <span className="text-xl font-black text-ink tracking-tight">
                            밥주세요
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/explore" className="text-sm font-semibold text-ink-light hover:text-ink transition-colors">
                            서비스 탐색
                        </Link>
                        <Link href="/dashboard" className="text-sm font-semibold text-ink-light hover:text-ink transition-colors">
                            마이페이지
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/register"
                        className="hidden sm:flex rounded-full bg-accent hover:bg-accent-dark text-ink text-sm font-bold px-5 py-2.5 transition-all duration-200 hover:-translate-y-0.5 shadow-btn"
                    >
                        서비스 등록
                    </Link>
                    <AuthMenu />
                </div>
            </div>

        </nav>
    );
}
