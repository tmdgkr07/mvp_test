import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "MINI-TIPS | 후원과 피드백으로 검증이 남는 구조",
  description: "AI 시대 1인 빌더를 위한 서비스 검증 인프라 플랫폼. 후원, 피드백, 데이터로 작은 서비스를 검증 가능한 도전으로 바꿉니다."
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />

      {/* 문제 섹션 */}
      <section className="bg-white px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-sm font-semibold text-yellow-500 mb-4">대부분 이렇게 막힙니다</p>
          <h2 className="text-center text-4xl font-black text-slate-900 mb-16">
            만들 수는 있는데<br />다음 걸음을 모르겠어요
          </h2>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-2xl mb-3">😤</p>
              <p className="font-bold text-slate-900 mb-1">흩어진 반응 데이터</p>
              <p className="text-sm text-slate-500">반응을 얻으려면 SNS, DM, 댓글, 메일을 모두 일일이 뒤져야 합니다.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-2xl mb-3">😤</p>
              <p className="font-bold text-slate-900 mb-1">섞여버린 피드백</p>
              <p className="text-sm text-slate-500">서비스가 여러 개면 후원, 피드백, 데이터가 서로 섞여 구분하기 어렵습니다.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-2xl mb-3">😤</p>
              <p className="font-bold text-slate-900 mb-1">불명확한 다음 단계</p>
              <p className="text-sm text-slate-500">무엇을 고쳐야 하는지, 서버 유지비를 어떻게 감당할지 막막합니다.</p>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-slate-500">
            💡 MINI-TIPS는 결과 화면에서 바로 후원과 피드백을 받아<br />
            <span className="font-semibold text-slate-700">검증 데이터와 초기 수익을 동시에 만드는 구조</span>를 제공합니다.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 px-6 py-24 sm:px-10 border-t border-slate-200">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-sm font-semibold text-yellow-500 mb-4">그래서 이곳은 검증 인프라입니다</p>
          <h2 className="text-center text-4xl font-black text-slate-900 mb-16">
            후원이 아니라,<br />검증이 남는 구조를 만듭니다
          </h2>

          <div className="space-y-12">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-slate-900 font-black text-sm">1</div>
              <div>
                <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">STEP 1</p>
                <p className="text-xl font-black text-slate-900 mb-2">서비스를 MINI-TIPS에 등록하세요</p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  URL 하나로 서비스를 등록하고, 스크립트 한 줄을 결과 화면에 붙입니다.<br />
                  후원 버튼과 피드백 폼이 자동으로 임베드됩니다.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-slate-900 font-black text-sm">2</div>
              <div>
                <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">STEP 2</p>
                <p className="text-xl font-black text-slate-900 mb-2">사용자가 결과를 보는 그 순간, 반응이 쌓입니다</p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  미니팁 1,000원 / 커피 한 잔 3,900원 / 밥 한 끼 6,900원.<br />
                  후원 직후 짧은 피드백 질문으로 자연스럽게 연결됩니다.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-slate-900 font-black text-sm">3</div>
              <div>
                <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">STEP 3</p>
                <p className="text-xl font-black text-slate-900 mb-2">감이 아니라 데이터로 다음 방향을 결정합니다</p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  대시보드에서 전환율, 이탈구간, 피드백 우선순위를 확인합니다.<br />
                  AI가 다음 업데이트 우선순위를 자동으로 제안합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 밥알 시스템 */}
      <section className="bg-white px-6 py-24 sm:px-10 border-t border-slate-200">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-4xl mb-4">🍚</p>
          <h2 className="text-3xl font-black text-slate-900 mb-4">밥알(Bab-al) 크레딧 시스템</h2>
          <p className="text-slate-500 mb-12">
            플랫폼 안에서는 돈이 아니라 응원과 피드백이 오갑니다.<br />
            1밥알 = 1,000원. 누군가의 시도를 먹여 살린다는 의미입니다.
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-2xl font-black text-slate-900 mb-1">5 밥알</p>
              <p className="text-xs text-slate-500 mb-3">₩5,000</p>
              <p className="text-sm font-semibold text-slate-700">Starter</p>
            </div>
            <div className="rounded-2xl border-2 border-yellow-400 bg-yellow-50 p-6 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 text-xs font-black px-3 py-1 rounded-full">인기</span>
              <p className="text-2xl font-black text-slate-900 mb-1">10 밥알</p>
              <p className="text-xs text-slate-500 mb-3">₩10,000</p>
              <p className="text-sm font-semibold text-slate-700">Supporter</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-2xl font-black text-slate-900 mb-1">30 밥알</p>
              <p className="text-xs text-slate-500 mb-3">₩30,000</p>
              <p className="text-sm font-semibold text-slate-700">Angel</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-black text-white mb-4">
            감으로 갈지,<br />
            <span className="text-yellow-400">데이터로 갈지.</span>
          </h2>
          <p className="text-slate-400 mb-10">
            좋은 아이디어가 흩어지지 않고,<br />반응과 데이터로 성장하는 구조를 만드세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-yellow-400 hover:bg-yellow-500 px-8 text-base font-bold text-slate-900 transition-all"
            >
              내 서비스 등록하기
            </Link>
            <Link
              href="/explore"
              className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 px-8 text-base font-bold transition-all"
            >
              다른 서비스 둘러보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-8 text-xs text-slate-600">
            ✓ 무료로 시작 &nbsp;·&nbsp; ✓ 신용카드 불필요 &nbsp;·&nbsp; ✓ 언제든 시작/중단 가능
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div>
              <h3 className="font-black text-slate-900 mb-2">MINI-TIPS</h3>
              <p className="text-sm text-slate-500">후원과 피드백으로 검증이 남는 구조를 만듭니다.<br />작은 서비스를 검증 가능한 도전으로 바꿉니다.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-3">둘러보기</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="/explore" className="hover:text-yellow-500 transition-colors">서비스 탐색</a></li>
                <li><a href="/dashboard" className="hover:text-yellow-500 transition-colors">빌더 대시보드</a></li>
                <li><a href="/register" className="hover:text-yellow-500 transition-colors">서비스 등록</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-3">더 알아보기</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-yellow-500 transition-colors">이용약관</a></li>
                <li><a href="#" className="hover:text-yellow-500 transition-colors">개인정보처리방침</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8 text-center">
            <p className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} MINI-TIPS. Team 유쾌한청년들.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
