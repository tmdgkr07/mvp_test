"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { buildLoginHref, buildPathWithSearch } from "@/lib/auth-routing";

export default function AuthMenu() {
  return (
    <Suspense fallback={<span className="text-sm font-medium text-ink-light">...</span>}>
      <AuthMenuContent />
    </Suspense>
  );
}

function AuthMenuContent() {
  const { data, status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = buildPathWithSearch(pathname || "/", searchParams);
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
        {"\uB85C\uADF8\uC778"}
      </Link>
    );
  }

  const displayName = data.user.name || data.user.email || "User";

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
          <p className="max-w-[160px] truncate text-sm font-bold text-ink">{displayName}</p>
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
          {"\uB9C8\uC774\uD398\uC774\uC9C0"}
        </Link>

        <div className="invisible absolute right-0 top-full z-50 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
          <div className="w-52 rounded-2xl border border-[#EEE5BC] bg-white p-2 shadow-[0_18px_40px_rgba(33,33,33,0.12)]">
            <Link
              href="/dashboard?hub=platform"
              className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-[#FFF9DC] hover:text-gray-900"
            >
              {"\uD50C\uB7AB\uD3FC \uD5C8\uBE0C"}
            </Link>
            <Link
              href="/dashboard?hub=service"
              className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-[#FFF9DC] hover:text-gray-900"
            >
              {"\uC11C\uBE44\uC2A4 \uD5C8\uBE0C"}
            </Link>
            <Link
              href="/dashboard?hub=account"
              className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-[#FFF9DC] hover:text-gray-900"
            >
              {"\uAC1C\uC778\uC815\uBCF4 \uAD00\uB9AC"}
            </Link>
            <Link
              href="/dashboard?hub=billing"
              className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-[#FFF9DC] hover:text-gray-900"
            >
              {"\uACB0\uC81C \uC218\uB2E8 \uAD00\uB9AC"}
            </Link>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-full border-2 border-[#EBEBEB] bg-white px-4 py-2 text-sm font-bold text-ink-light transition-all hover:border-ink/20 hover:text-ink"
      >
        {"\uB85C\uADF8\uC544\uC6C3"}
      </button>
    </div>
  );
}
