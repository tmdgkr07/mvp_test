"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthMenu() {
  const { data, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-ink-light font-medium">...</span>;
  }

  if (!data?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn("google")}
        className="rounded-full border-2 border-[#EBEBEB] hover:border-ink/30 bg-white px-5 py-2.5 text-sm font-bold text-ink transition-all duration-200 hover:-translate-y-0.5"
      >
        로그인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden sm:block text-sm font-semibold text-ink-light">{data.user.name || data.user.email}</span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-full border-2 border-[#EBEBEB] hover:border-ink/20 px-4 py-2 text-sm font-bold text-ink-light hover:text-ink bg-white transition-all"
      >
        로그아웃
      </button>
    </div>
  );
}
