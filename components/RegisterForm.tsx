"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

type FormState = {
  name: string;
  tagline: string;
  detailContent: string;
  websiteUrl: string;
  supportUrl: string;
  thumbnailUrl: string;
};

type ApiResult<T> = {
  data?: T;
  error?: { code: string; message: string };
};

type EditorTab = "write" | "preview";

const INITIAL_FORM: FormState = {
  name: "",
  tagline: "",
  detailContent: "",
  websiteUrl: "",
  supportUrl: "",
  thumbnailUrl: ""
};

export default function RegisterForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [tab, setTab] = useState<EditorTab>("write");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; name: string } | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function appendTemplate(template: string) {
    setForm((prev) => ({
      ...prev,
      detailContent: prev.detailContent ? `${prev.detailContent}\n\n${template}` : template
    }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as ApiResult<{ project: { id: string; name: string } }>;
      if (!response.ok || !payload.data?.project) {
        throw new Error(payload.error?.message || "등록 중 오류가 발생했습니다.");
      }

      setSuccess({ id: payload.data.project.id, name: payload.data.project.name });
      setForm(INITIAL_FORM);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 700);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <div className="rounded-3xl bg-paper p-7 shadow-card sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-support">Builder Submission</p>
            <h1 className="mt-2 text-3xl font-black text-ink">MVP 등록</h1>
          </div>
          <Link href="/" className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold hover:bg-ink/5">
            게시판 보기
          </Link>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink/75">
          등록 후 메인 카드와 SEO 상세 페이지(`/project/:id`)가 자동 생성됩니다.
        </p>

        {status !== "authenticated" && (
          <div className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Google 로그인 후 등록할 수 있습니다.</div>
        )}

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-sm font-semibold">프로젝트명 *</span>
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
              placeholder="예: Focus Sprint"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">한 줄 소개</span>
            <input
              value={form.tagline}
              onChange={(event) => updateField("tagline", event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
              placeholder="예: 25분 몰입 세션 자동 기록 도구"
            />
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
              <button type="button" onClick={() => appendTemplate("- 핵심 기능 1\n- 핵심 기능 2\n- 핵심 기능 3")} className="rounded-md border border-ink/20 px-2 py-1 text-xs">리스트 추가</button>
            </div>

            {tab === "write" ? (
              <textarea
                value={form.detailContent}
                onChange={(event) => updateField("detailContent", event.target.value)}
                className="mt-3 h-52 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm"
                placeholder="상세 페이지에 표시할 본문을 작성하세요."
              />
            ) : (
              <div className="mt-3 min-h-52 rounded-xl border border-ink/10 bg-canvas/60 p-3">
                {form.detailContent.trim() ? <MarkdownRenderer content={form.detailContent} /> : <p className="text-sm text-ink/60">미리볼 본문이 없습니다.</p>}
              </div>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-semibold">프로젝트 URL *</span>
            <input
              type="url"
              required
              value={form.websiteUrl}
              onChange={(event) => updateField("websiteUrl", event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
              placeholder="https://your-mvp.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">후원 URL *</span>
            <input
              type="url"
              required
              value={form.supportUrl}
              onChange={(event) => updateField("supportUrl", event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
              placeholder="https://toss.me/..."
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">썸네일 이미지 URL (선택)</span>
            <input
              type="url"
              value={form.thumbnailUrl}
              onChange={(event) => updateField("thumbnailUrl", event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
              placeholder="https://images.example.com/thumb.jpg"
            />
          </label>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          {success && (
            <div className="rounded-xl bg-support/10 px-4 py-3 text-sm text-support">
              <p>
                <strong>{success.name}</strong> 등록 완료
              </p>
              <p className="mt-1">잠시 후 메인 페이지로 이동합니다.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !session?.user}
            className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-ink/70"
          >
            {loading ? "등록 중..." : "MVP 등록하기"}
          </button>
        </form>
      </div>
    </main>
  );
}
