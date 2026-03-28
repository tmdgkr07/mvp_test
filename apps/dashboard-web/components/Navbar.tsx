"use client";

import Link from "next/link";
import AuthMenu from "@/components/AuthMenu";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white px-6 py-4 shadow-sm">
      <div className="page-container flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1d79d8] text-base font-black text-white">
            F
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">feedback4U</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="/#overview" className="brand-nav-link">
            서비스 소개
          </Link>
          <Link href="/register" className="brand-nav-link">
            서비스 등록
          </Link>
        </div>

        <AuthMenu />
      </div>
    </nav>
  );
}
