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
    thumbnailUrl: project.thumbnailUrl,
    status: project.status,
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

## 🚨 Pain Points (이런 점이 불편하지 않으셨나요?)
${form.painPoints.trim() || "(내용 없음)"}

---

## 💡 ${form.solutionHeadline.trim() || "우리의 핵심 솔루션"}
${form.features.trim() || "(내용 없음)"}

---

## ⚙️ How it Works (이렇게 작동합니다)
${form.howItWorks.trim() || "(내용 없음)"}

---

## 🔄 기존 방식 vs 우리 서비스
${form.beforeAfter.trim() || "(내용 없음)"}

${form.socialProof.trim() ? `\n---\n\n## 💬 Social Proof (사용자 후기 및 기대 반응)\n${form.socialProof.trim()}` : ""}
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
        status: payload.data.project.status,
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

        <label className="block">
          <span className="text-sm font-semibold text-ink">현재 진행 상태</span>
          <select
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm"
          >
            <option value="IDEA">아이디어 (Idea)</option>
            <option value="VALIDATING">검증 중 (Validating)</option>
            <option value="DEVELOPING">개발 중 (Developing)</option>
            <option value="RELEASED">출시 완료 (Released)</option>
            <option value="GROWING">성장 중 (Growing)</option>
            <option value="PAUSED">일시 중단 (Paused)</option>
            <option value="PIVOTED">피봇 (Pivoted)</option>
          </select>
        </label>

        <div className="rounded-xl border border-ink/15 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink">상세 페이지 본문 (Markdown 원본 편집기)</span>
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

        {/* 템플릿 입력 영역 (선택) */}
        <div className="flex flex-col gap-4 rounded-2xl border border-ink/20 border-dashed bg-white p-5">
          <div>
            <h3 className="text-sm font-bold text-ink">템플릿으로 본문 덮어쓰기 (주의)</h3>
            <p className="mt-1 text-xs text-ink/60">아래 템플릿을 작성하고 저장하면 기존 마크다운 원본이 초기화되고 템플릿 내용으로 덮어써집니다.</p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-ink hover:text-support">1. Hook (헤드라인)</span>
              <div className="mt-1.5 space-y-2">
                <input
                  value={form.hookHeadline}
                  onChange={(event) => updateField("hookHeadline", event.target.value)}
                  className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
                  placeholder="관심을 끌 메인 헤드라인"
                />
                <input
                  value={form.hookSubtext}
                  onChange={(event) => updateField("hookSubtext", event.target.value)}
                  className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
                  placeholder="서브텍스트 설명"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-ink hover:text-support">2. Pain Points (문제점)</span>
              <textarea
                value={form.painPoints}
                onChange={(event) => updateField("painPoints", event.target.value)}
                className="mt-1.5 h-16 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-ink hover:text-support">3. Solution (솔루션과 기능)</span>
              <div className="mt-1.5 space-y-2">
                <input
                  value={form.solutionHeadline}
                  onChange={(event) => updateField("solutionHeadline", event.target.value)}
                  className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
                  placeholder="솔루션 핵심 헤드라인"
                />
                <textarea
                  value={form.features}
                  onChange={(event) => updateField("features", event.target.value)}
                  className="h-20 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
                  placeholder="주요 기능 설명"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-ink hover:text-support">4. How it Works (작동 방식)</span>
              <textarea
                value={form.howItWorks}
                onChange={(event) => updateField("howItWorks", event.target.value)}
                className="mt-1.5 h-20 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-ink hover:text-support">5. Before & After</span>
              <textarea
                value={form.beforeAfter}
                onChange={(event) => updateField("beforeAfter", event.target.value)}
                className="mt-1.5 h-16 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-ink hover:text-support">6. Social Proof (후기)</span>
              <textarea
                value={form.socialProof}
                onChange={(event) => updateField("socialProof", event.target.value)}
                className="mt-1.5 h-16 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
              />
            </label>
          </div>
        </div>

        <label className="block mt-6">
          <span className="text-sm font-semibold text-ink">프로젝트 URL</span>
          <input type="text" value={form.websiteUrl} onChange={(e) => updateField("websiteUrl", e.target.value)} className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm" />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-ink">후원 URL</span>
          <input type="text" value={form.supportUrl} onChange={(e) => updateField("supportUrl", e.target.value)} className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm" />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-ink">썸네일 URL</span>
          <input type="text" value={form.thumbnailUrl} onChange={(e) => updateField("thumbnailUrl", e.target.value)} className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm" />
          <details className="mt-2 text-xs text-ink/70">
            <summary className="cursor-pointer font-bold hover:text-ink">URL 제작 요령 (클릭하여 열기)</summary>
            <div className="mt-2 space-y-1 pl-2">
              <p>썸네일 URL에는 반드시 <strong>`.png`, `.jpg`, `.jpeg` 등 확장자로 끝나는 순수 이미지 직접 주소(Direct Link)</strong>만 들어가야 합니다. 앨범이나 웹페이지 주소는 안 됩니다!</p>
              <div className="mt-1">
                <span className="font-semibold text-ink">🛠️ 무료로 만드는 방법:</span>
                <ul className="list-inside list-disc">
                  <li><a href="https://imgur.com/" target="_blank" rel="noopener noreferrer" className="text-support underline">Imgur</a> 혹은 원하시는 이미지 호스팅 사이트에 이미지를 업로드하세요.</li>
                  <li>업로드된 이미지 위에서 <strong>오른쪽 마우스 클릭</strong>을 하세요.</li>
                  <li><strong>'이미지 주소 복사(Copy image address)'</strong>를 누른 후 여기에 붙여넣으세요.</li>
                  <li className="text-red-500">주의: 구글 드라이브나 노션 링크는 보안 문제로 썸네일로 보이지 않습니다!</li>
                </ul>
              </div>
            </div>
          </details>
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
