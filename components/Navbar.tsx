"use client";

import Link from "next/link";
import AuthMenu from "./AuthMenu";
import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled 
                    ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/60 py-3 shadow-lg" 
                    : "bg-transparent py-5"
            }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-10">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-slate-900 shadow-sm hover:shadow-md transition-all group-hover:scale-105">
                        <Zap className="h-5 w-5 fill-slate-900 text-slate-900" />
                    </div>
                    <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:inline-block">
                        MINI<span className="text-yellow-500">-TIPS</span>
                    </span>
                </Link>

                <div className="flex items-center gap-6">
                    <div className="hidden items-center gap-8 md:flex">
                        <Link href="/explore" className="text-sm font-semibold text-slate-700 hover:text-yellow-500 transition-colors">서비스 탐색</Link>
                        <Link href="/dashboard" className="text-sm font-semibold text-slate-700 hover:text-yellow-500 transition-colors">대시보드</Link>
                    </div>
                    <div className="h-6 w-px bg-slate-300/50" />
                    <AuthMenu />
                </div>
            </div>
        </nav>
    );
}
