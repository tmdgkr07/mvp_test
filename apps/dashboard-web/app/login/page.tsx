import type { Route } from "next";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import LoginButton from "@/components/LoginButton";
import Navbar from "@/components/Navbar";
import { auth } from "@/lib/auth";
import { sanitizeCallbackUrl } from "@/lib/auth-routing";

export const metadata: Metadata = {
  title: "로그인 | 밥주세요",
  description: "권한이 필요한 기능을 이용하려면 로그인해 주세요"
};

export const preferredRegion = "icn1";

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, resolvedSearchParams] = await Promise.all([auth(), searchParams]);
  const { callbackUrl } = resolvedSearchParams;
  const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);

  if (session?.user?.id) {
    redirect(safeCallbackUrl as Route);
  }

  return (
    <>
      <Navbar />

      <main className="min-h-[calc(100vh-72px)] bg-[#F9F7F3] px-6 py-16">
        <div className="mx-auto max-w-md">
          <div className="rounded-[32px] border border-[#EBEBEB] bg-white p-8 shadow-card sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B79A18]">Login Required</p>
            <h1 className="mt-3 text-3xl font-black text-ink">로그인 후 이용해 주세요</h1>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              서비스 등록, 마이페이지 같은 권한 기능은 로그인 후 바로 이어서 사용할 수 있습니다.
            </p>

            <div className="mt-8">
              <LoginButton callbackUrl={safeCallbackUrl} />
            </div>

            <p className="mt-4 text-xs leading-5 text-ink/55">
              로그인하면 원래 보려던 페이지로 자동 이동합니다.
            </p>

            <div className="mt-8 flex gap-3">
              <Link
                href="/explore"
                className="flex-1 rounded-full border border-ink/15 px-4 py-3 text-center text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
              >
                서비스 둘러보기
              </Link>
              <Link
                href="/"
                className="flex-1 rounded-full border border-[#E5D27A] bg-[#FFF3B3] px-4 py-3 text-center text-sm font-bold text-[#6B5300] transition-colors hover:bg-[#FFE784]"
              >
                홈으로
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
