"use client";

import { Eye, PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import type { Project } from "@/lib/types";
import { getDisplayStatusValue, PROJECT_STATUS_OPTIONS } from "@/lib/project-status";

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
    thumbnailUrl: project.thumbnailUrl,
    status: getDisplayStatusValue(project.status),
    hookHeadline: "",
    hookSubtext: "",
    painPoints: "",
    solutionHeadline: "",
    features: "",
    howItWorks: "",
    beforeAfter: "",
    socialProof: ""
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

    let finalDetailContent = form.detailContent;
    if (form.hookHeadline || form.painPoints || form.solutionHeadline || form.features || form.howItWorks || form.beforeAfter || form.socialProof) {
      finalDetailContent = `
# ${form.hookHeadline.trim() || form.name}
> ${form.hookSubtext.trim() || form.tagline}

---

## Problem
${form.painPoints.trim() || "(empty)"}

---

## ${form.solutionHeadline.trim() || "Solution"}
${form.features.trim() || "(empty)"}

---

## How it works
${form.howItWorks.trim() || "(empty)"}

---

## Before vs after
${form.beforeAfter.trim() || "(empty)"}

${form.socialProof.trim() ? `\n---\n\n## Signals\n${form.socialProof.trim()}` : ""}
      `.trim();
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, detailContent: finalDetailContent })
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
        thumbnailUrl: payload.data.project.thumbnailUrl,
        status: getDisplayStatusValue(payload.data.project.status),
        hookHeadline: "",
        hookSubtext: "",
        painPoints: "",
        solutionHeadline: "",
        features: "",
        howItWorks: "",
        beforeAfter: "",
        socialProof: ""
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
    <form onSubmit={onSave} className="panel-card px-6 py-7 sm:px-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow">Service Editor</p>
          <h2 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">프로젝트 수정</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            공개 페이지에 보이는 정보와 상세 문서를 더 촘촘한 편집 화면에서 관리할 수 있습니다.
          </p>
        </div>

        <div className="flex gap-2 rounded-full border border-[#dce8f7] bg-[#f8fbff] p-1">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={tab === "write" ? "brand-button px-4 py-2.5" : "brand-button-secondary px-4 py-2.5"}
          >
            <PencilLine className="mr-2 h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={tab === "preview" ? "brand-button px-4 py-2.5" : "brand-button-secondary px-4 py-2.5"}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6">
        <section className="rounded-[24px] border border-[#dce8f7] bg-[#f8fbff] p-5">
          <h3 className="text-lg font-black text-slate-950">기본 정보</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="field-label">프로젝트명</span>
              <input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="field-input" />
            </label>
            <label className="block md:col-span-2">
              <span className="field-label">한 줄 소개</span>
              <input value={form.tagline} onChange={(e) => updateField("tagline", e.target.value)} className="field-input" />
            </label>
            <label className="block">
              <span className="field-label">현재 상태</span>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="field-select"
              >
                {PROJECT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="field-label">썸네일 URL</span>
              <input value={form.thumbnailUrl} onChange={(e) => updateField("thumbnailUrl", e.target.value)} className="field-input" />
            </label>
            <label className="block">
              <span className="field-label">프로젝트 URL</span>
              <input value={form.websiteUrl} onChange={(e) => updateField("websiteUrl", e.target.value)} className="field-input" />
            </label>
            <label className="block">
              <span className="field-label">후원 URL</span>
              <input value={form.supportUrl} onChange={(e) => updateField("supportUrl", e.target.value)} className="field-input" />
            </label>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#dce8f7] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">상세 페이지 본문</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">마크다운 본문을 직접 수정하거나 템플릿으로 다시 구성할 수 있습니다.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => appendTemplate("## Section title\nWrite your content here.")} className="brand-button-secondary px-4 py-2.5">
                제목 추가
              </button>
              <button
                type="button"
                onClick={() => appendTemplate("![Image description](https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80)")}
                className="brand-button-secondary px-4 py-2.5"
              >
                이미지 추가
              </button>
              <button type="button" onClick={() => appendTemplate("---")} className="brand-button-secondary px-4 py-2.5">
                구분선 추가
              </button>
            </div>
          </div>

          {tab === "write" ? (
            <textarea
              value={form.detailContent}
              onChange={(e) => updateField("detailContent", e.target.value)}
              className="field-textarea mt-4 min-h-[240px]"
              placeholder="상세 설명을 입력하세요."
            />
          ) : (
            <div className="prose prose-slate mt-4 min-h-[240px] max-w-none rounded-[20px] border border-[#dce8f7] bg-[#f8fbff] p-5">
              {form.detailContent.trim() ? (
                <MarkdownRenderer content={form.detailContent} />
              ) : (
                <p className="text-sm text-slate-500">미리보기 본문이 없습니다.</p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-[#dce8f7] bg-[#f8fbff] p-5">
          <h3 className="text-lg font-black text-slate-950">구조화 입력</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            아래 내용을 채우면 상세 본문을 다시 생성할 수 있습니다.
          </p>

          <div className="mt-4 grid gap-4">
            <label className="block">
              <span className="field-label">헤드라인과 서브카피</span>
              <div className="grid gap-3 md:grid-cols-2">
                <input value={form.hookHeadline} onChange={(e) => updateField("hookHeadline", e.target.value)} className="field-input" />
                <input value={form.hookSubtext} onChange={(e) => updateField("hookSubtext", e.target.value)} className="field-input" />
              </div>
            </label>

            <label className="block">
              <span className="field-label">문제 정의</span>
              <textarea value={form.painPoints} onChange={(e) => updateField("painPoints", e.target.value)} className="field-textarea" />
            </label>

            <label className="block">
              <span className="field-label">해결 방식과 기능</span>
              <div className="grid gap-3">
                <input value={form.solutionHeadline} onChange={(e) => updateField("solutionHeadline", e.target.value)} className="field-input" />
                <textarea value={form.features} onChange={(e) => updateField("features", e.target.value)} className="field-textarea" />
              </div>
            </label>

            <label className="block">
              <span className="field-label">작동 방식</span>
              <textarea value={form.howItWorks} onChange={(e) => updateField("howItWorks", e.target.value)} className="field-textarea" />
            </label>

            <label className="block">
              <span className="field-label">기존 방식 대비 차이</span>
              <textarea value={form.beforeAfter} onChange={(e) => updateField("beforeAfter", e.target.value)} className="field-textarea" />
            </label>

            <label className="block">
              <span className="field-label">반응 또는 증거</span>
              <textarea value={form.socialProof} onChange={(e) => updateField("socialProof", e.target.value)} className="field-textarea" />
            </label>
          </div>
        </section>
      </div>

      {message ? <p className="mt-5 rounded-[18px] bg-[#e9f9ef] px-4 py-3 text-sm text-[#15803d]">{message}</p> : null}
      {error ? <p className="mt-5 rounded-[18px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-5 flex justify-end">
        <button disabled={saving} className="brand-button px-6 py-3 disabled:opacity-70">
          {saving ? "저장 중..." : "수정 저장"}
        </button>
      </div>
    </form>
  );
}
