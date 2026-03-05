"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProjectEditor from "@/components/ProjectEditor";
import type { Project } from "@/lib/types";

type ApiResult<T> = {
  data?: T;
  error?: { code: string; message: string };
};

export default function ProjectDetailClient({ project }: { project: Project }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canEdit = Boolean(session?.user?.id && project.ownerId && session.user.id === project.ownerId);

  if (!canEdit) {
    return null;
  }

  async function onDelete() {
    const confirmed = window.confirm("정말 삭제하시겠습니까? 완전 삭제는 아니며 나중에 복구할 수 있습니다.");
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE"
      });
      const payload = (await response.json()) as ApiResult<{ project: Project }>;
      if (!response.ok || !payload.data?.project) {
        throw new Error(payload.error?.message || "삭제에 실패했습니다.");
      }

      router.push("/");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="mt-8">
      <div className="flex gap-2">
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-xl bg-ink px-5 py-2 text-sm font-semibold text-white"
          >
            수정하기
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-xl border border-ink/20 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
          >
            수정 닫기
          </button>
        )}

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {deleting ? "삭제 중..." : "삭제하기"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {editing && <ProjectEditor project={project} />}
    </section>
  );
}
