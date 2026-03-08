"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthMenu() {
  const { data, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-slate-500 font-medium">로그인 확인 중...</span>;
  }

  if (!data?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn("google")}
        className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:shadow-lg hover:-translate-y-0.5 transition-all border border-blue-700/50 shadow-md"
      >
        Google 로그인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-slate-700 hidden sm:inline">{data.user.name || data.user.email}</span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-full border-2 border-slate-400 px-5 py-2 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-500 transition-all"
      >
        로그아웃
      </button>
    </div>
  );
}
