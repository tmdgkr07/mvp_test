"use client";

import { useState } from "react";
import confetti from "canvas-confetti";

export default function VoteButton({ projectId, initialVotes }: { projectId: string; initialVotes: number }) {
    const [votes, setVotes] = useState(initialVotes);
    const [loading, setLoading] = useState(false);

    const handleVote = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (loading) return;

        // Sparkle confetti!
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
            particleCount: 50,
            spread: 60,
            origin: { x, y },
            colors: ["#FFA500", "#FF4500", "#FFD700"]
        });

        setVotes((prev) => prev + 1);
        setLoading(true);

        try {
            await fetch(`/api/projects/${projectId}/vote`, { method: "POST" });
        } catch {
            setVotes((prev) => prev - 1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleVote}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all text-sm font-bold shadow-sm ${votes > initialVotes ? "bg-orange-100 text-orange-600 scale-105" : "bg-ink/5 text-ink/70 hover:bg-ink/10 hover:scale-105"}`}
        >
            🔥 {votes}
        </button>
    );
}
