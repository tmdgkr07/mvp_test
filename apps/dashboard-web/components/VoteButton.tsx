"use client";

import confetti from "canvas-confetti";
import { ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function VoteButton({ projectId, initialVotes }: { projectId: string; initialVotes: number }) {
  const [votes, setVotes] = useState(initialVotes);
  const [loading, setLoading] = useState(false);

  async function handleVote(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (loading) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 36,
      spread: 62,
      origin: { x, y },
      colors: ["#1d79d8", "#7fb5ff", "#cfe6ff"]
    });

    setVotes((current) => current + 1);
    setLoading(true);

    try {
      await fetch(`/api/projects/${projectId}/vote`, { method: "POST" });
    } catch {
      setVotes((current) => Math.max(current - 1, 0));
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleVote}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-[#bfd8f8] bg-[#edf5ff] px-4 py-2.5 text-sm font-black text-[#1d79d8] shadow-[0_16px_32px_-28px_rgba(23,68,129,0.3)] transition-all hover:-translate-y-0.5 hover:border-[#1d79d8] hover:bg-[#deefff] disabled:opacity-70"
    >
      <ThumbsUp className="h-4 w-4" />
      <span>Votes {votes}</span>
    </motion.button>
  );
}
