"use client";

import Link from "next/link";
import AuthMenu from "./AuthMenu";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#EBEBEB] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-2xl transition-transform duration-300 group-hover:rotate-12">
              {"\uD83C\uDF5A"}
            </span>
            <span className="text-xl font-black tracking-tight text-ink">
              {"\uBC25\uC8FC\uC138\uC694"}
            </span>
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/explore"
              className="text-sm font-semibold text-ink-light transition-colors hover:text-ink"
            >
              {"\uC11C\uBE44\uC2A4 \uD0D0\uC0C9"}
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-ink shadow-btn transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-dark"
            >
              {"\uC11C\uBE44\uC2A4 \uB4F1\uB85D"}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AuthMenu />
        </div>
      </div>
    </nav>
  );
}
