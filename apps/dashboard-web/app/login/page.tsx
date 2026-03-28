import type { Route } from "next";
import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import LoginButton from "@/components/LoginButton";
import MarketingShell from "@/components/MarketingShell";
import { auth } from "@/lib/auth";
import { sanitizeCallbackUrl } from "@/lib/auth-routing";

export const metadata: Metadata = {
  title: "Login | feedback4U",
  description: "Sign in to register or manage your service on feedback4U."
};

export const preferredRegion = "icn1";

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    message?: string;
  }>;
};

const BENEFITS = [
  { icon: LockKeyhole, text: "Google 계정으로 빠르게 시작" },
  { icon: ShieldCheck, text: "로그인 후 작업 화면으로 자연스럽게 복귀" },
  { icon: Sparkles, text: "서비스 등록과 수정 권한을 안전하게 보호" }
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, resolvedSearchParams] = await Promise.all([auth(), searchParams]);
  const safeCallbackUrl = sanitizeCallbackUrl(resolvedSearchParams.callbackUrl);

  if (session?.user?.id) {
    redirect(safeCallbackUrl as Route);
  }

  return (
    <MarketingShell>
      <section className="page-container py-8 lg:py-10">
        <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="panel-card bg-[linear-gradient(135deg,#8ec0ff_0%,#5d9eef_36%,#a9d3ff_100%)] px-6 py-7 text-white sm:px-7">
            <p className="section-eyebrow text-white/90">Secure Access</p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Sign in to your
              <br />
              feedback4U workspace.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/86 sm:text-base">
              서비스 등록, 프로젝트 수정, 운영 지표 확인까지 모두 로그인 후 이어서 진행할 수 있습니다.
            </p>

            <div className="mt-6 space-y-3">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 rounded-[20px] border border-white/30 bg-white/12 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-white/92">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card px-6 py-7 sm:px-7">
            <p className="section-eyebrow">Login Required</p>
            <h2 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">계속 진행하려면 로그인해주세요</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              로그인 후에는 서비스 등록, 상세 페이지 수정, 메이커 운영 화면까지 바로 이어서 사용할 수 있습니다.
            </p>

            <div className="mt-6 rounded-[24px] border border-[#dce8f7] bg-[#f8fbff] p-5">
              <p className="text-sm font-bold text-slate-900">Google 로그인</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                기존 Google 계정으로 간편하게 로그인하고, 보고 있던 페이지로 다시 돌아옵니다.
              </p>
              <div className="mt-5">
                <LoginButton callbackUrl={safeCallbackUrl} />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/explore" className="brand-button-secondary flex-1">
                서비스 둘러보기
              </Link>
              <Link href="/" className="brand-button flex-1">
                홈으로 이동
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
