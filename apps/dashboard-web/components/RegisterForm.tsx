"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { DisplayProjectStatus } from "@/lib/project-status";
import { PROJECT_STATUS_OPTIONS } from "@/lib/project-status";

type FormState = {
  name: string;
  tagline: string;
  websiteUrl: string;
  supportUrl: string;
  thumbnailUrl: string;
  status: DisplayProjectStatus;
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
        router.push("/explore");
        router.refresh();
      }, 700);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel-card px-6 py-7 sm:px-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow">Builder Submission</p>
          <h2 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">서비스 등록 폼</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            필요한 정보만 빠르게 입력하고, 상세 소개는 아래 구조화 섹션에서 정리할 수 있습니다.
          </p>
        </div>

        <Link href="/explore" className="brand-button-secondary px-5 py-2.5">
          탐색 페이지 보기
        </Link>
      </div>

      {status !== "authenticated" ? (
        <div className="mt-5 rounded-[18px] border border-[#ffe0a6] bg-[#fff8e8] px-4 py-3 text-sm text-[#9a6b09]">
          Google 로그인 상태를 확인하는 중입니다. 인증이 완료되어야 등록 버튼이 활성화됩니다.
        </div>
      ) : null}

      <form className="mt-6 space-y-6" onSubmit={onSubmit}>
        <section className="rounded-[24px] border border-[#dce8f7] bg-[#f8fbff] p-5">
          <h3 className="text-lg font-black text-slate-950">기본 정보</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="field-label">서비스명 *</span>
              <input
                required
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="field-input"
                placeholder="feedback4U"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="field-label">한 줄 소개</span>
              <input
                value={form.tagline}
                onChange={(event) => updateField("tagline", event.target.value)}
                className="field-input"
                placeholder="Collect feedback and proof signals in one place."
              />
            </label>

            <label className="block">
              <span className="field-label">현재 상태</span>
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value as DisplayProjectStatus)}
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
              <input
                type="text"
                value={form.thumbnailUrl}
                onChange={(event) => updateField("thumbnailUrl", event.target.value)}
                className="field-input"
                placeholder="https://images.example.com/thumb.png"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#dce8f7] bg-white p-5">
          <h3 className="text-lg font-black text-slate-950">상세 소개 구조</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            아래 내용을 채우면 공개 상세 페이지용 설명 문서가 자동으로 구성됩니다.
          </p>

          <div className="mt-4 grid gap-4">
            <label className="block">
              <span className="field-label">헤드라인과 서브카피</span>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={form.hookHeadline}
                  onChange={(event) => updateField("hookHeadline", event.target.value)}
                  className="field-input"
                  placeholder="Your headline"
                />
                <input
                  value={form.hookSubtext}
                  onChange={(event) => updateField("hookSubtext", event.target.value)}
                  className="field-input"
                  placeholder="Supporting sentence"
                />
              </div>
            </label>

            <label className="block">
              <span className="field-label">문제 정의</span>
              <textarea
                value={form.painPoints}
                onChange={(event) => updateField("painPoints", event.target.value)}
                className="field-textarea"
                placeholder="사용자가 겪는 문제와 현재 불편함을 적어주세요."
              />
            </label>

            <label className="block">
              <span className="field-label">해결 방식과 기능</span>
              <div className="grid gap-3">
                <input
                  value={form.solutionHeadline}
                  onChange={(event) => updateField("solutionHeadline", event.target.value)}
                  className="field-input"
                  placeholder="Solution headline"
                />
                <textarea
                  value={form.features}
                  onChange={(event) => updateField("features", event.target.value)}
                  className="field-textarea"
                  placeholder="핵심 기능을 줄 단위로 정리하세요."
                />
              </div>
            </label>

            <label className="block">
              <span className="field-label">작동 방식</span>
              <textarea
                value={form.howItWorks}
                onChange={(event) => updateField("howItWorks", event.target.value)}
                className="field-textarea"
                placeholder="1. 등록 2. 연결 3. 피드백 수집"
              />
            </label>

            <label className="block">
              <span className="field-label">기존 방식 대비 차이</span>
              <textarea
                value={form.beforeAfter}
                onChange={(event) => updateField("beforeAfter", event.target.value)}
                className="field-textarea"
                placeholder="기존 방식과 비교해 어떤 점이 달라지는지 적어주세요."
              />
            </label>

            <label className="block">
              <span className="field-label">예상 반응 또는 증거</span>
              <textarea
                value={form.socialProof}
                onChange={(event) => updateField("socialProof", event.target.value)}
                className="field-textarea"
                placeholder="사용자 반응, 지표, 메모를 자유롭게 적어주세요."
              />
            </label>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#dce8f7] bg-[#f8fbff] p-5">
          <h3 className="text-lg font-black text-slate-950">서비스 링크</h3>

          <div className="mt-4 grid gap-4">
            <label className="block">
              <span className="field-label">프로젝트 URL *</span>
              <input
                type="text"
                required
                value={form.websiteUrl}
                onChange={(event) => updateField("websiteUrl", event.target.value)}
                className="field-input"
                placeholder="https://your-service.com"
              />
            </label>

            <label className="block">
              <span className="field-label">후원 URL *</span>
              <input
                type="text"
                required
                value={form.supportUrl}
                onChange={(event) => updateField("supportUrl", event.target.value)}
                className="field-input"
                placeholder="https://toss.me/..."
              />
            </label>
          </div>
        </section>

        {error ? <p className="rounded-[18px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        {success ? (
          <div className="rounded-[18px] bg-[#e9f9ef] px-4 py-4 text-sm text-[#15803d]">
            <p>
              <strong>{success.name}</strong> 등록이 완료되었습니다.
            </p>
            <p className="mt-1">곧바로 탐색 페이지로 이동합니다.</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !session?.user}
          className="brand-button w-full rounded-[22px] py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "등록 중..." : "서비스 등록하기"}
        </button>
      </form>
    </div>
  );
}
