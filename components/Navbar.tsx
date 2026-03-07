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
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "glass border-b py-3 shadow-glass" : "bg-transparent py-5"
                }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-10">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white transition-transform group-hover:scale-110 group-active:scale-95">
                        <Zap className="h-6 w-6 fill-accent text-accent" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-ink sm:text-2xl">
                        MVP<span className="text-accent underline decoration-ink/10 underline-offset-4">HUB</span>
                    </span>
                </Link>

                <div className="flex items-center gap-6">
                    <div className="hidden items-center gap-6 md:flex">
                        <Link href="/" className="text-sm font-bold text-ink/70 hover:text-ink">탐색하기</Link>
                        <Link href="/dashboard" className="text-sm font-bold text-ink/70 hover:text-ink">대시보드</Link>
                    </div>
                    <div className="h-6 w-px bg-ink/10" />
                    <AuthMenu />
                </div>
            </div>
        </nav>
    );
}
