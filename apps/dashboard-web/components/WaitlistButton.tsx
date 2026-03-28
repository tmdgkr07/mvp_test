"use client";

import { BellRing, MailCheck } from "lucide-react";
import { useState } from "react";

export default function WaitlistButton({ projectId }: { projectId: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const response = await fetch(`/api/projects/${projectId}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!response.ok) throw new Error();
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="soft-card px-5 py-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#e9f9ef] text-[#16a34a]">
          <MailCheck className="h-6 w-6" />
        </div>
        <p className="mt-4 text-xl font-black text-slate-950">대기열 등록이 완료되었습니다.</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          서비스가 준비되면 입력한 이메일로 먼저 알려드릴게요.
        </p>
      </div>
    );
  }

  return (
    <div className="soft-card px-5 py-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#eef5ff] text-[#1d79d8]">
          <BellRing className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-black text-slate-950">출시 알림 받기</p>
          <p className="text-sm text-slate-500">준비되면 이메일로 가장 먼저 알려드립니다.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          type="email"
          required
          placeholder="email@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={status === "loading"}
          className="field-input"
        />
        <button type="submit" disabled={status === "loading"} className="brand-button w-full">
          {status === "loading" ? "등록 중..." : "대기열 등록하기"}
        </button>
      </form>

      {status === "error" ? (
        <p className="mt-4 rounded-[16px] bg-red-50 px-4 py-3 text-sm text-red-700">
          요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
      ) : null}
    </div>
  );
}
