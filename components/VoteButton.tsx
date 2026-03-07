"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

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
            particleCount: 40,
            spread: 70,
            origin: { x, y },
            colors: ["#E16A2F", "#0C6A6D", "#FFD700"]
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
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleVote}
            className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all text-sm font-black shadow-sm ${votes > initialVotes
                ? "bg-accent text-white"
                : "bg-ink/5 text-ink/60 hover:bg-ink/10"
                }`}
        >
            <span className="text-base">🔥</span>
            <span>{votes}</span>
        </motion.button>
    );
}
