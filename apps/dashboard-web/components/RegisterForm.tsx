"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import type { DisplayProjectStatus } from "@/lib/project-status";
import { PROJECT_STATUS_OPTIONS } from "@/lib/project-status";

type FormState = {
  name: string;
  tagline: string;
  websiteUrl: string;
  supportUrl: string;
  thumbnailUrl: string;
  status: DisplayProjectStatus;

  // Template specific fields
  hookHeadline: string;
  hookSubtext: string;
  painPoints: string;
  solutionHeadline: string;
  features: string;
  howItWorks: string;
  beforeAfter: string;
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
  hookHeadline: "",
  hookSubtext: "",
  painPoints: "",
  solutionHeadline: "",
  features: "",
  howItWorks: "",
  beforeAfter: "",
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
              {PROJECT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* 템플릿 입력 영역 */}
          <div className="mt-6 flex flex-col gap-6 rounded-2xl border border-ink/10 bg-canvas/30 p-5 sm:p-7">
            <div>
              <h3 className="text-lg font-bold text-ink">상세 소개 템플릿 (NoMakerLab 포맷)</h3>
              <p className="mt-1 text-sm text-ink/60">아래 항목들을 작성하면 검증에 특화된 상세 페이지가 자동 구성됩니다.</p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-ink hover:text-support">1. Hook (관심을 끌 헤드라인)</span>
                <p className="mb-1 text-xs text-ink/60">사용자의 눈길을 사로잡을 매력적인 헤드라인과 서브텍스트를 작성하세요.</p>
                <div className="mt-1.5 space-y-2">
                  <input
                    value={form.hookHeadline}
                    onChange={(event) => updateField("hookHeadline", event.target.value)}
                    className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
                    placeholder="헤드라인 (예: 학습의 미래, AI가 바꿉니다)"
                  />
                  <input
                    value={form.hookSubtext}
                    onChange={(event) => updateField("hookSubtext", event.target.value)}
                    className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
                    placeholder="서브텍스트 (예: 더 이상 획일적인 커리큘럼에 맞출 필요가 없습니다)"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-ink hover:text-support">2. Pain Points (해결하려는 문제점)</span>
                <p className="mb-1 text-xs text-ink/60">가장 공감할 수 있는 고객의 Pain Point를 이모지와 함께 적어주세요.</p>
                <textarea
                  value={form.painPoints}
                  onChange={(event) => updateField("painPoints", event.target.value)}
                  className="mt-1.5 h-20 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
                  placeholder="- 😭 문제점 1&#10;- 😡 문제점 2"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-ink hover:text-support">3. Solution (핵심 솔루션과 기능)</span>
                <div className="mt-1.5 space-y-2">
                  <input
                    value={form.solutionHeadline}
                    onChange={(event) => updateField("solutionHeadline", event.target.value)}
                    className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
                    placeholder="솔루션 헤드라인 (예: 우리의 완벽한 솔루션)"
                  />
                  <textarea
                    value={form.features}
                    onChange={(event) => updateField("features", event.target.value)}
                    className="h-24 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support cursor-text"
                    placeholder="주요 기능 설명들을 작성해주세요."
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-ink hover:text-support">4. How it Works (작동 방식)</span>
                <p className="mb-1 text-xs text-ink/60">사용자가 서비스를 어떻게 이용하는지 단계별로 설명해주세요. (2~5단계)</p>
                <textarea
                  value={form.howItWorks}
                  onChange={(event) => updateField("howItWorks", event.target.value)}
                  className="mt-1.5 h-24 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support cursor-text"
                  placeholder="1단계: 회원가입&#10;2단계: 사진 업로드&#10;3단계: 결과 확인"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-ink hover:text-support">5. Before & After (기존 방식 vs 우리 서비스)</span>
                <p className="mb-1 text-xs text-ink/60">기존 방식과 비교했을 때 얼마나 좋아지는지 보여주세요.</p>
                <textarea
                  value={form.beforeAfter}
                  onChange={(event) => updateField("beforeAfter", event.target.value)}
                  className="mt-1.5 h-20 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support cursor-text"
                  placeholder="기존: 복잡하고 오래 걸림&#10;우리 서비스: 단 한 번의 클릭으로 해결!"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-ink hover:text-support">6. Social Proof (사용자 후기)</span>
                <p className="mb-1 text-xs text-ink/60">기대 반응이나 예상 후기도 좋습니다.</p>
                <textarea
                  value={form.socialProof}
                  onChange={(event) => updateField("socialProof", event.target.value)}
                  className="mt-1.5 h-20 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
                  placeholder="진짜 제가 원하던 거였어요! (대학생, 25세)"
                />
              </label>
            </div>
          </div>

          <label className="block mt-6">
            <span className="text-sm font-semibold">프로젝트 URL *</span>
            <input
              type="text"
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
              type="text"
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
              type="text"
              value={form.thumbnailUrl}
              onChange={(event) => updateField("thumbnailUrl", event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-support"
              placeholder="https://images.example.com/thumb.png"
            />
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
