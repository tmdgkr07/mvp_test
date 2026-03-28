import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-white/70 bg-white/80 py-8 backdrop-blur-xl">
      <div className="page-container grid gap-6 md:grid-cols-[1.1fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1d79d8] text-base font-black text-white shadow-[0_14px_28px_-16px_rgba(29,121,216,0.9)]">
              F
            </div>
            <div>
              <p className="text-lg font-black text-slate-950">feedback4U</p>
              <p className="text-sm text-slate-500">AI builder support platform</p>
            </div>
          </div>

          <p className="max-w-sm text-sm leading-6 text-slate-500">
            서비스 검증, 사용자 반응 수집, 운영 링크 연결을 한 흐름으로 묶어 더 빠른 학습 루프를 만듭니다.
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-400">Explore</p>
          <div className="space-y-2 text-sm text-slate-600">
            <Link href="/#overview" className="block transition-colors hover:text-[#1d79d8]">
              서비스 소개
            </Link>
            <Link href="/explore" className="block transition-colors hover:text-[#1d79d8]">
              서비스 탐색
            </Link>
            <Link href="/register" className="block transition-colors hover:text-[#1d79d8]">
              서비스 등록
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-400">Workspace</p>
          <div className="space-y-2 text-sm text-slate-600">
            <Link href="/dashboard" className="block transition-colors hover:text-[#1d79d8]">
              워크스페이스
            </Link>
            <Link href="/login" className="block transition-colors hover:text-[#1d79d8]">
              로그인
            </Link>
            <span className="block text-slate-400">개인정보 처리 항목 준비 중</span>
          </div>
        </div>
      </div>

      <div className="page-container mt-6 border-t border-[#e6edf8] pt-5 text-sm text-slate-400">
        &copy; {new Date().getFullYear()} feedback4U.
      </div>
    </footer>
  );
}
