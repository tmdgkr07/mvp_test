"use client";

import { useState } from "react";

export default function WaitlistButton({ projectId }: { projectId: string }) {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");
        try {
            const res = await fetch(`/api/projects/${projectId}/waitlist`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) throw new Error();
            setStatus("success");
            setEmail("");
        } catch {
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <div className="rounded-2xl bg-emerald-50 p-6 text-center border border-emerald-100">
                <p className="text-emerald-800 font-bold">🎉 출시 알림 신청이 완료되었습니다!</p>
                <p className="text-emerald-600 text-sm mt-1">소식을 가장 먼저 전해드릴게요.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-blue-50 p-6 border border-blue-100 shadow-sm">
            <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <span>📧</span> 출시 알림 받기
            </h3>
            <p className="mt-1 text-sm text-blue-700 font-medium">서비스가 준비되면 이메일로 알려드립니다.</p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
                <input
                    type="email"
                    placeholder="email@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-xl border border-blue-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={status === "loading"}
                />
                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                    {status === "loading" ? "신청 중..." : "신청하기"}
                </button>
            </form>
            {status === "error" && (
                <p className="mt-2 text-xs text-red-600 font-bold">오류가 발생했습니다. 다시 시도해 주세요.</p>
            )}
        </div>
    );
}
