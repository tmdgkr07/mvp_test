"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { buildLoginHref } from "@/lib/auth-routing";

export default function AuthMenu() {
  const { data, status } = useSession();
  const pathname = usePathname();
  const currentPath = pathname || "/";
  const loginHref = (pathname === "/login" ? "/login" : buildLoginHref(currentPath)) as Route;

  if (status === "loading") {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden h-10 w-16 animate-pulse rounded-full bg-gray-100 md:block" />
        <div className="h-10 w-32 animate-pulse rounded-full bg-blue-100" />
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="flex items-center gap-4">
        <Link href={loginHref} className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 md:inline-flex">
          로그인
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Register Service
        </Link>
      </div>
    );
  }

  const displayName = data.user.name || data.user.email || "Builder";
  const initials = displayName.charAt(0).toUpperCase();
  const isAdmin = Boolean(data.user.isAdmin || data.user.role === "admin" || data.user.role === "super_admin");

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="hidden items-center gap-3 rounded-full border border-gray-200 bg-white px-3 py-2 md:flex">
        {data.user.image ? (
          <Image
            src={data.user.image}
            alt={displayName}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d79d8] text-xs font-black text-white">
            {initials}
          </div>
        )}
        <p className="max-w-[120px] truncate text-sm font-medium text-gray-800">{displayName}</p>
      </div>

      {isAdmin ? (
        <Link
          href="/admin"
          className="hidden rounded-full border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 sm:inline-flex"
        >
          Admin
        </Link>
      ) : null}

      <Link href="/dashboard" className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 sm:inline-flex">
        Workspace
      </Link>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        로그아웃
      </button>
    </div>
  );
}
