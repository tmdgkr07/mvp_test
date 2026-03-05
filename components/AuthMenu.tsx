"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthMenu() {
  const { data, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-ink/70">로그인 확인 중...</span>;
  }

  if (!data?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn("google")}
        className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90"
      >
        Google 로그인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-ink/70">{data.user.name || data.user.email}</span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
      >
        로그아웃
      </button>
    </div>
  );
}
