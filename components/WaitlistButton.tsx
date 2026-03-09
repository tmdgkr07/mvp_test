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
            <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 p-8 text-center border-2 border-emerald-200/60 shadow-lg">
                <p className="text-4xl mb-3 animate-bounce inline-block">🎉</p>
                <p className="text-xl font-black text-emerald-900">신청 완료되었습니다!</p>
                <p className="text-emerald-700 text-sm mt-2 font-medium">🚀 서비스가 준비되면 이메일로 가장 먼저 알려드릴게요.</p>
            </div>
        );
    }

    return (
        <div className="rounded-3xl bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 p-8 border border-blue-200/60 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📧</span>
                <h3 className="text-2xl font-black text-blue-900">출시 알림 받기</h3>
            </div>
            <p className="mt-1 text-sm text-blue-700 font-medium mb-6">서비스가 준비되면 이메일로 가장 먼저 알려드립니다.</p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="email"
                    placeholder="email@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-2xl border-2 border-blue-200 px-5 py-3.5 text-sm font-medium bg-white/80 backdrop-blur-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-300/50 transition-all disabled:opacity-50 placeholder:text-slate-400"
                    disabled={status === "loading"}
                />
                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3.5 text-sm font-black text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-cyan-700 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-700/50"
                >
                    {status === "loading" ? "신청 중..." : "신청하기"}
                </button>
            </form>
            {status === "error" && (
                <p className="mt-4 text-sm text-red-600 font-bold bg-red-50 rounded-xl px-4 py-2 border border-red-200">⚠️ 오류가 발생했습니다. 다시 시도해 주세요.</p>
            )}
        </div>
    );
}
