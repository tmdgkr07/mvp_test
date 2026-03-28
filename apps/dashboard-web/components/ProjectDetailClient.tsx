"use client";

import { PencilLine, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
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

      router.push("/explore");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="mb-6 space-y-4">
      <div className="soft-card flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-eyebrow">Owner Controls</p>
          <p className="mt-2 text-lg font-black text-slate-950">프로젝트 소개와 링크를 직접 수정할 수 있습니다.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {!editing ? (
            <button type="button" onClick={() => setEditing(true)} className="brand-button gap-2 px-5 py-2.5">
              <PencilLine className="h-4 w-4" />
              서비스 편집
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="brand-button-secondary gap-2 px-5 py-2.5"
            >
              <X className="h-4 w-4" />
              편집 닫기
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#dc2626] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#b91c1c] disabled:opacity-70"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "삭제 중..." : "삭제하기"}
          </button>
        </div>
      </div>

      {error ? <p className="rounded-[20px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {editing ? <ProjectEditor project={project} /> : null}
    </section>
  );
}
