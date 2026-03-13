"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import NotificationMenu from "@/components/NotificationMenu";
import { buildLoginHref } from "@/lib/auth-routing";

export default function AuthMenu() {
  const { data, status } = useSession();
  const pathname = usePathname();
  const currentPath = pathname || "/";
  const loginHref = (pathname === "/login" ? "/login" : buildLoginHref(currentPath)) as Route;

  if (status === "loading") {
    return <span className="text-sm font-medium text-ink-light">...</span>;
  }

  if (!data?.user) {
    return (
      <Link
        href={loginHref}
        className="rounded-full border-2 border-[#EBEBEB] bg-white px-5 py-2.5 text-sm font-bold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/30"
      >
        로그인
      </Link>
    );
  }

  const displayName = data.user.name || data.user.email || "User";
  const isAdmin = Boolean(data.user.isAdmin || data.user.role === "admin");

  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-3 rounded-full border border-[#E8E3D0] bg-[#FFFCF1] px-3 py-2 shadow-[0_8px_20px_rgba(28,28,28,0.06)] sm:flex">
        {data.user.image ? (
          <Image
            src={data.user.image}
            alt={displayName}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-black text-ink">
            {displayName[0]}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="max-w-[160px] truncate text-sm font-bold text-ink">{displayName}</p>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ${
                isAdmin ? "bg-[#F3E8FF] text-[#6E3CBC]" : "bg-[#FFF1BF] text-[#7A5B00]"
              }`}
            >
              {isAdmin ? "관리자" : "제작자"}
            </span>
          </div>
          {data.user.email ? (
            <p className="max-w-[160px] truncate text-xs text-ink-light">{data.user.email}</p>
          ) : null}
        </div>
      </div>

      <div className="group relative hidden sm:block">
        <Link
          href="/dashboard"
          className="block rounded-full border border-[#E5D27A] bg-[#FFF3B3] px-4 py-2 text-sm font-bold text-[#6B5300] shadow-[0_10px_24px_rgba(214,181,29,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFE784]"
        >
          워크스페이스
        </Link>

        <div className="invisible absolute right-0 top-full z-50 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
          <div className="w-56 rounded-2xl border border-[#EEE5BC] bg-white p-2 shadow-[0_18px_40px_rgba(33,33,33,0.12)]">
            <p className="px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">My Workspace</p>
            <Link
              href="/dashboard?hub=platform"
              className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-[#FFF9DC] hover:text-gray-900"
            >
              플랫폼 허브
            </Link>
            <Link
              href="/dashboard?hub=service"
              className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-[#FFF9DC] hover:text-gray-900"
            >
              서비스 허브
            </Link>
            <Link
              href="/dashboard?hub=account"
              className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-[#FFF9DC] hover:text-gray-900"
            >
              계정 설정
            </Link>
            <Link
              href="/dashboard?hub=billing"
              className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-[#FFF9DC] hover:text-gray-900"
            >
              결제 설정
            </Link>

            {isAdmin ? (
              <div className="mt-2 border-t border-[#F3EBC7] pt-2">
                <p className="px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#8A63D2]">Admin Only</p>
                <Link
                  href="/admin"
                  className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-[#5C3C9B] transition-colors hover:bg-[#F8F4FF]"
                >
                  관리자 콘솔
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <NotificationMenu userId={data.user.id} />

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-full border-2 border-[#EBEBEB] bg-white px-4 py-2 text-sm font-bold text-ink-light transition-all hover:border-ink/20 hover:text-ink"
      >
        로그아웃
      </button>
    </div>
  );
}
