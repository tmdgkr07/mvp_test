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
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all group-hover:scale-110 group-active:scale-95 border border-blue-700/50">
                        <Zap className="h-6 w-6 fill-white text-white" />
                    </div>
                    <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:inline-block">
                        MVP<span className="font-bold">HUB</span>
                    </span>
                </Link>

                <div className="flex items-center gap-6">
                    <div className="hidden items-center gap-8 md:flex">
                        <Link href="/" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">탐색하기</Link>
                        <Link href="/dashboard" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">대시보드</Link>
                    </div>
                    <div className="h-6 w-px bg-slate-300/50" />
                    <AuthMenu />
                </div>
            </div>
        </nav>
    );
}
