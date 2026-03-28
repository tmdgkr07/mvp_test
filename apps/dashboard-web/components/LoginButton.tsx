"use client";

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
      setError("로그인 창을 열지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void handleLogin()}
        disabled={loading}
        className="flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "로그인 준비 중..." : "Google로 로그인"}
      </button>

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
