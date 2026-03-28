"use client";

import { Chrome } from "lucide-react";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginButton({ callbackUrl }: { callbackUrl: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    try {
      setLoading(true);
      setError(null);
      await signIn("google", { callbackUrl });
      setLoading(false);
    } catch {
      setLoading(false);
      setError("로그인 창을 열지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void handleLogin()}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-[#dce8f7] bg-white px-5 py-3.5 text-sm font-bold text-slate-900 shadow-[0_18px_42px_-34px_rgba(23,68,129,0.32)] transition-all hover:-translate-y-0.5 hover:border-[#1d79d8] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eff6ff] text-[#1d79d8]">
          <Chrome className="h-4 w-4" />
        </span>
        {loading ? "로그인 준비 중..." : "Google로 로그인"}
      </button>

      {error ? <p className="rounded-[20px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
