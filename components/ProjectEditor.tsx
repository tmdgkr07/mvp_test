"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import type { Project } from "@/lib/types";

type ApiResult<T> = {
  data?: T;
  error?: { code: string; message: string };
};

type EditorTab = "write" | "preview";

export default function ProjectEditor({ project }: { project: Project }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: project.name,
    tagline: project.tagline,
    detailContent: project.detailContent,
    websiteUrl: project.websiteUrl,
    supportUrl: project.supportUrl,
    thumbnailUrl: project.thumbnailUrl
  });
  const [tab, setTab] = useState<EditorTab>("write");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function appendTemplate(template: string) {
    setForm((prev) => ({
      ...prev,
      detailContent: prev.detailContent ? `${prev.detailContent}\n\n${template}` : template
    }));
  }

  async function onSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as ApiResult<{ project: Project }>;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "저장에 실패했습니다.");
      }

      setForm({
        name: payload.data.project.name,
        tagline: payload.data.project.tagline,
        detailContent: payload.data.project.detailContent,
        websiteUrl: payload.data.project.websiteUrl,
        supportUrl: payload.data.project.supportUrl,
        thumbnailUrl: payload.data.project.thumbnailUrl
      });
      setMessage("프로젝트 정보가 수정되었습니다.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="mt-3 rounded-2xl bg-paper p-6 shadow-card">
      <h2 className="text-xl font-bold">프로젝트 수정</h2>
      <p className="mt-1 text-sm text-ink/70">수정할 항목 이름을 확인하면서 편집하세요.</p>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-ink">프로젝트명</span>
          <input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm" />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-ink">한 줄 소개</span>
          <input value={form.tagline} onChange={(e) => updateField("tagline", e.target.value)} className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm" />
        </label>

        <div className="rounded-xl border border-ink/15 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink">상세 페이지 본문 (Markdown)</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => setTab("write")} className={`rounded-md px-3 py-1 text-xs font-semibold ${tab === "write" ? "bg-ink text-white" : "bg-ink/10"}`}>
                에디터
              </button>
              <button type="button" onClick={() => setTab("preview")} className={`rounded-md px-3 py-1 text-xs font-semibold ${tab === "preview" ? "bg-ink text-white" : "bg-ink/10"}`}>
                미리보기
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => appendTemplate("## 섹션 제목\n내용을 입력하세요.")} className="rounded-md border border-ink/20 px-2 py-1 text-xs">제목 추가</button>
            <button type="button" onClick={() => appendTemplate("![이미지 설명](https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80)")} className="rounded-md border border-ink/20 px-2 py-1 text-xs">이미지 추가</button>
            <button type="button" onClick={() => appendTemplate("---")} className="rounded-md border border-ink/20 px-2 py-1 text-xs">구분선 추가</button>
          </div>

          {tab === "write" ? (
            <textarea
              value={form.detailContent}
              onChange={(e) => updateField("detailContent", e.target.value)}
              className="mt-3 h-52 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm"
              placeholder="블로그처럼 문단/제목/이미지를 작성할 수 있습니다."
            />
          ) : (
            <div className="mt-3 min-h-52 rounded-xl border border-ink/10 bg-canvas/60 p-3">
              {form.detailContent.trim() ? <MarkdownRenderer content={form.detailContent} /> : <p className="text-sm text-ink/60">미리볼 본문이 없습니다.</p>}
            </div>
          )}
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-ink">프로젝트 URL</span>
          <input value={form.websiteUrl} onChange={(e) => updateField("websiteUrl", e.target.value)} className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm" />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-ink">후원 URL</span>
          <input value={form.supportUrl} onChange={(e) => updateField("supportUrl", e.target.value)} className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm" />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-ink">썸네일 URL</span>
          <input value={form.thumbnailUrl} onChange={(e) => updateField("thumbnailUrl", e.target.value)} className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm" />
        </label>
      </div>

      {message && <p className="mt-3 text-sm text-support">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button disabled={saving} className="rounded-xl bg-ink px-5 py-2 text-sm font-semibold text-white disabled:opacity-70">
          {saving ? "저장 중..." : "수정 저장"}
        </button>
      </div>
    </form>
  );
}
