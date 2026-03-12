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
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={handleVote}
            disabled={loading}
            className={`inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-all text-sm font-black shadow-md hover:shadow-lg border group ${
                votes > initialVotes
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-600/50 hover:from-blue-600 hover:to-indigo-600"
                    : "bg-gradient-to-r from-orange-400 to-yellow-400 text-white border-orange-500/50 hover:from-orange-500 hover:to-yellow-500 hover:-translate-y-0.5"
            }`}
        >
            <span className="text-lg group-hover:rotate-12 transition-transform inline-block">🔥</span>
            <span className="font-bold">{votes}</span>
        </motion.button>
    );
}
