"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

type FormState = {
  name: string;
  tagline: string;
  websiteUrl: string;
  supportUrl: string;
  thumbnailUrl: string;
  status: "IDEA" | "VALIDATING" | "DEVELOPING" | "RELEASED" | "GROWING" | "PAUSED" | "PIVOTED";

  // Template specific fields
  problemState: string;
  solutionState: string;
  featureList: string;
  socialProof: string;
};

type ApiResult<T> = {
  data?: T;
  error?: { code: string; message: string };
};


const INITIAL_FORM: FormState = {
  name: "",
  tagline: "",
  websiteUrl: "",
  supportUrl: "",
  thumbnailUrl: "",
  status: "IDEA",
  problemState: "",
  solutionState: "",
  featureList: "- 핵심 기능 1\n- 핵심 기능 2\n- 핵심 기능 3",
  socialProof: ""
};

export default function RegisterForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; name: string } | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const combinedDetailContent = `
## 이런 문제, 겪고 계시나요?
${form.problemState.trim() || "(내용 없음)"}

---

## 우리의 솔루션
${form.solutionState.trim() || "(내용 없음)"}

---

## 핵심 기능
${form.featureList.trim() || "(내용 없음)"}

${form.socialProof.trim() ? `\n---\n\n## 검증 결과 및 사용자 후기 (Social Proof)\n${form.socialProof.trim()}` : ""}
    `.trim();

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          detailContent: combinedDetailContent
        })
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

          <label className="block">
            <span className="text-sm font-semibold">현재 진행 상태</span>
            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value as any)}
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
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

          {/* 템플릿 입력 영역 */}
          <div className="mt-6 flex flex-col gap-6 rounded-2xl border border-ink/10 bg-canvas/30 p-5 sm:p-7">
            <div>
              <h3 className="text-lg font-bold text-ink">상세 소개 템플릿</h3>
              <p className="mt-1 text-sm text-ink/60">아래 4가지 항목을 작성하면 템플릿에 맞게 자동으로 상세 페이지가 구성됩니다.</p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-ink hover:text-support">1. 문제 정의 (어떤 문제를 해결하나요?)</span>
                <p className="mb-1 text-xs text-ink/60">가장 공감할 수 있는 고객의 Pain Point를 적어주세요.</p>
                <textarea
                  value={form.problemState}
                  onChange={(event) => updateField("problemState", event.target.value)}
                  className="mt-1.5 h-24 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
                  placeholder="예: 기존의 앱들은 너무 기능이 많아서 오히려 집중하기 어려웠습니다."
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-ink hover:text-support">2. 솔루션 소개 (어떻게 해결하나요?)</span>
                <textarea
                  value={form.solutionState}
                  onChange={(event) => updateField("solutionState", event.target.value)}
                  className="mt-1.5 h-24 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
                  placeholder="예: 우리는 단 하나의 버튼만 남긴 초단순 UI를 제공하여 몰입을 돕습니다."
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-ink hover:text-support">3. 핵심 기능 설명</span>
                <p className="mb-1 text-xs text-ink/60">마크다운 리스트 형식(-)으로 작성하면 깔끔합니다.</p>
                <textarea
                  value={form.featureList}
                  onChange={(event) => updateField("featureList", event.target.value)}
                  className="mt-1.5 h-32 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support cursor-text"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-ink hover:text-support">4. 검증 결과 및 사회적 증거 (Social Proof - 선택)</span>
                <p className="mb-1 text-xs text-ink/60">사용자들의 후기나, 지금까지의 성과(다운로드 수 등)를 자유롭게 뽐내주세요.</p>
                <textarea
                  value={form.socialProof}
                  onChange={(event) => updateField("socialProof", event.target.value)}
                  className="mt-1.5 h-24 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
                  placeholder="예: 클로즈 베타 3일만에 1,000명의 대기자가 모였습니다!"
                />
              </label>
            </div>
          </div>

          <label className="block mt-6">
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
